const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../utils/db');
const { requireRole } = require('../middleware/auth');
const router = express.Router();

router.get('/', (req, res) => {
  const users = db.all('users').map(({ password, ...u }) => u);
  res.json({ success: true, data: users });
});
router.get('/activity', requireRole('admin','manager','employee'), (req, res) => {
  const logs = db.all('activityLogs').sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 100);
  res.json({ success: true, data: logs });
});
router.post('/', requireRole('admin'), (req, res) => {
  const { name, email, password, role, phone, designation } = req.body;
  if (role && !['admin','manager','employee','viewer'].includes(role)) return res.status(400).json({ success: false, message: 'Invalid role' });
  if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email, password required' });
  if (db.all('users').some(u => u.email.toLowerCase() === email.toLowerCase())) return res.status(400).json({ success: false, message: 'Email exists' });
  const user = db.insert('users', { name, email, password: bcrypt.hashSync(password, 10), role: role || 'employee', phone: phone || '', designation: designation || '', active: true });
  const { password: _, ...safe } = user;
  db.logActivity(req.user, 'create', 'users', user.id, JSON.stringify({ name:user.name, email:user.email, role:user.role }));
  res.status(201).json({ success: true, data: safe });
});
router.put('/:id', requireRole('admin'), (req, res) => {
  if (req.body.role && !['admin','manager','employee','viewer'].includes(req.body.role)) return res.status(400).json({ success: false, message: 'Invalid role' });
  const before = db.find('users', req.params.id);
  const patch = Object.fromEntries(['name','role','phone','designation','active'].filter(k => req.body[k] !== undefined).map(k => [k, req.body[k]]));
  if (req.body.password) patch.password = bcrypt.hashSync(req.body.password, 10);
  const user = db.update('users', req.params.id, patch);
  if (!user) return res.status(404).json({ success: false, message: 'Not found' });
  const { password, ...safe } = user;
  const keys = Object.keys(patch).filter(k => k !== 'password');
  db.logActivity(req.user, 'update', 'users', user.id, JSON.stringify({ before:Object.fromEntries(keys.map(k => [k,before?.[k]])), after:Object.fromEntries(keys.map(k => [k,user[k]])), passwordChanged:!!req.body.password }));
  res.json({ success: true, data: safe });
});
router.delete('/:id', requireRole('admin'), (req, res) => {
  if (String(req.params.id) === String(req.user.id)) return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
  const before = db.find('users', req.params.id);
  if (!before || !db.remove('users', req.params.id)) return res.status(404).json({ success:false, message:'Not found' });
  db.logActivity(req.user, 'delete', 'users', req.params.id, JSON.stringify({ name:before.name, email:before.email, role:before.role }));
  res.json({ success: true, message: 'Deleted' });
});

module.exports = router;
