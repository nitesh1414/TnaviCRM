require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { COLLECTIONS } = require('../src/utils/db');
async function main() {
  if (!process.argv.includes('--confirm-empty')) throw new Error('Pass --confirm-empty after backing up both stores. Import refuses a non-empty destination.');
  const file = process.env.DATA_FILE || path.join(__dirname, '../data/db.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const connection = await mysql.createConnection({host:process.env.MYSQL_HOST || '127.0.0.1',port:Number(process.env.MYSQL_PORT || 3306),user:process.env.MYSQL_USER || 'tnavicrm',password:process.env.MYSQL_PASSWORD || '',database:process.env.MYSQL_DATABASE || 'tnavicrm'});
  try {
    await connection.beginTransaction();
    const [records] = await connection.query('SELECT COUNT(*) AS n FROM crm_records');
    const [settings] = await connection.query('SELECT COUNT(*) AS n FROM crm_settings');
    if (Number(records[0].n) || Number(settings[0].n)) throw new Error('Destination is not empty; refusing import.');
    let count = 0;
    for (const collection of COLLECTIONS) {
      if (data[collection] !== undefined && !Array.isArray(data[collection])) throw new Error(`Invalid collection: ${collection}`);
      for (const record of data[collection] || []) {
        if (!record.id || !record.createdAt) throw new Error(`Invalid record in ${collection}`);
        await connection.execute('INSERT INTO crm_records (collection,id,data,created_at) VALUES (?,?,?,?)',[collection,String(record.id),JSON.stringify(record),record.createdAt]); count++;
      }
    }
    if (data.settings) await connection.execute('INSERT INTO crm_settings (id,data) VALUES (1,?)',[JSON.stringify(data.settings)]);
    await connection.commit(); console.log(`Imported ${count} records. Uploads remain on the filesystem; back them up separately.`);
  } catch (e) { await connection.rollback(); throw e; } finally { await connection.end(); }
}
main().catch(err => { console.error(err.message); process.exitCode = 1; });
