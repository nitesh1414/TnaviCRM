const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../utils/db');
const { requireRole } = require('../middleware/auth');
const router = express.Router();

router.get('/', (req, res) => {
  const users = db.all('users').map(({ password, ...u }) => u);
  res.json({ success: true, data: users });
});
router.get('/activity', (req, res) => {
  const logs = db.all('activityLogs').sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 100);
  res.json({ success: true, data: logs });
});
router.post('/', requireRole('admin'), (req, res) => {
  const { name, email, password, role, phone, designation } = req.body;
  if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email, password required' });
  if (db.all('users').some(u => u.email.toLowerCase() === email.toLowerCase())) return res.status(400).json({ success: false, message: 'Email exists' });
  const user = db.insert('users', { name, email, password: bcrypt.hashSync(password, 10), role: role || 'employee', phone: phone || '', designation: designation || '', active: true });
  const { password: _, ...safe } = user;
  res.status(201).json({ success: true, data: safe });
});
router.put('/:id', requireRole('admin'), (req, res) => {
  const patch = { ...req.body }; delete patch.password;
  if (req.body.password) patch.password = bcrypt.hashSync(req.body.password, 10);
  const user = db.update('users', req.params.id, patch);
  if (!user) return res.status(404).json({ success: false, message: 'Not found' });
  const { password, ...safe } = user;
  res.json({ success: true, data: safe });
});
router.delete('/:id', requireRole('admin'), (req, res) => {
  if (String(req.params.id) === String(req.user.id)) return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
  db.remove('users', req.params.id);
  res.json({ success: true, message: 'Deleted' });
});

module.exports = router;
