const fs = require('fs');
const path = require('path');
const pool = require('./connection');

async function initDb() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  try {
    await pool.query(sql);
    console.log('DB 초기화 완료');
  } catch (err) {
    console.error('DB 초기화 실패:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDb();
