require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// The checked-in schema consists of two independent CREATE TABLE IF NOT EXISTS statements.
async function applySchema(connection, schema) {
  const statements = schema.split('\n').filter(line => !line.trimStart().startsWith('--')).join('\n').split(';').map(s => s.trim()).filter(Boolean);
  for (const statement of statements) await connection.query(statement);
}

async function main() {
  const schema = fs.readFileSync(path.join(__dirname, '../mysql-store.sql'), 'utf8');
  const database = process.env.MYSQL_DATABASE || 'tnavicrm';
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1', port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'tnavicrm', password: process.env.MYSQL_PASSWORD || '', database,
  });
  try {
    await applySchema(connection, schema);
    console.log(`MySQL tables are ready in ${database}. Existing data was not deleted or seeded.`);
  } finally { await connection.end(); }
}
if (require.main === module) main().catch(err => {
  console.error(`MySQL setup failed: ${err.message}`);
  console.error('Check that the database exists and that MYSQL_* settings in backend/.env grant CREATE TABLE access.');
  process.exitCode = 1;
});
module.exports = { applySchema };
