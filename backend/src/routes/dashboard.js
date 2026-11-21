const express = require('express');
const db = require('../utils/db');
const router = express.Router();

router.get('/', (req, res) => {
  const props = db.all('properties');
  const brands = db.all('brands');
  const leads = db.all('leads');
  const meetings = db.all('meetings');
  const proposals = db.all('proposals');
  const leases = db.all('leases');
  const tasks = db.all('tasks');
  const comms = db.all('communications');
  const today = new Date().toISOString().slice(0, 10);
  const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const stats = {
    totalProperties: props.length,
    availableProperties: props.filter(p => p.status === 'Available').length,
    leasedProperties: props.filter(p => p.status === 'Leased').length,
    underNegotiation: props.filter(p => p.status === 'Under Negotiation').length,
    totalBrands: brands.length,
    activeLeads: leads.filter(l => !['Approved','Rejected'].includes(l.status)).length,
    activeProposals: proposals.filter(p => !['Approved','Rejected'].includes(p.status)).length,
    upcomingMeetings: meetings.filter(m => m.date >= today && m.status !== 'Cancelled').length,
    pendingFollowUps: leads.filter(l => l.followUpDate && l.followUpDate <= in7 && !['Approved','Rejected'].includes(l.status)).length,
    pendingTasks: tasks.filter(t => t.status === 'Pending').length,
    overdueTasks: tasks.filter(t => t.status === 'Pending' && t.dueDate && t.dueDate < today).length,
    activeLeases: leases.filter(l => l.status === 'Active').length,
    expiringLeases: leases.filter(l => l.expiryDate && l.expiryDate <= in7).length,
    totalCommunications: comms.length,
  };

  // charts data
  const byPropertyStatus = ['Available','Under Negotiation','Leased'].map(s => ({ name: s, value: props.filter(p => p.status === s).length }));
  const byLeadStatus = ['New','Contacted','Interested','Negotiation','Approved','Rejected'].map(s => ({ name: s, value: leads.filter(l => l.status === s).length }));
  const byPropertyType = [...new Set(props.map(p => p.type))].map(t => ({ name: t, value: props.filter(p => p.type === t).length }));
  const byBrandCategory = [...new Set(brands.map(b => b.category))].map(c => ({ name: c, value: brands.filter(b => b.category === c).length }));
  const monthlyRentRoll = leases.filter(l => l.status === 'Active').reduce((s, l) => s + Number(l.monthlyRent || 0), 0);

  const recentProperties = [...props].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  const recentLeads = [...leads].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  const upcomingMeetingsList = meetings.filter(m => m.date >= today).sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time)).slice(0, 5);
  const pendingTasksList = tasks.filter(t => t.status === 'Pending').sort((a,b) => (a.dueDate||'').localeCompare(b.dueDate||'')).slice(0, 5);
  const recentActivity = [...db.all('activityLogs')].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);
  const recentComms = [...comms].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  res.json({ success: true, data: { stats, byPropertyStatus, byLeadStatus, byPropertyType, byBrandCategory, monthlyRentRoll, recentProperties, recentLeads, upcomingMeetingsList, pendingTasksList, recentActivity, recentComms } });
});

module.exports = router;
