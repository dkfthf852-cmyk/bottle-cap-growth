require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const migrate = require('./db/migrate');

const authRoutes      = require('./routes/auth');
const donationRoutes  = require('./routes/donations');
const characterRoutes = require('./routes/characters');
const { creditXpFromDonation } = require('./services/characterService');
const { eventBus, EVENTS }    = require('./events/eventBus');

const app  = express();
const PORT = process.env.PORT || 4000;

// ── 미들웨어 ──────────────────────────────────────────────
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : '*',
}));
app.use(express.json());

// 요청 로깅
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── 라우트 ────────────────────────────────────────────────
app.use('/api/v1/auth',       authRoutes);
app.use('/api/v1/donations',  donationRoutes);
app.use('/api/v1/character',  characterRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));

// ── 이벤트 구독 (Growth Engine) ───────────────────────────
eventBus.on(EVENTS.DONATION_VERIFIED, async (donation) => {
  try {
    const result = await creditXpFromDonation(donation);
    console.log(`[XP 적립] user=${donation.user_id} weight=${donation.weight_grams}g xp=+${result.xpGained}`);
  } catch (err) {
    console.error('[Growth] 오류:', err.message);
  }
});

eventBus.on(EVENTS.CHARACTER_LEVELED_UP, ({ userId, levelBefore, levelAfter, xpGained }) => {
  console.log(`[Notify] 레벨업! user=${userId} ${levelBefore}→${levelAfter} (+${xpGained} XP)`);
});

eventBus.on(EVENTS.CHARACTER_STAGE_CHANGED, ({ userId, stageBefore, stageAfter }) => {
  console.log(`[Notify] 스테이지 변경! user=${userId} ${stageBefore}→${stageAfter}`);
});

// ── 오류 핸들러 ───────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
});

migrate()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`서버 실행 중: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[DB] 마이그레이션 실패:', err.message);
    process.exit(1);
  });

module.exports = app;
