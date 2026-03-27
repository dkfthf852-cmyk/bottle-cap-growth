const express = require('express');
const auth    = require('../middleware/auth');
const {
  getCharacter,
  getGrowthLog,
  getLeaderboard,
  updateAppearance,
  updateName,
} = require('../services/characterService');

const router = express.Router();

// 내 캐릭터 조회
router.get('/', auth, async (req, res) => {
  try {
    const character = await getCharacter(req.userId);
    if (!character) return res.status(404).json({ error: '캐릭터를 찾을 수 없습니다.' });
    res.json(character);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 캐릭터 이름 변경
router.patch('/name', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: '이름을 입력해주세요.' });
    }
    const updated = await updateName(req.userId, name);
    res.json({ name: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 외형 변경
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

// 성장 로그
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

// 리더보드
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
