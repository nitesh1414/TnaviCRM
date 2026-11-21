const express = require('express');
const db = require('../utils/db');
const { requireRole } = require('../middleware/auth');
const router = express.Router();
router.use(requireRole('admin', 'manager', 'employee'));
router.get('/', (req, res) => {
  const items = db.all('reminders').sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ success: true, data: items });
});
router.post('/', (req, res) => {
  const { channel, to, subject = '', body = '', sendAt, brandId = '', propertyId = '', meetingId = '', templateName = '', language = '', parameters = [], consent } = req.body;
  if (consent !== true) return res.status(400).json({ success: false, message: 'Confirm recipient consent before scheduling.' });
  if (!['email','whatsapp'].includes(channel) || typeof sendAt !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(sendAt) || !Number.isFinite(Date.parse(sendAt)) || new Date(sendAt).toISOString() !== sendAt || Date.parse(sendAt) <= Date.now()) return res.status(400).json({ success: false, message: 'Choose a valid future reminder time.' });
  if (brandId && !db.find('brands', brandId) || propertyId && !db.find('properties', propertyId) || meetingId && !db.find('meetings', meetingId)) return res.status(400).json({ success: false, message: 'Linked record not found.' });
  if (channel === 'email' && (typeof to !== 'string' || !/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(to) || typeof subject !== 'string' || !subject.trim() || /[\r\n]/.test(subject) || typeof body !== 'string' || !body.trim())) return res.status(400).json({ success: false, message: 'Enter a valid email, subject and message.' });
  if (channel === 'whatsapp' && (typeof to !== 'string' || !/^\+?[1-9]\d{7,14}$/.test(to) || typeof templateName !== 'string' || !/^[a-z0-9_]+$/.test(templateName) || typeof language !== 'string' || !/^[a-zA-Z_]+$/.test(language) || !Array.isArray(parameters) || parameters.length > 20 || parameters.some(p => typeof p !== 'string' || p.length > 1024))) return res.status(400).json({ success: false, message: 'Enter a valid WhatsApp number, approved template, language and parameters.' });
  const meeting = meetingId ? db.find('meetings', meetingId) : null;
  if (meeting && meeting.status !== 'Scheduled') return res.status(400).json({ success: false, message: 'Only scheduled meetings can have reminders.' });
  const meetingSnapshot = meeting ? { date: meeting.date || '', time: meeting.time || '', venue: meeting.venue || '', title: meeting.title || '' } : null;
  const record = db.insert('reminders', { meetingSnapshot, channel, to, subject, body, sendAt, brandId, propertyId, meetingId, templateName, language, parameters, consent: true, status: 'Queued', createdBy: req.user.id, createdByName: req.user.name });
  db.logActivity(req.user, 'create', 'reminders', record.id, 'Scheduled client reminder');
  res.status(201).json({ success: true, data: record });
});
router.patch('/:id/cancel', (req, res) => {
  const item = db.find('reminders', req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Not found' });
  if (item.status !== 'Queued') return res.status(409).json({ success: false, message: 'Only queued reminders can be cancelled.' });
  const updated = db.update('reminders', item.id, { status: 'Cancelled' }, 'Queued');
  if (!updated) return res.status(409).json({ success: false, message: 'Reminder is no longer queued.' });
  db.logActivity(req.user, 'cancel', 'reminders', item.id, 'Cancelled client reminder');
  res.json({ success: true, data: updated });
});
module.exports = router;
