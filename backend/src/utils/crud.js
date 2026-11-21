const db = require('./db');

// Generic CRUD router factory. options: { collection, searchFields, entityName, writableFields }
function makeCrud(collection, opts = {}) {
  const express = require('express');
  const router = express.Router();
  const searchFields = opts.searchFields || ['name','title','status'];
  const writable = opts.writableFields || null;

  const pick = (body) => {
    if (!writable) return body;
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

  router.post('/', (req, res) => {
    const rec = db.insert(collection, { ...pick(req.body), createdBy: req.user.id, createdByName: req.user.name });
    db.logActivity(req.user, 'create', collection, rec.id, `Created ${opts.entityName || collection}`);
    res.status(201).json({ success: true, data: rec });
  });

  router.put('/:id', (req, res) => {
    const rec = db.update(collection, req.params.id, pick(req.body));
    if (!rec) return res.status(404).json({ success: false, message: 'Not found' });
    db.logActivity(req.user, 'update', collection, rec.id, `Updated ${opts.entityName || collection}`);
    res.json({ success: true, data: rec });
  });

  router.patch('/:id', (req, res) => {
    const rec = db.update(collection, req.params.id, pick(req.body));
    if (!rec) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: rec });
  });

  router.delete('/:id', (req, res) => {
    if (!db.remove(collection, req.params.id)) return res.status(404).json({ success: false, message: 'Not found' });
    db.logActivity(req.user, 'delete', collection, req.params.id, `Deleted ${opts.entityName || collection}`);
    res.json({ success: true, message: 'Deleted successfully' });
  });

  return router;
}
module.exports = { makeCrud };
