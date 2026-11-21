const express = require('express');
const db = require('../utils/db');
const { requireRole } = require('../middleware/auth');
const router = express.Router();
const editable = ['title','brandId','propertyId','proposedRent','securityDeposit','leasePeriod','escalation','terms','stage','status','assignedTo'];
const allowedStages = ['Draft','Sent','Negotiation','Counter Offer','Agreed','Rejected'];
const allowedStatuses = ['Draft','Sent','Approved','Rejected'];
function pick(input) { return Object.fromEntries(editable.filter(k => input[k] !== undefined).map(k => [k, input[k]])); }
function validate(data) {
  if (typeof data.title !== 'string' || !data.title.trim()) return 'A proposal title is required';
  if (data.brandId && !db.find('brands', data.brandId)) return 'Brand not found';
  if (data.propertyId && !db.find('properties', data.propertyId)) return 'Property not found';
  if (data.stage && !allowedStages.includes(data.stage)) return 'Invalid stage';
  if (data.status && !allowedStatuses.includes(data.status)) return 'Invalid status';
  for (const field of ['proposedRent','securityDeposit','leasePeriod']) if (data[field] !== '' && data[field] != null && (!Number.isFinite(Number(data[field])) || Number(data[field]) < 0)) return `${field} must be a non-negative number`;
  return '';
}
function revision(proposal, actor, event) {
  const snapshot = pick(proposal);
  return { at: new Date().toISOString(), actorId: actor.id, actorName: actor.name, event, snapshot };
}
router.get('/', (req,res) => res.json({ success:true, ...db.paginate(db.searchFilter(db.all('proposals'), req, ['title','stage','status','terms']), req) }));
router.get('/:id', (req,res) => { const item = db.find('proposals',req.params.id); if (!item) return res.status(404).json({success:false,message:'Proposal not found'}); res.json({success:true,data:item}); });
router.post('/', requireRole('admin','manager','employee'), (req,res) => {
  const input = { stage:'Draft', status:'Draft', ...pick(req.body) };
  if (['Approved','Rejected'].includes(input.status)) return res.status(400).json({success:false,message:'Use the approval workflow for final decisions'});
  const error = validate(input);
  if (error) return res.status(400).json({success:false,message:error});
  const item = db.insert('proposals', {...input, counterOffers: [], approvalState: 'Draft', approvalHistory: [], revisions: [revision(input,req.user,'Created')], createdBy:req.user.id, createdByName:req.user.name});
  db.logActivity(req.user,'create','proposals',item.id,'Created proposal'); res.status(201).json({success:true,data:item});
});
router.put('/:id', requireRole('admin','manager','employee'), (req,res) => {
  const current = db.find('proposals',req.params.id); if (!current) return res.status(404).json({success:false,message:'Proposal not found'});
  if (['Pending','Approved'].includes(current.approvalState)) return res.status(409).json({success:false,message:'Proposal is locked while pending or approved; reopen it before editing'});
  const input = pick(req.body);
  if (current.approvalState === 'Rejected' && input.status === 'Rejected') input.status = 'Draft';
  if (['Approved','Rejected'].includes(input.status)) return res.status(400).json({success:false,message:'Use the approval workflow for final decisions'});
  const revised = current.approvalState === 'Rejected';
  if (revised && !input.status) input.status = 'Draft';
  const merged = {...current,...input,...(revised ? {approvalState:'Draft'} : {})}; const error = validate(merged);
  if (error) return res.status(400).json({success:false,message:error});
  const approvalHistory = revised ? [...(current.approvalHistory || []), { from:'Rejected', to:'Draft', action:'revise', note:'Revised after rejection', at:new Date().toISOString(), actorId:req.user.id, actorName:req.user.name }] : current.approvalHistory || [];
  const item = db.update('proposals',current.id,{...input,...(revised ? { approvalState:'Draft', approvalHistory } : {}),revisions:[...(current.revisions || []),revision(merged,req.user,'Updated')]});
  db.logActivity(req.user,'update','proposals',item.id,'Updated proposal'); res.json({success:true,data:item});
});
router.post('/:id/counter-offers', requireRole('admin','manager','employee'), (req,res) => {
  const current = db.find('proposals',req.params.id); if (!current) return res.status(404).json({success:false,message:'Proposal not found'});
  if (['Pending','Approved'].includes(current.approvalState)) return res.status(409).json({success:false,message:'Proposal is locked while pending or approved'});
  const { by, rent, date, notes = '' } = req.body;
  if (!['Brand','Owner','Company'].includes(by) || rent === '' || !Number.isFinite(Number(rent)) || Number(rent) < 0 || typeof date !== 'string' || (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date) || typeof notes !== 'string' || notes.length > 5000) return res.status(400).json({success:false,message:'Enter a valid party, amount, date and notes'});
  const offer = { id:require('crypto').randomUUID(), by, rent:Number(rent), date, notes, createdAt:new Date().toISOString(), createdBy:req.user.id, createdByName:req.user.name };
  const item = db.update('proposals',current.id,{counterOffers:[...(current.counterOffers || []),offer], revisions:[...(current.revisions || []), revision(current,req.user,`Counter-offer from ${by}`)]});
  db.logActivity(req.user,'counter-offer','proposals',item.id,`Counter-offer from ${by}`); res.status(201).json({success:true,data:item});
});
router.post('/:id/approval', requireRole('admin','manager','employee'), (req,res) => {
  const current = db.find('proposals',req.params.id); if (!current) return res.status(404).json({success:false,message:'Proposal not found'});
  const { action, note = '' } = req.body;
  if (typeof note !== 'string' || note.length > 5000) return res.status(400).json({success:false,message:'Invalid decision note'});
  const previous = current.approvalState || 'Draft';
  let next;
  if (action === 'request' && ['Draft','Rejected'].includes(previous)) next = 'Pending';
  else if (['approve','reject'].includes(action) && previous === 'Pending' && ['admin','manager'].includes(req.user.role)) next = action === 'approve' ? 'Approved' : 'Rejected';
  else if (action === 'reopen' && ['Approved','Rejected'].includes(previous) && ['admin','manager'].includes(req.user.role)) next = 'Draft';
  else return res.status(403).json({success:false,message:'This approval transition is not permitted for your role or the current state'});
  const requester = (current.approvalHistory || []).filter(e => e.action === 'request').slice(-1)[0];
  if (['approve','reject'].includes(action) && requester?.actorId === req.user.id) return res.status(403).json({success:false,message:'A different manager or admin must review this request'});
  if (['approve','reject'].includes(action) && !note.trim()) return res.status(400).json({success:false,message:'A decision note is required'});
  const event = { from: previous, to: next, action, note, at:new Date().toISOString(), actorId:req.user.id, actorName:req.user.name };
  const merged = { ...current, approvalState:next, status:next === 'Approved' ? 'Approved' : next === 'Rejected' ? 'Rejected' : (['Approved','Rejected'].includes(current.status) ? 'Draft' : current.status) };
  const item = db.update('proposals', current.id, {approvalState:next, status:merged.status, approvalHistory:[...(current.approvalHistory || []),event], revisions:[...(current.revisions || []),revision(merged,req.user,`Approval ${action}`)]});
  db.logActivity(req.user, `approval-${action}`, 'proposals', item.id, `Approval ${previous} → ${next}: ${note}`);
  res.json({success:true,data:item});
});
router.delete('/:id', requireRole('admin','manager'), (req,res) => { const before = db.find('proposals',req.params.id); if (!before || !db.remove('proposals',req.params.id)) return res.status(404).json({success:false,message:'Proposal not found'}); db.logActivity(req.user,'delete','proposals',req.params.id,JSON.stringify({before})); res.json({success:true}); });
module.exports = router;
