require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { auth } = require('./middleware/auth');
const { makeCrud } = require('./utils/crud');
const db = require('./utils/db');

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Uploads are available only via the authenticated documents endpoint.

// health
app.get('/api/health', (req, res) => res.json({ success: true, message: 'TnaviCRM API running', time: new Date().toISOString() }));

// public auth
app.use('/api/auth', require('./routes/auth'));

// protected routes
app.use('/api/settings', auth, require('./routes/settings').router);
app.use('/api/outbound', auth, require('./routes/outbound'));
app.use('/api/reminders', auth, require('./routes/reminders'));
app.use('/api/dashboard', auth, require('./routes/dashboard'));
app.use('/api/matching', auth, require('./routes/matching'));
app.use('/api/reports', auth, require('./routes/reports'));
app.use('/api/notifications', auth, require('./routes/notifications'));
app.use('/api/users', auth, require('./routes/users'));
app.use('/api/documents', auth, require('./routes/documents'));

app.use('/api/properties', auth, makeCrud('properties', { entityName: 'Property', searchFields: ['name','city','area','location','ownerName','type','status'] }));
app.use('/api/brands', auth, makeCrud('brands', { entityName: 'Brand', searchFields: ['name','companyName','brandName','category','contactPerson'] }));
app.use('/api/leads', auth, makeCrud('leads', { entityName: 'Lead', searchFields: ['title','status','source','notes'] }));
app.use('/api/meetings', auth, makeCrud('meetings', { entityName: 'Meeting', searchFields: ['title','purpose','venue','status','type'] }));
app.use('/api/communications', auth, makeCrud('communications', { entityName: 'Communication', searchFields: ['type','notes','feedback'] }));
app.use('/api/proposals', auth, require('./routes/proposals'));
app.use('/api/leases', auth, makeCrud('leases', { entityName: 'Lease', searchFields: ['tenantName','status'] }));
app.use('/api/tasks', auth, makeCrud('tasks', { entityName: 'Task', searchFields: ['title','priority','status','description'] }));

// timeline endpoint: brand-wise & property-wise interactions
app.get('/api/timeline/:type/:id', auth, (req, res) => {
  const { type, id } = req.params;
  const key = type === 'brand' ? 'brandId' : 'propertyId';
  const comms = db.all('communications').filter(c => String(c[key]) === String(id));
  const meetings = db.all('meetings').filter(m => String(m[key]) === String(id));
  const leads = db.all('leads').filter(l => String(l[key]) === String(id));
  const proposals = db.all('proposals').filter(p => String(p[key]) === String(id));
  const timeline = [
    ...comms.map(c => ({ kind: 'communication', date: c.date || c.createdAt, data: c })),
    ...meetings.map(m => ({ kind: 'meeting', date: m.date || m.createdAt, data: m })),
    ...leads.map(l => ({ kind: 'lead', date: l.createdAt, data: l })),
    ...proposals.map(p => ({ kind: 'proposal', date: p.createdAt, data: p })),
  ].sort((a,b) => new Date(b.date) - new Date(a.date));
  res.json({ success: true, data: timeline });
});

// 404 + error handler
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use((err, req, res, next) => { console.error(err); res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 500).json({ success: false, message: err.code === 'LIMIT_FILE_SIZE' ? 'File exceeds 25 MB limit' : 'Server error' }); });

if (process.env.DB_DRIVER === 'mysql') require('./utils/mysqlStore').call('ping');
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`TnaviCRM API listening on http://0.0.0.0:${PORT}`);
  if (process.env.REMINDER_WORKER !== 'false') require('./utils/reminderWorker').startReminderWorker();
});
