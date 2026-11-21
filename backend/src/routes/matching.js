const express = require('express');
const db = require('../utils/db');
const router = express.Router();

// POST /api/matching/score  { brandId } -> scored available properties
router.post('/score', (req, res) => {
  const brand = db.find('brands', req.body.brandId);
  if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });
  const reqs = brand.requirements || {};
  const minArea = Number(reqs.minArea || 0);
  const maxBudget = Number(reqs.maxBudget || Infinity);
  const prefs = (reqs.preferredLocations || []).map(s => String(s).toLowerCase());
  const types = (reqs.propertyTypes || []).map(s => String(s).toLowerCase());

  const scored = db.all('properties').map(p => {
    let score = 0; const reasons = [];
    if (p.status === 'Available') { score += 20; reasons.push('Available'); }
    else if (p.status === 'Under Negotiation') { score += 5; reasons.push('Under negotiation'); }
    else { score -= 50; reasons.push('Already leased'); }
    if (types.length && types.includes(String(p.type).toLowerCase())) { score += 25; reasons.push(`Type match (${p.type})`); }
    if (minArea && Number(p.totalArea) >= minArea) { score += 20; reasons.push(`Area ${p.totalArea} sq.ft ≥ ${minArea}`); }
    else if (minArea) { score -= 10; reasons.push(`Area below requirement`); }
    if (Number(p.expectedRent) <= maxBudget) { score += 20; reasons.push(`Within budget ₹${Number(p.expectedRent).toLocaleString('en-IN')}`); }
    else { score -= 10; reasons.push('Above budget'); }
    const locText = `${p.location} ${p.area} ${p.city}`.toLowerCase();
    if (prefs.some(pref => locText.includes(pref))) { score += 15; reasons.push('Preferred location'); }
    return { property: p, score: Math.max(0, Math.min(100, score)), reasons };
  }).sort((a,b) => b.score - a.score);

  res.json({ success: true, data: { brand, matches: scored } });
});

// GET /api/matching/brand/:brandId/properties  -> properties with interest tracking
router.get('/brand/:brandId/properties', (req, res) => {
  const brandId = req.params.brandId;
  const leads = db.all('leads').filter(l => String(l.brandId) === String(brandId));
  const proposals = db.all('proposals').filter(p => String(p.brandId) === String(brandId));
  const comms = db.all('communications').filter(c => String(c.brandId) === String(brandId));
  res.json({ success: true, data: { leads, proposals, communications: comms } });
});

// GET /api/matching/property/:propertyId/brands
router.get('/property/:propertyId/brands', (req, res) => {
  const propertyId = req.params.propertyId;
  const leads = db.all('leads').filter(l => String(l.propertyId) === String(propertyId));
  const proposals = db.all('proposals').filter(p => String(p.propertyId) === String(propertyId));
  res.json({ success: true, data: { leads, proposals } });
});

module.exports = router;
