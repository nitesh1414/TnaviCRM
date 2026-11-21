const nodemailer = require('nodemailer');
const { decrypt } = require('./secrets');
const { getSettings } = require('../routes/settings');

async function sendEmail({ to, subject, body, attachments = [] }) {
  const { smtp, company } = getSettings();
  if (!smtp.host || !smtp.fromEmail || !smtp.user || !smtp.password) throw new Error('SMTP is not configured');
  const transport = nodemailer.createTransport({ host: smtp.host, port: Number(smtp.port), secure: smtp.secure, auth: { user: smtp.user, pass: decrypt(smtp.password) }, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000 });
  return transport.sendMail({ from: { name: smtp.fromName || company.name, address: smtp.fromEmail }, to, subject, text: body, attachments });
}
async function sendWhatsApp({ to, mode, body, templateName, language, parameters = [] }) {
  const wa = getSettings().whatsapp;
  if (!/^\d+$/.test(wa.phoneNumberId) || !wa.accessToken || !/^v\d+\.\d+$/.test(wa.apiVersion)) throw new Error('WhatsApp Cloud API is not configured');
  const payload = { messaging_product: 'whatsapp', to: to.replace(/^\+/, ''), type: mode };
  if (mode === 'text') payload.text = { body, preview_url: true };
  else payload.template = { name: templateName, language: { code: language }, ...(parameters.length ? { components: [{ type: 'body', parameters: parameters.map(text => ({ type: 'text', text })) }] } : {}) };
  const response = await fetch(`https://graph.facebook.com/${wa.apiVersion}/${wa.phoneNumberId}/messages`, { method: 'POST', headers: { Authorization: `Bearer ${decrypt(wa.accessToken)}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(20000) });
  const result = await response.json();
  if (!response.ok) throw new Error(`WhatsApp rejected message (code ${result.error?.code || 'unknown'})`);
  return result;
}
module.exports = { sendEmail, sendWhatsApp };
