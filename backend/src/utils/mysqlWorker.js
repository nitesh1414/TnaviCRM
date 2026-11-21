// Runs MySQL I/O off the main thread for the prototype's synchronous repository API.
const { parentPort } = require('worker_threads');
const mysql = require('mysql2/promise');
const pool = mysql.createPool({ host: process.env.MYSQL_HOST || '127.0.0.1', port: Number(process.env.MYSQL_PORT || 3306), user: process.env.MYSQL_USER || 'tnavicrm', password: process.env.MYSQL_PASSWORD || '', database: process.env.MYSQL_DATABASE || 'tnavicrm', connectionLimit: 2, connectTimeout: 10000, multipleStatements: false });
function parse(v) { return typeof v === 'string' ? JSON.parse(v) : v; }
async function execute(op, args) {
  if (op === 'ping') { await pool.query('SELECT 1 FROM crm_records LIMIT 1'); await pool.query('SELECT 1 FROM crm_settings LIMIT 1'); return true; }
  if (op === 'all') { const [rows] = await pool.execute('SELECT data FROM crm_records WHERE collection = ? ORDER BY created_at, id', [args.collection]); return rows.map(r => parse(r.data)); }
  if (op === 'find') { const [rows] = await pool.execute('SELECT data FROM crm_records WHERE collection = ? AND id = ?', [args.collection,args.id]); return rows.length ? parse(rows[0].data) : null; }
  if (op === 'insert') { await pool.execute('INSERT INTO crm_records (collection,id,data,created_at) VALUES (?,?,?,?)',[args.collection,args.record.id,JSON.stringify(args.record),args.record.createdAt]); return args.record; }
  if (op === 'remove') { const [r] = await pool.execute('DELETE FROM crm_records WHERE collection = ? AND id = ?', [args.collection,args.id]); return r.affectedRows > 0; }
  if (op === 'update') {
    const c = await pool.getConnection();
    try { await c.beginTransaction(); const [rows] = await c.execute('SELECT data FROM crm_records WHERE collection = ? AND id = ? FOR UPDATE',[args.collection,args.id]);
      if (!rows.length) { await c.rollback(); return null; }
      const old = parse(rows[0].data);
      if (args.expectedStatus !== undefined && old.status !== args.expectedStatus) { await c.rollback(); return null; }
      const record = {...old,...args.patch};
      await c.execute('UPDATE crm_records SET data = ? WHERE collection = ? AND id = ?', [JSON.stringify(record),args.collection,args.id]); await c.commit(); return record;
    } catch (e) { await c.rollback(); throw e; } finally { c.release(); }
  }
  if (op === 'getSettings') { const [rows] = await pool.query("SELECT data FROM crm_settings WHERE id = 1"); return rows.length ? parse(rows[0].data) : {}; }
  if (op === 'setSettings') { await pool.execute('INSERT INTO crm_settings (id,data) VALUES (1,?) ON DUPLICATE KEY UPDATE data=VALUES(data)', [JSON.stringify(args.settings)]); return true; }
  throw new Error('Unknown MySQL operation');
}
parentPort.on('message', async ({ op, args, buffer }) => {
  const signal = new Int32Array(buffer,0,2); const bytes = new Uint8Array(buffer,8);
  let result;
  try { result = { result: await execute(op,args) }; } catch (e) { result = { error: e.message }; }
  let data = Buffer.from(JSON.stringify(result));
  if (data.length > bytes.length) data = Buffer.from(JSON.stringify({error:'MySQL result exceeds the 16 MB adapter limit'}));
  bytes.set(data); Atomics.store(signal,1,data.length); Atomics.store(signal,0,1); Atomics.notify(signal,0);
});
