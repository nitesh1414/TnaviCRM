const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { applySchema } = require('../scripts/setup-mysql');

test('setup applies both idempotent table statements and propagates errors', async () => {
  const schema = fs.readFileSync(path.join(__dirname, '../mysql-store.sql'), 'utf8');
  const statements = [];
  await applySchema({ query: async sql => { statements.push(sql); } }, schema);
  assert.equal(statements.length, 2);
  assert.match(statements[0], /^CREATE TABLE IF NOT EXISTS crm_records/);
  assert.match(statements[1], /^CREATE TABLE IF NOT EXISTS crm_settings/);
  await assert.rejects(applySchema({ query: async () => { throw new Error('CREATE denied'); } }, schema), /CREATE denied/);
});

test('seed reads DB_DRIVER from .env before choosing a database', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'tnavi-seed-env-'));
  try {
    const dataFile = path.join(temp, 'data.json').replace(/\\/g, '/');
    fs.writeFileSync(path.join(temp, '.env'), `DB_DRIVER=mysql\nMYSQL_HOST=127.0.0.1\nMYSQL_PORT=1\nDATA_FILE=${dataFile}\n`);
    const env = { ...process.env };
    for (const key of ['DB_DRIVER','DATA_FILE','MYSQL_HOST','MYSQL_PORT','MYSQL_DATABASE','MYSQL_USER','MYSQL_PASSWORD']) delete env[key];
    const run = spawnSync(process.execPath, [path.join(__dirname, '../src/seed.js')], { cwd: temp, env, encoding: 'utf8', timeout: 15000 });
    assert.equal(run.status, 1, run.stderr);
    assert.match(run.stderr, /Seed failed: MySQL:/);
    assert.equal(fs.existsSync(dataFile), false, 'seed must not silently write to JSON');
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});
