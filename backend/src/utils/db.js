const fs = require('fs');
const path = require('path');
const { randomUUID: uuid } = require('crypto');
const access = require('./access');

const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, '../../data/db.json');
const driver = process.env.DB_DRIVER || 'json';
if (!['json', 'mysql'].includes(driver)) throw new Error(`Unsupported DB_DRIVER: ${driver}`);
const mysql = driver === 'mysql' ? require('./mysqlStore') : null;
const COLLECTIONS = ['users','properties','brands','leads','meetings','communications','proposals','leases','documents','tasks','notifications','activityLogs','reminders'];

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
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); // Fail closed rather than overwrite corrupt data.
}
function writeDB(db) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  const temp = `${DATA_FILE}.${process.pid}.${uuid()}.tmp`;
  try { fs.writeFileSync(temp, JSON.stringify(db, null, 2), { mode: 0o600 }); fs.renameSync(temp, DATA_FILE); }
  finally { if (fs.existsSync(temp)) fs.unlinkSync(temp); }
}

function rawFind(collection, id) { return mysql ? mysql.call('find', { collection, id: String(id) }) : (readDB()[collection] || []).find(r => String(r.id) === String(id)); }
function all(collection) { const list = mysql ? mysql.call('all', { collection }) : (readDB()[collection] || []); return list.filter(record => access.visible(collection, record, rawFind)); }
function find(collection, id) { const record = rawFind(collection,id); return record && access.visible(collection,record,rawFind) ? record : null; }
function getSettings() { return mysql ? mysql.call('getSettings') : (readDB().settings || {}); }
function setSettings(settings) { if (mysql) return mysql.call('setSettings', { settings }); const data = readDB(); data.settings = settings; writeDB(data); }
function filter(collection, fn) { return all(collection).filter(fn); }

function insert(collection, data) {
  const now = new Date().toISOString();
  const rec = { id: data.id || uuid(), createdAt: now, updatedAt: now, ...data };
  if (mysql) return mysql.call('insert', { collection, record: rec });
  const db = readDB();
  if (!Array.isArray(db[collection])) db[collection] = [];
  db[collection].push(rec); writeDB(db); return rec;
}
function update(collection, id, patch, expectedStatus) {
  if (!find(collection, id)) return null;
  if (mysql) return mysql.call('update', { collection, id: String(id), patch: { ...patch, updatedAt: new Date().toISOString() }, expectedStatus });
  const db = readDB();
  const i = db[collection].findIndex(r => String(r.id) === String(id));
  if (i === -1 || (expectedStatus !== undefined && db[collection][i].status !== expectedStatus)) return null;
  db[collection][i] = { ...db[collection][i], ...patch, updatedAt: new Date().toISOString() };
  writeDB(db); return db[collection][i];
}
function remove(collection, id) {
  if (!find(collection, id)) return false;
  if (mysql) return mysql.call('remove', { collection, id: String(id) });
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

module.exports = { readDB, writeDB, getSettings, setSettings, all, find, filter, insert, update, remove, paginate, searchFilter, logActivity, notify, COLLECTIONS };
