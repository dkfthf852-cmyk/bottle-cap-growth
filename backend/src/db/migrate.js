// 앱 시작 시 자동으로 스키마를 생성/업데이트
const fs   = require('fs');
const path = require('path');
const pool = require('./connection');

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('[DB] 마이그레이션 완료');
}

module.exports = migrate;
