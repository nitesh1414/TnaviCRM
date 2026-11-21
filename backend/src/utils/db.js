const fs = require('fs');
const path = require('path');
const { v4: uuid } = require('uuid');

const DATA_FILE = path.join(__dirname, '../../data/db.json');
const COLLECTIONS = ['users','properties','brands','leads','meetings','communications','proposals','leases','documents','tasks','notifications','activityLogs'];

function ensureFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    const empty = {};
    COLLECTIONS.forEach(c => empty[c] = []);
    fs.writeFileSync(DATA_FILE, JSON.stringify(empty, null, 2));
  }
}
function readDB() {
  ensureFile();
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { const empty = {}; COLLECTIONS.forEach(c => empty[c] = []); return empty; }
}
function writeDB(db) { fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true }); fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2)); }

function all(collection) { return readDB()[collection] || []; }
function find(collection, id) { return all(collection).find(r => String(r.id) === String(id)); }
function filter(collection, fn) { return all(collection).filter(fn); }

function insert(collection, data) {
  const db = readDB();
  const now = new Date().toISOString();
  const rec = { id: data.id || uuid(), createdAt: now, updatedAt: now, ...data };
  db[collection].push(rec); writeDB(db); return rec;
}
function update(collection, id, patch) {
  const db = readDB();
  const i = db[collection].findIndex(r => String(r.id) === String(id));
  if (i === -1) return null;
  db[collection][i] = { ...db[collection][i], ...patch, updatedAt: new Date().toISOString() };
  writeDB(db); return db[collection][i];
}
function remove(collection, id) {
  const db = readDB();
  const i = db[collection].findIndex(r => String(r.id) === String(id));
  if (i === -1) return false;
  db[collection].splice(i, 1); writeDB(db); return true;
}
function paginate(list, req) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const total = list.length;
  const data = list.slice((page - 1) * limit, page * limit);
  return { data, total, page, limit, pages: Math.ceil(total / limit) || 1 };
}
function searchFilter(list, req, fields) {
  const q = (req.query.search || '').toLowerCase().trim();
  let out = list;
  if (q) out = out.filter(r => fields.some(f => String(r[f] || '').toLowerCase().includes(q)));
  // generic filters: ?status=, ?brandId=, ?propertyId=, ?assignedTo=, ?category=, ?type=
  ['status','brandId','propertyId','assignedTo','category','type','priority','stage','employeeId','ownerId'].forEach(k => {
    if (req.query[k]) out = out.filter(r => String(r[k]) === String(req.query[k]));
  });
  if (req.query.from) out = out.filter(r => new Date(r.createdAt) >= new Date(req.query.from));
  if (req.query.to) out = out.filter(r => new Date(r.createdAt) <= new Date(req.query.to));
  return out.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
}
function logActivity(user, action, entity, entityId, details) {
  try { insert('activityLogs', { userId: user?.id || null, userName: user?.name || 'system', action, entity, entityId, details: details || '' }); } catch {}
}
function notify(userId, title, message, type = 'info', relatedId = null) {
  try { return insert('notifications', { userId, title, message, type, relatedId, read: false }); } catch { return null; }
}

module.exports = { readDB, writeDB, all, find, filter, insert, update, remove, paginate, searchFilter, logActivity, notify, COLLECTIONS };
