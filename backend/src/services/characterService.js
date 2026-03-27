const pool = require('../db/connection');
const { processGrowth, calculateMultiplier } = require('./growthEngine');
const { eventBus, EVENTS } = require('../events/eventBus');

// 캐릭터 조회 (없으면 생성)
async function getOrCreateCharacter(userId) {
  const existing = await pool.query(
    'SELECT * FROM characters WHERE user_id = $1',
    [userId]
  );
  if (existing.rows.length > 0) return existing.rows[0];

  const created = await pool.query(
    `INSERT INTO characters (user_id) VALUES ($1) RETURNING *`,
    [userId]
  );
  return created.rows[0];
}

// 기부 완료 후 성장 처리
async function applyDonationGrowth(donation) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const charRes = await client.query(
      'SELECT * FROM characters WHERE user_id = $1 FOR UPDATE',
      [donation.user_id]
    );
    const character = charRes.rows[0];

    // 마지막 기부 날짜 조회
    const lastDonRes = await client.query(
      `SELECT verified_at FROM donations
       WHERE user_id = $1 AND id != $2 AND status = 'VERIFIED'
       ORDER BY verified_at DESC LIMIT 1`,
      [donation.user_id, donation.id]
    );
    const lastDonationDate = lastDonRes.rows[0]?.verified_at || null;

    const multiplier = calculateMultiplier(donation, character, lastDonationDate);
    const growth     = processGrowth(character, donation, multiplier);

    // 캐릭터 업데이트
    await client.query(
      `UPDATE characters SET
        level              = $1,
        xp                 = $2,
        xp_to_next_level   = $3,
        stage              = $4,
        total_caps_donated = total_caps_donated + $5,
        unlocked_traits    = $6,
        unlocked_items     = $7,
        last_growth_at     = NOW()
       WHERE user_id = $8`,
      [
        growth.levelAfter,
        growth.xpAfter,
        growth.xpToNextLevel,
        growth.stageAfter,
        donation.quantity,
        growth.newUnlockedTraits,
        growth.newUnlockedItems,
        donation.user_id,
      ]
    );

    // 성장 이벤트 기록
    await client.query(
      `INSERT INTO growth_events
         (character_id, donation_id, xp_gained, level_before, level_after,
          stage_before, stage_after, leveled_up, stage_changed)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        character.id,
        donation.id,
        growth.xpGained,
        growth.levelBefore,
        growth.levelAfter,
        growth.stageBefore,
        growth.stageAfter,
        growth.leveledUp,
        growth.stageChanged,
      ]
    );

    // 기부에 XP 기록
    await client.query(
      'UPDATE donations SET xp_awarded = $1, multiplier = $2 WHERE id = $3',
      [growth.xpGained, multiplier, donation.id]
    );

    await client.query('COMMIT');

    // 이벤트 발행
    if (growth.leveledUp) {
      eventBus.emit(EVENTS.CHARACTER_LEVELED_UP, {
        userId: donation.user_id,
        levelBefore: growth.levelBefore,
        levelAfter:  growth.levelAfter,
        xpGained:    growth.xpGained,
      });
    }
    if (growth.stageChanged) {
      eventBus.emit(EVENTS.CHARACTER_STAGE_CHANGED, {
        userId:       donation.user_id,
        stageBefore:  growth.stageBefore,
        stageAfter:   growth.stageAfter,
      });
    }

    return { ...growth, multiplier };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// 내 캐릭터 조회
async function getCharacter(userId) {
  const res = await pool.query('SELECT * FROM characters WHERE user_id = $1', [userId]);
  return res.rows[0] || null;
}

// 성장 로그 조회
async function getGrowthLog(userId, limit = 20, offset = 0) {
  const res = await pool.query(
    `SELECT ge.*, d.quantity, d.verified_at
     FROM growth_events ge
     JOIN characters c ON ge.character_id = c.id
     JOIN donations d  ON ge.donation_id  = d.id
     WHERE c.user_id = $1
     ORDER BY ge.occurred_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return res.rows;
}

// 리더보드 조회
async function getLeaderboard(limit = 20) {
  const res = await pool.query(
    `SELECT c.name, c.level, c.stage, c.total_caps_donated,
            u.username, c.appearance
     FROM characters c
     JOIN users u ON c.user_id = u.id
     ORDER BY c.total_caps_donated DESC, c.level DESC
     LIMIT $1`,
    [limit]
  );
  return res.rows;
}

// 외형 변경
async function updateAppearance(userId, appearance) {
  const allowed = new Set(['color', 'hat', 'accessory', 'background']);
  const sanitized = {};
  for (const [key, val] of Object.entries(appearance)) {
    if (allowed.has(key)) sanitized[key] = val;
  }

  const res = await pool.query(
    `UPDATE characters
     SET appearance = appearance || $1::jsonb
     WHERE user_id = $2
     RETURNING appearance`,
    [JSON.stringify(sanitized), userId]
  );
  return res.rows[0]?.appearance;
}

// 캐릭터 이름 변경
async function updateName(userId, name) {
  const res = await pool.query(
    'UPDATE characters SET name = $1 WHERE user_id = $2 RETURNING name',
    [name.trim().slice(0, 50), userId]
  );
  return res.rows[0]?.name;
}

module.exports = {
  getOrCreateCharacter,
  applyDonationGrowth,
  getCharacter,
  getGrowthLog,
  getLeaderboard,
  updateAppearance,
  updateName,
};
