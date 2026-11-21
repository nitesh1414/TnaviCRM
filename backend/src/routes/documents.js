const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../utils/db');
const { makeCrud } = require('../utils/crud');

const uploadDir = path.join(__dirname, '../../uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`),
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

const router = makeCrud('documents', { entityName: 'Document', searchFields: ['title','category','fileName'] });

// file upload endpoint (overrides generic POST file handling)
router.post('/upload', upload.single('file'), (req, res) => {
  const fileUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.fileUrl || '');
  const rec = db.insert('documents', {
    title: req.body.title || (req.file ? req.file.originalname : 'Untitled'),
    category: req.body.category || 'Other',
    propertyId: req.body.propertyId || null,
    brandId: req.body.brandId || null,
    fileName: req.file ? req.file.originalname : '',
    fileUrl,
    notes: req.body.notes || '',
    uploadedBy: req.user.id,
    createdBy: req.user.id, createdByName: req.user.name,
  });
  res.status(201).json({ success: true, data: rec });
});

module.exports = router;
