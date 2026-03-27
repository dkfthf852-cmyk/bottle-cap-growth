const pool = require('../db/connection');
const { eventBus, EVENTS } = require('../events/eventBus');

// QR 코드로 기부소 조회
async function findDonationPoint(qrCode) {
  const res = await pool.query(
    'SELECT * FROM donation_points WHERE qr_code = $1 AND is_active = TRUE',
    [qrCode]
  );
  return res.rows[0] || null;
}

// 기부소 ID로 기부소 조회
async function getDonationPointById(id) {
  const res = await pool.query(
    'SELECT * FROM donation_points WHERE id = $1 AND is_active = TRUE',
    [id]
  );
  return res.rows[0] || null;
}

// 기부 등록 및 즉시 인증 (QR 기반 자동 인증)
async function createDonation(userId, { qrCode, donationPointId, quantity, userLat, userLng }) {
  let point;
  if (qrCode) {
    point = await findDonationPoint(qrCode);
  } else if (donationPointId) {
    point = await getDonationPointById(donationPointId);
  }

  if (!point) throw new Error('유효하지 않은 기부소입니다.');

  // GPS 위치 검증 (옵션: 반경 500m 이내)
  if (userLat && userLng && point.latitude && point.longitude) {
    const dist = haversineDistance(userLat, userLng, point.latitude, point.longitude);
    if (dist > 500) {
      throw new Error(`기부소와의 거리가 너무 멉니다. (${Math.round(dist)}m)`);
    }
  }

  // 일일 기부 횟수 제한 (동일 기부소, 하루 최대 3회)
  const todayCount = await pool.query(
    `SELECT COUNT(*) FROM donations
     WHERE user_id = $1 AND donation_point_id = $2
       AND created_at > NOW() - INTERVAL '24 hours'`,
    [userId, point.id]
  );
  if (parseInt(todayCount.rows[0].count) >= 3) {
    throw new Error('동일 기부소에서 하루 최대 3회까지 기부 가능합니다.');
  }

  // 대량 기부 어뷰징 방지 (1회 최대 500개)
  if (quantity > 500) throw new Error('1회 최대 500개까지 기부 가능합니다.');

  const res = await pool.query(
    `INSERT INTO donations (user_id, quantity, donation_point_id, status, verified_at)
     VALUES ($1, $2, $3, 'VERIFIED', NOW())
     RETURNING *`,
    [userId, quantity, point.id]
  );
  const donation = { ...res.rows[0], donation_point: point };

  // 이벤트 발행 → Growth Engine이 구독
  eventBus.emit(EVENTS.DONATION_VERIFIED, donation);

  return donation;
}

// 내 기부 내역 조회
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

// 기부 단건 조회
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

// 기부소 목록 조회
async function getDonationPoints() {
  const res = await pool.query(
    'SELECT id, name, address, latitude, longitude, qr_code FROM donation_points WHERE is_active = TRUE ORDER BY name'
  );
  return res.rows;
}

// 기부 통계 조회
async function getDonationStats(userId) {
  const res = await pool.query(
    `SELECT
       COUNT(*)              AS total_donations,
       SUM(quantity)         AS total_caps,
       SUM(xp_awarded)       AS total_xp,
       MAX(quantity)         AS max_single_donation,
       MIN(created_at)       AS first_donation_at,
       MAX(created_at)       AS last_donation_at
     FROM donations
     WHERE user_id = $1 AND status = 'VERIFIED'`,
    [userId]
  );
  return res.rows[0];
}

// Haversine 거리 계산 (미터)
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

module.exports = {
  createDonation,
  getDonations,
  getDonationById,
  getDonationPoints,
  getDonationStats,
};
