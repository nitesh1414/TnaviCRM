import GenericCrud from './GenericCrud';

const userOpts = (l) => l.users.map(u => ({ value: u.id, label: u.name }));
const propOpts = (l) => l.properties.map(p => ({ value: p.id, label: p.name }));
const brandOpts = (l) => l.brands.map(b => ({ value: b.id, label: b.name }));

export function PropertiesPage() {
  return <GenericCrud config={{
    endpoint: '/properties', title: 'Properties', subtitle: 'Manage commercial properties, owners and availability', singular: 'Property', wide: true,
    columns: [
      { key: 'name', label: 'Property' }, { key: 'city', label: 'City' }, { key: 'area', label: 'Area' },
      { key: 'type', label: 'Type' }, { key: 'totalArea', label: 'Area (sq.ft)' },
      { key: 'expectedRent', label: 'Expected Rent', money: true }, { key: 'ownerName', label: 'Owner' },
      { key: 'status', label: 'Status', badge: true },
    ],
    viewFields: [
      { key: 'name', label: 'Name' }, { key: 'address', label: 'Address' }, { key: 'location', label: 'Location' },
      { key: 'city', label: 'City' }, { key: 'area', label: 'Area' }, { key: 'type', label: 'Type' },
      { key: 'totalArea', label: 'Total Area (sq.ft)' }, { key: 'frontage', label: 'Frontage (ft)' },
      { key: 'roadConnectivity', label: 'Road Connectivity' }, { key: 'parking', label: 'Parking' }, { key: 'floors', label: 'Floors' },
      { key: 'expectedRent', label: 'Expected Rent', money: true }, { key: 'securityDeposit', label: 'Security Deposit', money: true },
      { key: 'ownerName', label: 'Owner' }, { key: 'ownerContact', label: 'Owner Contact' }, { key: 'ownerEmail', label: 'Owner Email' },
      { key: 'status', label: 'Status', badge: true }, { key: 'description', label: 'Description' },
    ],
    formFields: [
      { key: 'name', label: 'Property Name', required: true }, { key: 'type', label: 'Type', type: 'select', options: ['Commercial','Retail','Showroom','Office','Warehouse','Industrial','Food Court'] },
      { key: 'address', label: 'Address' }, { key: 'location', label: 'Location' }, { key: 'city', label: 'City' }, { key: 'area', label: 'Area' },
      { key: 'totalArea', label: 'Total Area (sq.ft)', type: 'number' }, { key: 'frontage', label: 'Frontage (ft)', type: 'number' },
      { key: 'roadConnectivity', label: 'Road Connectivity' }, { key: 'parking', label: 'Parking' }, { key: 'floors', label: 'Floors' },
      { key: 'expectedRent', label: 'Expected Monthly Rent (₹)', type: 'number' }, { key: 'securityDeposit', label: 'Security Deposit (₹)', type: 'number' },
      { key: 'ownerName', label: 'Owner Name' }, { key: 'ownerContact', label: 'Owner Contact' }, { key: 'ownerEmail', label: 'Owner Email', type: 'email' },
      { key: 'status', label: 'Status', type: 'select', options: ['Available','Under Negotiation','Leased'] },
      { key: 'assignedTo', label: 'Assigned To', type: 'lookup', items: userOpts },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
    emptyForm: { name: '', type: 'Retail', address: '', location: '', city: '', area: '', totalArea: '', frontage: '', roadConnectivity: '', parking: '', floors: '', expectedRent: '', securityDeposit: '', ownerName: '', ownerContact: '', ownerEmail: '', status: 'Available', assignedTo: '', description: '' },
  }} />;
}

export function BrandsPage() {
  return <GenericCrud config={{
    endpoint: '/brands', title: 'Brands & Corporate Clients', subtitle: 'Manage retail brands, decision-makers and leasing requirements', singular: 'Brand', wide: true,
    columns: [
      { key: 'name', label: 'Brand' }, { key: 'companyName', label: 'Company' }, { key: 'category', label: 'Category' },
      { key: 'contactPerson', label: 'Contact Person' }, { key: 'mobile', label: 'Mobile' },
      { key: 'interestLevel', label: 'Interest', badge: true }, { key: 'status', label: 'Status', badge: true },
    ],
    viewFields: [
      { key: 'name', label: 'Brand' }, { key: 'companyName', label: 'Company' }, { key: 'brandName', label: 'Brand Name' },
      { key: 'website', label: 'Website' }, { key: 'category', label: 'Category' }, { key: 'corporateOffice', label: 'Corporate Office' },
      { key: 'regionalOffice', label: 'Regional Office' }, { key: 'contactPerson', label: 'Contact Person' }, { key: 'designation', label: 'Designation' },
      { key: 'email', label: 'Email' }, { key: 'mobile', label: 'Mobile' }, { key: 'interestLevel', label: 'Interest', badge: true }, { key: 'status', label: 'Status', badge: true },
    ],
    formFields: [
      { key: 'name', label: 'Brand Name', required: true }, { key: 'companyName', label: 'Company Name' }, { key: 'brandName', label: 'Brand / Format' },
      { key: 'website', label: 'Website' }, { key: 'category', label: 'Business Category', type: 'select', options: ['Supermarket / Hypermarket','Supermarket','Banking','Restaurant / QSR','Pharmacy','Electronics','Fashion','Other'] },
      { key: 'corporateOffice', label: 'Corporate Office' }, { key: 'regionalOffice', label: 'Regional Office' },
      { key: 'contactPerson', label: 'Contact Person' }, { key: 'designation', label: 'Designation' }, { key: 'email', label: 'Email', type: 'email' }, { key: 'mobile', label: 'Mobile' },
      { key: 'relationshipManager', label: 'Relationship Manager', type: 'lookup', items: userOpts },
      { key: 'minArea', label: 'Minimum Area (sq.ft)', type: 'number', nested: true },
      { key: 'maxBudget', label: 'Maximum Monthly Budget (₹)', type: 'number', nested: true },
      { key: 'preferredLocations', label: 'Preferred Locations (comma separated)', nested: true, csv: true },
      { key: 'propertyTypes', label: 'Property Types (comma separated)', nested: true, csv: true },
      { key: 'interestLevel', label: 'Interest Level', type: 'select', options: ['High','Medium','Low'] },
      { key: 'status', label: 'Status', type: 'select', options: ['Active','Inactive'] },
    ],
    emptyForm: { name: '', companyName: '', brandName: '', website: '', category: 'Supermarket', corporateOffice: '', regionalOffice: '', contactPerson: '', designation: '', email: '', mobile: '', relationshipManager: '', interestLevel: 'Medium', status: 'Active' },
  }} />;
}

export function LeadsPage() {
  return <GenericCrud config={{
    endpoint: '/leads', title: 'Leads & Enquiries', subtitle: 'Track leasing enquiries from brands through the pipeline', singular: 'Lead',
    columns: [
      { key: 'title', label: 'Enquiry' },
      { key: 'brandId', label: 'Brand', lookup: (r, l) => l.brandName(r.brandId) },
      { key: 'propertyId', label: 'Property', lookup: (r, l) => l.propName(r.propertyId) },
      { key: 'source', label: 'Source' }, { key: 'status', label: 'Status', badge: true },
      { key: 'followUpDate', label: 'Follow-up', date: true },
    ],
    formFields: [
      { key: 'title', label: 'Enquiry Title', required: true },
      { key: 'brandId', label: 'Brand', type: 'lookup', items: brandOpts },
      { key: 'propertyId', label: 'Property', type: 'lookup', items: propOpts },
      { key: 'source', label: 'Source', type: 'select', options: ['Direct','Referral','Website','Walk-in','Phone','Email','Other'] },
      { key: 'status', label: 'Status', type: 'select', options: ['New','Contacted','Interested','Negotiation','Approved','Rejected'] },
      { key: 'assignedTo', label: 'Assigned To', type: 'lookup', items: userOpts },
      { key: 'followUpDate', label: 'Follow-up Date', type: 'date' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
    emptyForm: { title: '', brandId: '', propertyId: '', source: 'Direct', status: 'New', assignedTo: '', followUpDate: '', notes: '' },
  }} />;
}

export function CommunicationsPage() {
  return <GenericCrud config={{
    endpoint: '/communications', title: 'Communications', subtitle: 'Calls, emails, WhatsApp and meetings — complete interaction history', singular: 'Communication',
    columns: [
      { key: 'type', label: 'Type', badge: true },
      { key: 'brandId', label: 'Brand', lookup: (r, l) => l.brandName(r.brandId) },
      { key: 'propertyId', label: 'Property', lookup: (r, l) => l.propName(r.propertyId) },
      { key: 'date', label: 'Date', date: true }, { key: 'feedback', label: 'Feedback' },
      { key: 'nextFollowUp', label: 'Next Follow-up', date: true },
    ],
    formFields: [
      { key: 'type', label: 'Type', type: 'select', options: ['Phone Call','Email','WhatsApp','Meeting','Site Visit','Other'] },
      { key: 'brandId', label: 'Brand', type: 'lookup', items: brandOpts },
      { key: 'propertyId', label: 'Property', type: 'lookup', items: propOpts },
      { key: 'date', label: 'Date', type: 'date' }, { key: 'time', label: 'Time', type: 'time' },
      { key: 'employeeId', label: 'Employee', type: 'lookup', items: userOpts },
      { key: 'feedback', label: 'Feedback' }, { key: 'nextFollowUp', label: 'Next Follow-up', type: 'date' },
      { key: 'notes', label: 'Discussion Notes', type: 'textarea' },
    ],
    emptyForm: { type: 'Phone Call', brandId: '', propertyId: '', date: new Date().toISOString().slice(0,10), time: '', employeeId: '', feedback: '', nextFollowUp: '', notes: '' },
  }} />;
}

export function ProposalsPage() {
  return <GenericCrud config={{
    endpoint: '/proposals', title: 'Proposals & Negotiation', subtitle: 'Commercial proposals, counter-offers and negotiation stages', singular: 'Proposal', wide: true,
    columns: [
      { key: 'title', label: 'Proposal' },
      { key: 'brandId', label: 'Brand', lookup: (r, l) => l.brandName(r.brandId) },
      { key: 'propertyId', label: 'Property', lookup: (r, l) => l.propName(r.propertyId) },
      { key: 'proposedRent', label: 'Rent', money: true }, { key: 'leasePeriod', label: 'Lease (yrs)' },
      { key: 'stage', label: 'Stage', badge: true }, { key: 'status', label: 'Status', badge: true },
    ],
    formFields: [
      { key: 'title', label: 'Proposal Title', required: true },
      { key: 'brandId', label: 'Brand', type: 'lookup', items: brandOpts },
      { key: 'propertyId', label: 'Property', type: 'lookup', items: propOpts },
      { key: 'proposedRent', label: 'Proposed Rent (₹/mo)', type: 'number' }, { key: 'securityDeposit', label: 'Security Deposit (₹)', type: 'number' },
      { key: 'leasePeriod', label: 'Lease Period (years)', type: 'number' }, { key: 'escalation', label: 'Escalation' },
      { key: 'stage', label: 'Stage', type: 'select', options: ['Draft','Sent','Negotiation','Counter Offer','Agreed','Rejected'] },
      { key: 'status', label: 'Status', type: 'select', options: ['Draft','Sent'] },
      { key: 'assignedTo', label: 'Assigned To', type: 'lookup', items: userOpts },
      { key: 'terms', label: 'Commercial Terms', type: 'textarea' },
    ],
    emptyForm: { title: '', brandId: '', propertyId: '', proposedRent: '', securityDeposit: '', leasePeriod: '', escalation: '5% per annum', stage: 'Draft', status: 'Draft', assignedTo: '', terms: '' },
  }} />;
}

export function LeasesPage() {
  return <GenericCrud config={{
    endpoint: '/leases', title: 'Leases & Agreements', subtitle: 'Lease lifecycle, rent, escalation and renewal tracking', singular: 'Lease',
    columns: [
      { key: 'tenantName', label: 'Tenant' },
      { key: 'propertyId', label: 'Property', lookup: (r, l) => l.propName(r.propertyId) },
      { key: 'monthlyRent', label: 'Monthly Rent', money: true },
      { key: 'commencementDate', label: 'Start', date: true }, { key: 'expiryDate', label: 'Expiry', date: true },
      { key: 'status', label: 'Status', badge: true },
    ],
    formFields: [
      { key: 'tenantName', label: 'Tenant Name', required: true },
      { key: 'propertyId', label: 'Property', type: 'lookup', items: propOpts },
      { key: 'brandId', label: 'Brand', type: 'lookup', items: brandOpts },
      { key: 'commencementDate', label: 'Commencement', type: 'date' }, { key: 'expiryDate', label: 'Expiry', type: 'date' },
      { key: 'monthlyRent', label: 'Monthly Rent (₹)', type: 'number' }, { key: 'securityDeposit', label: 'Security Deposit (₹)', type: 'number' },
      { key: 'escalation', label: 'Escalation' }, { key: 'renewalDate', label: 'Renewal Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: ['Active','Expired','Renewed','Terminated'] },
      { key: 'agreementDoc', label: 'Agreement Document URL' },
    ],
    emptyForm: { tenantName: '', propertyId: '', brandId: '', commencementDate: '', expiryDate: '', monthlyRent: '', securityDeposit: '', escalation: '5% per annum', renewalDate: '', status: 'Active', agreementDoc: '' },
  }} />;
}

export function TasksPage() {
  return <GenericCrud config={{
    endpoint: '/tasks', title: 'Tasks & Follow-ups', subtitle: 'Employee tasks, priorities, deadlines and overdue tracking', singular: 'Task',
    columns: [
      { key: 'title', label: 'Task' },
      { key: 'assignedTo', label: 'Assigned To', lookup: (r, l) => l.userName(r.assignedTo) },
      { key: 'priority', label: 'Priority', badge: true }, { key: 'status', label: 'Status', badge: true },
      { key: 'dueDate', label: 'Due Date', date: true },
    ],
    formFields: [
      { key: 'title', label: 'Task Title', required: true },
      { key: 'assignedTo', label: 'Assigned To', type: 'lookup', items: userOpts },
      { key: 'brandId', label: 'Brand', type: 'lookup', items: brandOpts },
      { key: 'propertyId', label: 'Property', type: 'lookup', items: propOpts },
      { key: 'priority', label: 'Priority', type: 'select', options: ['Low','Medium','High'] },
      { key: 'status', label: 'Status', type: 'select', options: ['Pending','In Progress','Completed'] },
      { key: 'dueDate', label: 'Due Date', type: 'date' },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
    emptyForm: { title: '', assignedTo: '', brandId: '', propertyId: '', priority: 'Medium', status: 'Pending', dueDate: '', description: '' },
  }} />;
}
