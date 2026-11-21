const express = require('express');
const { sendEmail, sendWhatsApp } = require('../utils/delivery');
const path = require('path');
const fs = require('fs');
const db = require('../utils/db');
const { requireRole } = require('../middleware/auth');
const { getSettings } = require('./settings');
const router = express.Router();
router.use(requireRole('admin', 'manager', 'employee'));

// Templates contain no credentials and are available to staff composing a message.
router.get('/templates', (req, res) => res.json({ success: true, data: getSettings().templates }));
function log(req, type, message, recipient, extra = {}) {
  const now = new Date();
  db.insert('communications', { type, brandId: req.body.brandId || '', propertyId: req.body.propertyId || '', employeeId: req.user.id, date: now.toISOString().slice(0,10), time: now.toISOString().slice(11,16), notes: message, recipient, ...extra, createdBy: req.user.id, createdByName: req.user.name });
}
function validateLinks(body) {
  if (body.propertyId && !db.find('properties', body.propertyId)) return 'Property not found';
  if (body.brandId && !db.find('brands', body.brandId)) return 'Brand not found';
  if (body.meetingId && !db.find('meetings', body.meetingId)) return 'Meeting not found';
  return '';
}
router.post('/email', async (req, res) => {
  const { to, subject, body, documentIds = [] } = req.body;
  const problem = validateLinks(req.body);
  if (problem) return res.status(400).json({ success: false, message: problem });
  if (typeof to !== 'string' || !/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(to) || typeof subject !== 'string' || !subject.trim() || /[\r\n]/.test(subject) || typeof body !== 'string' || !body.trim() || !Array.isArray(documentIds) || documentIds.length > 10) return res.status(400).json({ success: false, message: 'Provide one valid email, subject, message and up to 10 documents.' });
  const smtp = getSettings().smtp;
  if (!smtp.host || !smtp.fromEmail || !smtp.user || !smtp.password) return res.status(400).json({ success: false, message: 'SMTP is not configured. Ask an admin to update settings.' });
  const attachments = [];
  const root = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'));
  for (const id of documentIds) {
    const doc = db.find('documents', id);
    if (!doc || !req.body.propertyId || doc.propertyId !== req.body.propertyId || !doc.fileUrl || !doc.fileUrl.startsWith('/uploads/')) return res.status(400).json({ success: false, message: 'Attachments must be uploaded documents linked to the selected property.' });
    const filename = doc.fileUrl.slice('/uploads/'.length);
    const full = path.resolve(root, filename);
    if (path.dirname(full) !== root || !fs.existsSync(full) || !fs.lstatSync(full).isFile()) return res.status(400).json({ success: false, message: 'An attachment file is unavailable.' });
    attachments.push({ filename: path.basename(doc.fileName || filename), path: full });
  }
  try {
    const result = await sendEmail({ to, subject, body, attachments });
    try { log(req, 'Email', body, to, { subject, documentIds, meetingId: req.body.meetingId || '', providerMessageId: result.messageId }); } catch (err) { console.error('Email accepted but communication log failed:', err.message); return res.json({ success: true, message: 'Email accepted by SMTP server, but history could not be saved.', messageId: result.messageId }); }
    res.json({ success: true, message: 'Email accepted by SMTP server.', messageId: result.messageId });
  } catch (err) { console.error('SMTP send failed:', err.code || err.message); res.status(502).json({ success: false, message: 'Email could not be sent. Check SMTP settings and server logs.' }); }
});
router.post('/whatsapp', async (req, res) => {
  const { to, body, mode = 'text', templateName, language, parameters = [] } = req.body;
  const problem = validateLinks(req.body);
  if (problem) return res.status(400).json({ success: false, message: problem });
  if (typeof to !== 'string' || !/^\+?[1-9]\d{7,14}$/.test(to) || !['text','template'].includes(mode)) return res.status(400).json({ success: false, message: 'Enter a WhatsApp number in international format and a valid message type.' });
  if (mode === 'text' && (typeof body !== 'string' || !body.trim() || body.length > 4096)) return res.status(400).json({ success: false, message: 'Enter a message of up to 4096 characters.' });
  if (mode === 'template' && (typeof templateName !== 'string' || !/^[a-z0-9_]+$/.test(templateName) || typeof language !== 'string' || !/^[a-zA-Z_]+$/.test(language) || !Array.isArray(parameters) || parameters.length > 20 || parameters.some(x => typeof x !== 'string' || x.length > 1024))) return res.status(400).json({ success: false, message: 'Enter an approved template name, language and valid body parameters.' });
  const wa = getSettings().whatsapp;
  if (!/^\d+$/.test(wa.phoneNumberId) || !wa.accessToken || !/^v\d+\.\d+$/.test(wa.apiVersion)) return res.status(400).json({ success: false, message: 'WhatsApp Cloud API is not configured. Ask an admin to update settings.' });
  try {
    const result = await sendWhatsApp({ to, mode, body, templateName, language, parameters });
    try { log(req, 'WhatsApp', mode === 'text' ? body : `Template: ${templateName}\n${parameters.join('\n')}`, to, { meetingId: req.body.meetingId || '', providerMessageId: result.messages?.[0]?.id }); } catch (err) { console.error('WhatsApp accepted but communication log failed:', err.message); return res.json({ success: true, message: 'WhatsApp accepted the message, but history could not be saved.', messageId: result.messages?.[0]?.id }); }
    res.json({ success: true, message: 'Message accepted by WhatsApp.', messageId: result.messages?.[0]?.id });
  } catch (err) { console.error('WhatsApp request failed:', err.message); res.status(502).json({ success: false, message: 'Could not reach WhatsApp Cloud API.' }); }
});
module.exports = router;
