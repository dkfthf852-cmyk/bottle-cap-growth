const express = require('express');
const auth    = require('../middleware/auth');
const {
  createDonation,
  getDonations,
  getDonationById,
  getDonationPoints,
  getDonationStats,
} = require('../services/donationService');

const router = express.Router();

// 기부소 목록 (인증 불필요)
router.get('/points', async (req, res) => {
  try {
    const points = await getDonationPoints();
    res.json(points);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 기부 등록
router.post('/', auth, async (req, res) => {
  try {
    const { qrCode, donationPointId, quantity, userLat, userLng } = req.body;
    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: '기부 수량을 1개 이상 입력해주세요.' });
    }
    if (!qrCode && !donationPointId) {
      return res.status(400).json({ error: 'QR 코드 또는 기부소 ID가 필요합니다.' });
    }

    const donation = await createDonation(req.userId, {
      qrCode,
      donationPointId,
      quantity: parseInt(quantity),
      userLat,
      userLng,
    });

    res.status(201).json(donation);
  } catch (err) {
    const status = err.message.includes('유효하지') || err.message.includes('최대') ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
});

// 내 기부 내역
router.get('/', auth, async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit  || 20), 100);
    const offset = parseInt(req.query.offset || 0);
    const list   = await getDonations(req.userId, limit, offset);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 기부 통계
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await getDonationStats(req.userId);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 기부 단건 조회
router.get('/:id', auth, async (req, res) => {
  try {
    const donation = await getDonationById(req.userId, req.params.id);
    if (!donation) return res.status(404).json({ error: '기부 내역을 찾을 수 없습니다.' });
    res.json(donation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
