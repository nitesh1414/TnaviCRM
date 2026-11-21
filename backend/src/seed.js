require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./utils/db');
const { randomUUID: uuid } = require('crypto');

function seed() {
  const existing = db.all('users');
  if (existing.length > 0) { console.log('DB already seeded, skipping.'); return; }
  const now = new Date().toISOString();
  const mk = (o) => ({ id: uuid(), createdAt: now, updatedAt: now, ...o });

  const users = [
    mk({ name: 'Admin User', email: 'admin@tnavicrm.com', password: bcrypt.hashSync('admin123', 10), role: 'admin', phone: '9876543210', designation: 'Administrator', active: true }),
    mk({ name: 'Priya Sharma', email: 'manager@tnavicrm.com', password: bcrypt.hashSync('manager123', 10), role: 'manager', phone: '9822012345', designation: 'Leasing Manager', active: true }),
    mk({ name: 'Rahul Verma', email: 'employee@tnavicrm.com', password: bcrypt.hashSync('employee123', 10), role: 'employee', phone: '9823098765', designation: 'Relationship Executive', active: true }),
  ];
  users.forEach(u => db.insert('users', u));
  const [admin, manager, employee] = users;

  const properties = [
    mk({ name: 'Shree Plaza, MG Road', address: 'Plot 12, MG Road', location: 'MG Road', city: 'Nagpur', area: 'Civil Lines', type: 'Retail', totalArea: 8500, frontage: 60, roadConnectivity: 'Main road, 40ft', parking: '20 cars', floors: 'G+2', expectedRent: 85000, securityDeposit: 510000, ownerName: 'Rajesh Gupta', ownerContact: '9822001122', ownerEmail: 'rajesh@example.com', status: 'Available', description: 'Prime retail space near city centre with high footfall.', assignedTo: manager.id, images: [], attachments: [] }),
    mk({ name: 'City Mall Annex', address: 'Ring Road, Near Square', location: 'Ring Road', city: 'Nagpur', area: 'Sadar', type: 'Showroom', totalArea: 12000, frontage: 80, roadConnectivity: 'Ring road', parking: '50 cars', floors: 'G+3', expectedRent: 150000, securityDeposit: 900000, ownerName: 'Sunita Patil', ownerContact: '9823002233', ownerEmail: 'sunita@example.com', status: 'Available', description: 'Large showroom space ideal for hypermarket format.', assignedTo: manager.id, images: [], attachments: [] }),
    mk({ name: 'IT Office Hub', address: 'IT Park, MIDC', location: 'MIDC', city: 'Nagpur', area: 'Hingna', type: 'Office', totalArea: 20000, frontage: 100, roadConnectivity: 'MIDC road', parking: '100 cars', floors: 'G+5', expectedRent: 200000, securityDeposit: 1200000, ownerName: 'Amit Deshmukh', ownerContact: '9824003344', ownerEmail: 'amit@example.com', status: 'Under Negotiation', description: 'Grade-A office floor plates with IT infrastructure.', assignedTo: employee.id, images: [], attachments: [] }),
    mk({ name: 'Warehouse Complex 4', address: 'Butibori Industrial Area', location: 'Butibori', city: 'Nagpur', area: 'Butibori', type: 'Warehouse', totalArea: 45000, frontage: 120, roadConnectivity: 'NH-53', parking: 'Truck bay', floors: 'G', expectedRent: 300000, securityDeposit: 1800000, ownerName: 'Vikram Singh', ownerContact: '9825004455', ownerEmail: 'vikram@example.com', status: 'Leased', description: 'High-ceiling warehouse with dock levellers.', assignedTo: manager.id, images: [], attachments: [] }),
    mk({ name: 'Food Court Space', address: 'Airport Road', location: 'Airport Road', city: 'Nagpur', area: 'Ramdaspeth', type: 'Commercial', totalArea: 3500, frontage: 40, roadConnectivity: 'Airport road', parking: '15 cars', floors: 'G+1', expectedRent: 45000, securityDeposit: 270000, ownerName: 'Meera Joshi', ownerContact: '9826005566', ownerEmail: 'meera@example.com', status: 'Available', description: 'Food court / restaurant space with kitchen provision.', assignedTo: employee.id, images: [], attachments: [] }),
  ];
  properties.forEach(p => db.insert('properties', p));

  const brands = [
    mk({ name: 'D-Mart', companyName: 'Avenue Supermarts Ltd', brandName: 'D-Mart', website: 'dmart.in', category: 'Supermarket / Hypermarket', corporateOffice: 'Powai, Mumbai', regionalOffice: 'Nagpur, Maharashtra', contactPerson: 'Suresh Iyer', designation: 'Head - Expansion', email: 'suresh@dmart.in', mobile: '9827011111', relationshipManager: manager.id, requirements: { minArea: 10000, maxBudget: 180000, preferredLocations: ['Ring Road','Sadar','MG Road'], propertyTypes: ['Retail','Showroom'] }, interestLevel: 'High', status: 'Active' }),
    mk({ name: 'Reliance Retail', companyName: 'Reliance Retail Ltd', brandName: 'Reliance Smart', website: 'relianceretail.com', category: 'Supermarket / Hypermarket', corporateOffice: 'Mumbai', regionalOffice: 'Nagpur', contactPerson: 'Anita Kulkarni', designation: 'Regional Head', email: 'anita@reliance.in', mobile: '9827022222', relationshipManager: manager.id, requirements: { minArea: 5000, maxBudget: 120000, preferredLocations: ['MG Road','Civil Lines'], propertyTypes: ['Retail','Commercial'] }, interestLevel: 'Medium', status: 'Active' }),
    mk({ name: 'Smart Bazaar', companyName: 'Reliance Retail Ltd', brandName: 'Smart Bazaar', website: 'smartbazaar.in', category: 'Supermarket', corporateOffice: 'Mumbai', regionalOffice: 'Nagpur', contactPerson: 'Rohan Mehta', designation: 'Expansion Manager', email: 'rohan@smartbazaar.in', mobile: '9827033333', relationshipManager: employee.id, requirements: { minArea: 3000, maxBudget: 80000, preferredLocations: ['Civil Lines','Ramdaspeth'], propertyTypes: ['Retail'] }, interestLevel: 'High', status: 'Active' }),
    mk({ name: 'Bank of Baroda', companyName: 'Bank of Baroda', brandName: 'BOB', website: 'bankofbaroda.in', category: 'Banking', corporateOffice: 'Vadodara', regionalOffice: 'Nagpur', contactPerson: 'Kavita Rao', designation: 'Admin Head', email: 'kavita@bob.in', mobile: '9827044444', relationshipManager: employee.id, requirements: { minArea: 1500, maxBudget: 60000, preferredLocations: ['MG Road','Sadar'], propertyTypes: ['Office','Commercial'] }, interestLevel: 'Low', status: 'Active' }),
  ];
  brands.forEach(b => db.insert('brands', b));

  const leads = [
    mk({ title: 'D-Mart expansion - Ring Road site', brandId: brands[0].id, propertyId: properties[1].id, source: 'Direct', status: 'Negotiation', assignedTo: manager.id, notes: 'Brand visited site on 15 Nov. Very interested.', followUpDate: new Date(Date.now()+86400000*2).toISOString().slice(0,10) }),
    mk({ title: 'Smart Bazaar - MG Road enquiry', brandId: brands[2].id, propertyId: properties[0].id, source: 'Referral', status: 'Interested', assignedTo: employee.id, notes: 'Shared brochure and floor plan.', followUpDate: new Date(Date.now()+86400000*3).toISOString().slice(0,10) }),
    mk({ title: 'Reliance Smart - Civil Lines', brandId: brands[1].id, propertyId: properties[0].id, source: 'Website', status: 'Contacted', assignedTo: manager.id, notes: 'Initial call done, awaiting site visit confirmation.', followUpDate: new Date(Date.now()+86400000*5).toISOString().slice(0,10) }),
    mk({ title: 'New enquiry - Food court', brandId: brands[3].id, propertyId: properties[4].id, source: 'Walk-in', status: 'New', assignedTo: employee.id, notes: 'Received enquiry via phone.', followUpDate: new Date(Date.now()+86400000*1).toISOString().slice(0,10) }),
  ];
  leads.forEach(l => db.insert('leads', l));

  const meetings = [
    mk({ title: 'D-Mart site visit - City Mall Annex', brandId: brands[0].id, propertyId: properties[1].id, date: new Date(Date.now()+86400000*1).toISOString().slice(0,10), time: '11:00', venue: 'City Mall Annex, Ring Road', purpose: 'Site visit & discussion', participants: ['Suresh Iyer','Priya Sharma'], responsible: manager.id, agenda: 'Area measurement, frontage, parking, commercial terms', minutes: '', status: 'Scheduled', type: 'Site Visit' }),
    mk({ title: 'Smart Bazaar - proposal discussion', brandId: brands[2].id, propertyId: properties[0].id, date: new Date(Date.now()+86400000*2).toISOString().slice(0,10), time: '15:00', venue: 'TnaviCRM Office', purpose: 'Proposal discussion', participants: ['Rohan Mehta','Rahul Verma'], responsible: employee.id, agenda: 'Rent negotiation, lock-in period', minutes: '', status: 'Scheduled', type: 'Meeting' }),
    mk({ title: 'Owner meeting - Shree Plaza', brandId: null, propertyId: properties[0].id, date: new Date(Date.now()-86400000*2).toISOString().slice(0,10), time: '10:00', venue: 'Shree Plaza', purpose: 'Owner discussion', participants: ['Rajesh Gupta'], responsible: manager.id, agenda: 'Deposit & escalation terms', minutes: 'Owner agreed to 5% annual escalation.', status: 'Completed', type: 'Meeting' }),
  ];
  meetings.forEach(m => db.insert('meetings', m));

  const comms = [
    mk({ brandId: brands[0].id, propertyId: properties[1].id, type: 'Phone Call', date: new Date(Date.now()-86400000*3).toISOString().slice(0,10), time: '10:30', employeeId: manager.id, notes: 'Discussed rent expectation. Brand countered at 1.35L.', feedback: 'Positive', nextFollowUp: new Date(Date.now()+86400000*1).toISOString().slice(0,10) }),
    mk({ brandId: brands[2].id, propertyId: properties[0].id, type: 'Email', date: new Date(Date.now()-86400000*1).toISOString().slice(0,10), time: '14:00', employeeId: employee.id, notes: 'Sent property brochure, floor plan and rent sheet.', feedback: 'Interested', nextFollowUp: new Date(Date.now()+86400000*2).toISOString().slice(0,10) }),
    mk({ brandId: brands[1].id, propertyId: properties[0].id, type: 'WhatsApp', date: new Date().toISOString().slice(0,10), time: '09:00', employeeId: manager.id, notes: 'Shared location pin and photos.', feedback: 'Awaiting reply', nextFollowUp: new Date(Date.now()+86400000*4).toISOString().slice(0,10) }),
  ];
  comms.forEach(c => db.insert('communications', c));

  const proposals = [
    mk({ title: 'Proposal - D-Mart / City Mall Annex', brandId: brands[0].id, propertyId: properties[1].id, proposedRent: 140000, securityDeposit: 840000, leasePeriod: 9, escalation: '5% per annum', terms: 'Lock-in 3 years, rent-free fit-out 60 days', stage: 'Negotiation', status: 'Sent', counterOffers: [{ by: 'Brand', rent: 135000, date: new Date(Date.now()-86400000*3).toISOString().slice(0,10) }], assignedTo: manager.id }),
    mk({ title: 'Proposal - Smart Bazaar / Shree Plaza', brandId: brands[2].id, propertyId: properties[0].id, proposedRent: 80000, securityDeposit: 480000, leasePeriod: 5, escalation: '5% per annum', terms: 'Standard terms', stage: 'Draft', status: 'Draft', counterOffers: [], assignedTo: employee.id }),
  ];
  proposals.forEach(p => db.insert('proposals', p));

  const leases = [
    mk({ propertyId: properties[3].id, brandId: brands[1].id, tenantName: 'Reliance Retail Ltd', commencementDate: '2025-01-01', expiryDate: new Date(Date.now()+86400000*90).toISOString().slice(0,10), monthlyRent: 280000, securityDeposit: 1680000, escalation: '5% per annum', renewalDate: new Date(Date.now()+86400000*60).toISOString().slice(0,10), status: 'Active', agreementDoc: '' }),
  ];
  leases.forEach(l => db.insert('leases', l));

  const tasks = [
    mk({ title: 'Follow up D-Mart on counter-offer', assignedTo: manager.id, brandId: brands[0].id, propertyId: properties[1].id, priority: 'High', status: 'Pending', dueDate: new Date(Date.now()+86400000*1).toISOString().slice(0,10), description: 'Call Suresh Iyer regarding 1.35L counter.' }),
    mk({ title: 'Share floor plan with Smart Bazaar', assignedTo: employee.id, brandId: brands[2].id, propertyId: properties[0].id, priority: 'Medium', status: 'Pending', dueDate: new Date(Date.now()+86400000*2).toISOString().slice(0,10), description: 'Email CAD floor plan.' }),
    mk({ title: 'Prepare lease expiry report', assignedTo: employee.id, priority: 'Low', status: 'Completed', dueDate: new Date(Date.now()-86400000*1).toISOString().slice(0,10), description: 'Monthly report.' }),
  ];
  tasks.forEach(t => db.insert('tasks', t));

  const docs = [
    mk({ title: 'Shree Plaza - Ownership Deed', category: 'Ownership', propertyId: properties[0].id, brandId: null, fileName: 'deed-shree-plaza.pdf', fileUrl: '', uploadedBy: manager.id, notes: 'Registered deed 2021' }),
    mk({ title: 'City Mall Annex - Floor Plan', category: 'Floor Plan', propertyId: properties[1].id, brandId: null, fileName: 'floorplan-citymall.dwg', fileUrl: '', uploadedBy: manager.id, notes: 'G+3 layout' }),
    mk({ title: 'Warehouse Lease Agreement', category: 'Agreement', propertyId: properties[3].id, brandId: brands[1].id, fileName: 'lease-warehouse.pdf', fileUrl: '', uploadedBy: admin.id, notes: 'Signed agreement' }),
  ];
  docs.forEach(d => db.insert('documents', d));

  db.notify(manager.id, 'Upcoming meeting', 'D-Mart site visit tomorrow at 11:00', 'meeting', meetings[0].id);
  db.notify(employee.id, 'Task due soon', 'Share floor plan with Smart Bazaar due in 2 days', 'task', tasks[1].id);
  db.notify(admin.id, 'Lease expiry alert', 'Warehouse Complex 4 lease expires in 90 days', 'lease', leases[0].id);

  console.log('Seed complete: 3 users, 5 properties, 4 brands, 4 leads, 3 meetings, 3 comms, 2 proposals, 1 lease, 3 tasks, 3 docs');
}
if (require.main === module) {
  try { seed(); } catch (err) {
    console.error(`Seed failed: ${err.message}`);
    if (process.env.DB_DRIVER === 'mysql' && /crm_(records|settings).*doesn.t exist/i.test(err.message)) console.error('Run npm run setup:mysql to create the required tables, then seed or import data.');
    process.exitCode = 1;
  }
}
module.exports = { seed };
