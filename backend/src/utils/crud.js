const db = require('./db');

// Generic CRUD router factory. options: { collection, searchFields, entityName, writableFields }
function makeCrud(collection, opts = {}) {
  const express = require('express');
  const router = express.Router();
  router.use((req, res, next) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.user.role === 'viewer') return res.status(403).json({ success: false, message: 'Viewers have read-only access' });
    if (req.method === 'DELETE' && !['admin', 'manager'].includes(req.user.role)) return res.status(403).json({ success: false, message: 'Only admins and managers can delete records' });
    next();
  });
  const searchFields = opts.searchFields || ['name','title','status'];
  const writable = opts.writableFields || null;

  const pick = (body) => {
    if (!writable) { const { id, createdAt, updatedAt, createdBy, createdByName, ...fields } = body; return fields; }
    const out = {};
    writable.forEach(k => { if (body[k] !== undefined) out[k] = body[k]; });
    return out;
  };

  router.get('/', (req, res) => {
    let list = db.searchFilter(db.all(collection), req, searchFields);
    // enrich: attach related names where useful
    const result = db.paginate(list, req);
    res.json({ success: true, ...result });
  });

  router.get('/:id', (req, res) => {
    const rec = db.find(collection, req.params.id);
    if (!rec) return res.status(404).json({ success: false, message: `${opts.entityName || collection} not found` });
    res.json({ success: true, data: rec });
  });

  const invalidReference = body => ['propertyId','brandId'].some(key => body[key] && !db.find(key === 'propertyId' ? 'properties' : 'brands', body[key]));
  router.post('/', (req, res) => {
    if (invalidReference(req.body)) return res.status(400).json({success:false,message:'Linked record not found or access denied'});
    const rec = db.insert(collection, { ...pick(req.body), createdBy: req.user.id, createdByName: req.user.name });
    db.logActivity(req.user, 'create', collection, rec.id, JSON.stringify({ after: pick(req.body) }));
    res.status(201).json({ success: true, data: rec });
  });

  router.put('/:id', (req, res) => {
    if (invalidReference(req.body)) return res.status(400).json({success:false,message:'Linked record not found or access denied'});
    const before = db.find(collection, req.params.id);
    if (!before) return res.status(404).json({ success: false, message: 'Not found' });
    const changes = pick(req.body);
    const rec = db.update(collection, req.params.id, changes);
    if (!rec) return res.status(404).json({ success: false, message: 'Not found' });
    db.logActivity(req.user, 'update', collection, rec.id, JSON.stringify({ before: Object.fromEntries(Object.keys(changes).map(k => [k, before[k]])), after: changes }));
    res.json({ success: true, data: rec });
  });

  router.patch('/:id', (req, res) => {
    if (invalidReference(req.body)) return res.status(400).json({success:false,message:'Linked record not found or access denied'});
    const before = db.find(collection, req.params.id);
    if (!before) return res.status(404).json({ success: false, message: 'Not found' });
    const changes = pick(req.body);
    const rec = db.update(collection, req.params.id, changes);
    if (!rec) return res.status(404).json({ success: false, message: 'Not found' });
    db.logActivity(req.user, 'update', collection, rec.id, JSON.stringify({ before: Object.fromEntries(Object.keys(changes).map(k => [k, before[k]])), after: changes }));
    res.json({ success: true, data: rec });
  });

  router.delete('/:id', (req, res) => {
    const before = db.find(collection, req.params.id);
    if (!before || !db.remove(collection, req.params.id)) return res.status(404).json({ success: false, message: 'Not found' });
    db.logActivity(req.user, 'delete', collection, req.params.id, JSON.stringify({ before }));
    res.json({ success: true, message: 'Deleted successfully' });
  });

  return router;
}
module.exports = { makeCrud };
