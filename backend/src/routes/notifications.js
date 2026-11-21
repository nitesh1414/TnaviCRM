const express = require('express');
const db = require('../utils/db');
const router = express.Router();

// Generate smart reminders from live data (meetings, tasks, leases, follow-ups)
router.get('/smart', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const items = [];
  db.all('meetings').filter(m => m.date >= today && m.date <= in7 && m.status !== 'Cancelled').forEach(m => items.push({ type: 'meeting', title: 'Upcoming meeting', message: `${m.title} on ${m.date} at ${m.time || ''}`, date: m.date, relatedId: m.id }));
  db.all('tasks').filter(t => t.status === 'Pending' && t.dueDate && t.dueDate <= in7).forEach(t => items.push({ type: 'task', title: t.dueDate < today ? 'Overdue task' : 'Task due soon', message: t.title, date: t.dueDate, relatedId: t.id }));
  db.all('leases').filter(l => l.expiryDate && l.expiryDate <= in7).forEach(l => items.push({ type: 'lease', title: 'Lease expiry alert', message: `Lease expires on ${l.expiryDate}`, date: l.expiryDate, relatedId: l.id }));
  db.all('leads').filter(l => l.followUpDate && l.followUpDate <= in7 && !['Approved','Rejected'].includes(l.status)).forEach(l => items.push({ type: 'followup', title: 'Follow-up due', message: l.title, date: l.followUpDate, relatedId: l.id }));
  items.sort((a,b) => a.date.localeCompare(b.date));
  res.json({ success: true, data: items });
});

router.get('/', (req, res) => {
  let list = db.all('notifications');
  if (req.user.role !== 'admin') list = list.filter(n => String(n.userId) === String(req.user.id) || !n.userId);
  if (req.query.unread === 'true') list = list.filter(n => !n.read);
  res.json({ success: true, data: list.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)) });
});

router.patch('/:id/read', (req, res) => {
  const existing = db.find('notifications', req.params.id);
  if (!existing || (req.user.role !== 'admin' && String(existing.userId) !== String(req.user.id))) return res.status(404).json({ success: false, message: 'Not found' });
  const n = db.update('notifications', req.params.id, { read: true });
  if (!n) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: n });
});
router.patch('/read-all', (req, res) => {
  db.all('notifications').filter(n => String(n.userId) === String(req.user.id)).forEach(n => db.update('notifications', n.id, { read: true }));
  res.json({ success: true, message: 'All marked read' });
});
router.post('/', (req, res) => {
  if (!['admin', 'manager'].includes(req.user.role)) return res.status(403).json({ success: false, message: 'Access denied' });
  const n = db.insert('notifications', { userId: req.body.userId || req.user.id, title: req.body.title, message: req.body.message, type: req.body.type || 'info', relatedId: req.body.relatedId || null, read: false });
  res.status(201).json({ success: true, data: n });
});
router.delete('/:id', (req, res) => {
  const existing = db.find('notifications', req.params.id);
  if (!existing || (req.user.role !== 'admin' && String(existing.userId) !== String(req.user.id))) return res.status(404).json({ success: false, message: 'Not found' });
  db.remove('notifications', req.params.id);
  res.json({ success: true, message: 'Deleted' });
});

module.exports = router;
