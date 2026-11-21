const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('crypto');
// Explicit opt-in: requires an initialized, disposable MySQL database.
test('MySQL persistence, atomic update and compare-and-set', { skip: process.env.MYSQL_TEST !== '1' }, () => {
  process.env.DB_DRIVER = 'mysql';
  const db = require('../src/utils/db');
  require('../src/utils/mysqlStore').call('ping');
  const id = randomUUID();
  try {
    db.insert('tasks', { id, title:'Integration test', status:'Queued' });
    assert.equal(db.find('tasks',id).title,'Integration test');
    assert.equal(db.update('tasks',id,{status:'Sending'},'Queued').status,'Sending');
    assert.equal(db.update('tasks',id,{status:'Cancelled'},'Queued'),null);
    assert.equal(db.find('tasks',id).status,'Sending');
  } finally { db.remove('tasks',id); }
});
