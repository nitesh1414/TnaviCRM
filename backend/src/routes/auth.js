const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../utils/db');
const { auth, requireRole, SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
  const user = db.all('users').find(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ success: false, message: 'Invalid credentials' });
  if (user.active === false) return res.status(403).json({ success: false, message: 'Account deactivated' });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
  const { password: _, ...safe } = user;
  db.logActivity(user, 'login', 'auth', user.id, 'User logged in');
  res.json({ success: true, token, user: safe });
});

router.get('/me', auth, (req, res) => res.json({ success: true, user: req.user }));

router.post('/register', auth, requireRole('admin'), (req, res) => {
  const { name, email, password, role, phone, designation } = req.body;
  if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email, password required' });
  if (db.all('users').some(u => u.email.toLowerCase() === email.toLowerCase())) return res.status(400).json({ success: false, message: 'Email already exists' });
  const user = db.insert('users', { name, email, password: bcrypt.hashSync(password, 10), role: role || 'employee', phone: phone || '', designation: designation || '', active: true });
  const { password: _, ...safe } = user;
  res.status(201).json({ success: true, data: safe });
});

module.exports = router;
