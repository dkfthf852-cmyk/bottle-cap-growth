const express = require('express');
const auth    = require('../middleware/auth');
const {
  getCharacter,
  feedCharacter,
  getGrowthLog,
  getLeaderboard,
  updateAppearance,
} = require('../services/characterService');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const character = await getCharacter(req.userId);
    if (!character) return res.status(404).json({ error: '캐릭터를 찾을 수 없습니다.' });
    res.json(character);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 먹이주기 (100 XP 소비 → 성장)
router.post('/feed', auth, async (req, res) => {
  try {
    const result = await feedCharacter(req.userId);
    res.json(result);
  } catch (err) {
    const status = err.message.includes('부족') ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
});

router.patch('/appearance', auth, async (req, res) => {
  try {
    const { appearance } = req.body;
    if (!appearance || typeof appearance !== 'object') {
      return res.status(400).json({ error: '외형 데이터가 필요합니다.' });
    }
    const updated = await updateAppearance(req.userId, appearance);
    res.json({ appearance: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/growth-log', auth, async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit  || 20), 100);
    const offset = parseInt(req.query.offset || 0);
    const log    = await getGrowthLog(req.userId, limit, offset);
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || 20), 50);
    const board = await getLeaderboard(limit);
    res.json(board);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
