const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const db = require('../utils/db');
const { requireRole } = require('../middleware/auth');
const uploadDir = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'));
fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ storage: multer.diskStorage({ destination: (req, file, cb) => cb(null, uploadDir), filename: (req, file, cb) => cb(null, crypto.randomUUID()) }), limits: { fileSize: 25 * 1024 * 1024 } });
const router = express.Router();
router.get('/', (req, res) => res.json({ success: true, ...db.paginate(db.searchFilter(db.all('documents'), req, ['title','category','fileName']), req) }));
router.get('/:id/download', (req, res) => {
  const doc = db.find('documents', req.params.id);
  if (!doc || !doc.fileUrl || !doc.fileUrl.startsWith('/uploads/')) return res.status(404).json({ success: false, message: 'File not found' });
  const filename = doc.fileUrl.slice('/uploads/'.length);
  const file = path.resolve(uploadDir, filename);
  if (path.dirname(file) !== uploadDir || !fs.existsSync(file) || !fs.lstatSync(file).isFile()) return res.status(404).json({ success: false, message: 'File not found' });
  res.set('X-Content-Type-Options', 'nosniff');
  res.download(file, path.basename(doc.fileName || 'document'));
});
router.get('/:id', (req, res) => { const doc = db.find('documents', req.params.id); if (!doc) return res.status(404).json({ success: false, message: 'Not found' }); res.json({ success: true, data: doc }); });
router.post('/upload', requireRole('admin','manager','employee'), upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'A file is required' });
  if ((req.body.propertyId && !db.find('properties', req.body.propertyId)) || (req.body.brandId && !db.find('brands', req.body.brandId))) { fs.unlinkSync(req.file.path); return res.status(400).json({ success: false, message: 'Invalid property or brand' }); }
  const rec = db.insert('documents', { title: req.body.title || req.file.originalname, category: req.body.category || 'Other', propertyId: req.body.propertyId || null, brandId: req.body.brandId || null, fileName: path.basename(req.file.originalname), fileUrl: `/uploads/${req.file.filename}`, notes: req.body.notes || '', uploadedBy: req.user.id, createdBy: req.user.id, createdByName: req.user.name });
  db.logActivity(req.user, 'create', 'documents', rec.id, 'Uploaded document');
  res.status(201).json({ success: true, data: rec });
});
router.put('/:id', requireRole('admin','manager','employee'), (req, res) => {
  const doc = db.find('documents', req.params.id);
  if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
  const allowed = ['title','category','propertyId','brandId','notes'];
  const patch = Object.fromEntries(allowed.filter(k => req.body[k] !== undefined).map(k => [k, req.body[k]]));
  if (typeof patch.title !== 'string' || !patch.title.trim() || (patch.propertyId && !db.find('properties', patch.propertyId)) || (patch.brandId && !db.find('brands', patch.brandId))) return res.status(400).json({ success: false, message: 'Enter a valid title, property and brand' });
  const item = db.update('documents', doc.id, patch);
  db.logActivity(req.user, 'update', 'documents', doc.id, 'Updated document details');
  res.json({ success: true, data: item });
});
router.delete('/:id', requireRole('admin','manager'), (req, res) => {
  const doc = db.find('documents', req.params.id);
  if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
  db.remove('documents', req.params.id);
  if (doc.fileUrl?.startsWith('/uploads/')) { const file = path.resolve(uploadDir, doc.fileUrl.slice(9)); if (path.dirname(file) === uploadDir && fs.existsSync(file) && fs.lstatSync(file).isFile()) fs.unlinkSync(file); }
  db.logActivity(req.user, 'delete', 'documents', doc.id, 'Deleted document');
  res.json({ success: true });
});
module.exports = router;
