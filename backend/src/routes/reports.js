const express = require('express');
const db = require('../utils/db');
const router = express.Router();

function groupBy(list, keyFn) {
  const m = {};
  list.forEach(r => { const k = keyFn(r) || 'Unknown'; m[k] = (m[k] || 0) + 1; });
  return Object.entries(m).map(([name, value]) => ({ name, value }));
}

router.get('/all', (req, res) => {
  const props = db.all('properties'), brands = db.all('brands'), leads = db.all('leads'),
        proposals = db.all('proposals'), meetings = db.all('meetings'), tasks = db.all('tasks'),
        leases = db.all('leases'), comms = db.all('communications'), users = db.all('users');
  const today = new Date().toISOString().slice(0, 10);
  const in90 = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);

  const brandName = id => (db.find('brands', id) || {}).name || '—';
  const propName = id => (db.find('properties', id) || {}).name || '—';
  const userName = id => (db.find('users', id) || {}).name || 'Unassigned';

  const data = {
    propertyAvailability: groupBy(props, p => p.status),
    brandWiseEnquiries: groupBy(leads, l => brandName(l.brandId)),
    propertyWiseInterest: groupBy(leads, l => propName(l.propertyId)),
    activeProposals: proposals.filter(p => !['Approved','Rejected'].includes(p.status)).map(p => ({ ...p, brandName: brandName(p.brandId), propertyName: propName(p.propertyId) })),
    meetings: meetings.map(m => ({ ...m, brandName: brandName(m.brandId), propertyName: propName(m.propertyId) })),
    employeePerformance: users.map(u => ({
      name: u.name, role: u.role,
      leads: leads.filter(l => String(l.assignedTo) === String(u.id)).length,
      tasks: tasks.filter(t => String(t.assignedTo) === String(u.id)).length,
      completedTasks: tasks.filter(t => String(t.assignedTo) === String(u.id) && t.status === 'Completed').length,
      meetings: meetings.filter(m => String(m.responsible) === String(u.id)).length,
      communications: comms.filter(c => String(c.employeeId) === String(u.id)).length,
      proposals: proposals.filter(p => String(p.assignedTo) === String(u.id)).length,
    })),
    followUpPending: leads.filter(l => l.followUpDate && l.followUpDate <= in90 && !['Approved','Rejected'].includes(l.status)).map(l => ({ ...l, brandName: brandName(l.brandId), propertyName: propName(l.propertyId) })),
    negotiationStatus: groupBy(proposals, p => p.stage),
    leasedProperties: props.filter(p => p.status === 'Leased'),
    vacantProperties: props.filter(p => p.status === 'Available'),
    leaseExpiry: leases.filter(l => l.expiryDate <= in90).map(l => ({ ...l, propertyName: propName(l.propertyId), brandName: brandName(l.brandId) })),
    overdueTasks: tasks.filter(t => t.status === 'Pending' && t.dueDate && t.dueDate < today).map(t => ({ ...t, assignee: userName(t.assignedTo) })),
    communicationByType: groupBy(comms, c => c.type),
  };
  res.json({ success: true, data });
});

router.get('/export/:type', (req, res) => {
  const map = { properties: 'properties', brands: 'brands', leads: 'leads', meetings: 'meetings', proposals: 'proposals', leases: 'leases', tasks: 'tasks', communications: 'communications' };
  const col = map[req.params.type];
  if (!col) return res.status(400).json({ success: false, message: 'Invalid type' });
  const rows = db.all(col);
  if (!rows.length) return res.status(404).json({ success: false, message: 'No data' });
  const headers = Object.keys(rows[0]);
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => esc(typeof r[h] === 'object' ? JSON.stringify(r[h]) : r[h])).join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${col}.csv"`);
  res.send(csv);
});

module.exports = router;
