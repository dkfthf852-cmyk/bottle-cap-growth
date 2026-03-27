const pool = require('../db/connection');
const { eventBus, EVENTS } = require('../events/eventBus');

async function findDonationPoint(qrCode) {
  const res = await pool.query(
    'SELECT * FROM donation_points WHERE qr_code = $1 AND is_active = TRUE',
    [qrCode]
  );
  return res.rows[0] || null;
}

async function getDonationPointById(id) {
  const res = await pool.query(
    'SELECT * FROM donation_points WHERE id = $1 AND is_active = TRUE',
    [id]
  );
  return res.rows[0] || null;
}

// 기부 등록 (quantity: 개수, weightGrams: 무게)
async function createDonation(userId, { qrCode, donationPointId, quantity, weightGrams }) {
  let point;
  if (qrCode)          point = await findDonationPoint(qrCode);
  else if (donationPointId) point = await getDonationPointById(donationPointId);
  if (!point) throw new Error('유효하지 않은 기부소입니다.');

  if (!weightGrams || weightGrams < 1) throw new Error('무게를 입력해주세요. (1g 이상)');
  if (weightGrams > 10000) throw new Error('1회 최대 10,000g까지 입력 가능합니다.');

  const res = await pool.query(
    `INSERT INTO donations (user_id, quantity, weight_grams, donation_point_id, status, verified_at)
     VALUES ($1, $2, $3, $4, 'VERIFIED', NOW())
     RETURNING *`,
    [userId, quantity || 0, weightGrams, point.id]
  );
  const donation = { ...res.rows[0], donation_point: point };

  eventBus.emit(EVENTS.DONATION_VERIFIED, donation);
  return donation;
}

async function getDonations(userId, limit = 20, offset = 0) {
  const res = await pool.query(
    `SELECT d.*, dp.name AS point_name, dp.address AS point_address
     FROM donations d
     JOIN donation_points dp ON d.donation_point_id = dp.id
     WHERE d.user_id = $1
     ORDER BY d.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return res.rows;
}

async function getDonationById(userId, donationId) {
  const res = await pool.query(
    `SELECT d.*, dp.name AS point_name
     FROM donations d
     JOIN donation_points dp ON d.donation_point_id = dp.id
     WHERE d.id = $1 AND d.user_id = $2`,
    [donationId, userId]
  );
  return res.rows[0] || null;
}

async function getDonationPoints() {
  const res = await pool.query(
    'SELECT id, name, address, latitude, longitude, qr_code FROM donation_points WHERE is_active = TRUE ORDER BY name'
  );
  return res.rows;
}

async function getDonationStats(userId) {
  const res = await pool.query(
    `SELECT
       COUNT(*)        AS total_donations,
       SUM(quantity)   AS total_caps,
       SUM(weight_grams) AS total_weight_grams,
       SUM(xp_awarded) AS total_xp,
       MAX(created_at) AS last_donation_at
     FROM donations
     WHERE user_id = $1 AND status = 'VERIFIED'`,
    [userId]
  );
  return res.rows[0];
}

module.exports = {
  createDonation,
  getDonations,
  getDonationById,
  getDonationPoints,
  getDonationStats,
};
