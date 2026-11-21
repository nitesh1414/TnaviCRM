const express = require('express');
const db = require('../utils/db');
const { requireRole } = require('../middleware/auth');
const { encrypt } = require('../utils/secrets');
const router = express.Router();
const DEFAULTS = {
  company: { name: 'TnaviCRM', address: '', phone: '', email: '', website: '' },
  smtp: { host: '', port: 587, secure: false, user: '', password: '', fromEmail: '', fromName: '' },
  whatsapp: { phoneNumberId: '', businessNumber: '', accessToken: '', apiVersion: 'v21.0' },
  templates: [
    { id: 'property', name: 'Property introduction', subject: 'Property opportunity: {{property_name}}', body: 'Hello {{contact_name}},\n\nWe would like to introduce {{property_name}} in {{property_location}}.\nType: {{property_type}}\nArea: {{property_area}} sq. ft.\nExpected monthly rent: {{property_rent}}\n\n{{property_description}}\n\nPlease let us know if you would like to arrange a visit.\n\nRegards,\n{{company_name}}' },
    { id: 'meeting', name: 'Meeting reminder', subject: 'Meeting reminder: {{meeting_title}}', body: 'Hello {{contact_name}},\n\nThis is a reminder about {{meeting_title}} on {{meeting_date}} at {{meeting_time}}.\nVenue: {{meeting_venue}}\n\nRegards,\n{{company_name}}' }
  ]
};
function getSettings() {
  const stored = db.getSettings();
  return { company: { ...DEFAULTS.company, ...stored.company }, smtp: { ...DEFAULTS.smtp, ...stored.smtp }, whatsapp: { ...DEFAULTS.whatsapp, ...stored.whatsapp }, templates: Array.isArray(stored.templates) ? stored.templates : DEFAULTS.templates };
}
function safe(s) {
  const { password, ...smtp } = s.smtp;
  const { accessToken, ...whatsapp } = s.whatsapp;
  return { company: s.company, smtp: { ...smtp, hasPassword: !!password }, whatsapp: { ...whatsapp, hasAccessToken: !!accessToken }, templates: s.templates };
}
router.get('/company', (req, res) => res.json({ success: true, data: getSettings().company }));
router.use(requireRole('admin'));
router.get('/', (req, res) => res.json({ success: true, data: safe(getSettings()) }));
router.put('/', (req, res) => {
  const current = getSettings();
  const { company = {}, smtp = {}, whatsapp = {}, templates } = req.body;
  const pick = (source, keys) => Object.fromEntries(keys.filter(k => source[k] !== undefined).map(k => [k, source[k]]));
  const next = {
    company: { ...current.company, ...pick(company, ['name','address','phone','email','website']) },
    smtp: { ...current.smtp, ...pick(smtp, ['host','port','secure','user','fromEmail','fromName']) },
    whatsapp: { ...current.whatsapp, ...pick(whatsapp, ['phoneNumberId','businessNumber','apiVersion']) },
    templates: templates === undefined ? current.templates : templates
  };
  if (smtp.password) next.smtp.password = smtp.password;
  if (smtp.clearPassword === true) next.smtp.password = '';
  if (whatsapp.accessToken) next.whatsapp.accessToken = whatsapp.accessToken;
  if (whatsapp.clearAccessToken === true) next.whatsapp.accessToken = '';
  if (!Array.isArray(next.templates) || next.templates.length > 50 || next.templates.some(t => !t || typeof t.id !== 'string' || typeof t.name !== 'string' || typeof t.subject !== 'string' || typeof t.body !== 'string')) return res.status(400).json({ success: false, message: 'Invalid templates' });
  if (!Number.isInteger(Number(next.smtp.port)) || Number(next.smtp.port) < 1 || Number(next.smtp.port) > 65535 || typeof next.smtp.secure !== 'boolean') return res.status(400).json({ success: false, message: 'Invalid SMTP port or security setting' });
  if (!/^v\d+\.\d+$/.test(next.whatsapp.apiVersion)) return res.status(400).json({ success: false, message: 'Invalid WhatsApp API version' });
  try {
    next.smtp.password = encrypt(next.smtp.password);
    next.whatsapp.accessToken = encrypt(next.whatsapp.accessToken);
  } catch (err) { return res.status(400).json({ success: false, message: err.message }); }
  db.setSettings(next);
  db.logActivity(req.user, 'update', 'settings', null, 'Updated company and messaging settings');
  res.json({ success: true, data: safe(next) });
});
module.exports = { router, getSettings, safe };
