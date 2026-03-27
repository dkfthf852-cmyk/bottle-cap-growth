const pool = require('../db/connection');
const { calcDonationXp, processFeed } = require('./growthEngine');
const { eventBus, EVENTS } = require('../events/eventBus');

// 캐릭터 조회 (없으면 생성)
async function getOrCreateCharacter(userId) {
  const existing = await pool.query('SELECT * FROM characters WHERE user_id = $1', [userId]);
  if (existing.rows.length > 0) return existing.rows[0];
  const created = await pool.query('INSERT INTO characters (user_id) VALUES ($1) RETURNING *', [userId]);
  return created.rows[0];
}

// 기부 완료 → xp_balance에 XP 적립 (캐릭터 성장 X)
async function creditXpFromDonation(donation) {
  const xpGained = calcDonationXp(donation.weight_grams);
  if (xpGained <= 0) return { xpGained: 0 };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // xp_balance에 적립
    await client.query(
      `UPDATE characters
       SET xp_balance          = xp_balance + $1,
           total_caps_donated  = total_caps_donated + $2,
           total_weight_grams  = total_weight_grams + $3
       WHERE user_id = $4`,
      [xpGained, donation.quantity, donation.weight_grams, donation.user_id]
    );

    // 기부에 XP 기록
    await client.query('UPDATE donations SET xp_awarded = $1 WHERE id = $2', [xpGained, donation.id]);

    // 성장 이벤트 기록 (DONATION 타입)
    const charRes = await client.query('SELECT * FROM characters WHERE user_id = $1', [donation.user_id]);
    const character = charRes.rows[0];
    await client.query(
      `INSERT INTO growth_events
         (character_id, donation_id, event_type, xp_gained, level_before, level_after, stage_before, stage_after)
       VALUES ($1,$2,'DONATION',$3,$4,$4,$5,$5)`,
      [character.id, donation.id, xpGained, character.level, character.stage]
    );

    await client.query('COMMIT');
    return { xpGained };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// 먹이주기: 100 XP 소비 → 캐릭터 성장
async function feedCharacter(userId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const charRes = await client.query('SELECT * FROM characters WHERE user_id = $1 FOR UPDATE', [userId]);
    const character = charRes.rows[0];
    if (!character) throw new Error('캐릭터를 찾을 수 없습니다.');
    if ((character.xp_balance || 0) < 100) throw new Error('XP가 부족합니다. (100 XP 필요)');

    const growth = processFeed(character);

    await client.query(
      `UPDATE characters SET
        level              = $1,
        xp                 = $2,
        xp_to_next_level   = $3,
        stage              = $4,
        xp_balance         = xp_balance - 100,
        unlocked_traits    = $5,
        unlocked_items     = $6,
        last_growth_at     = NOW()
       WHERE user_id = $7`,
      [
        growth.levelAfter,
        growth.xpAfter,
        growth.xpToNextLevel,
        growth.stageAfter,
        growth.newUnlockedTraits,
        growth.newUnlockedItems,
        userId,
      ]
    );

    await client.query(
      `INSERT INTO growth_events
         (character_id, event_type, xp_gained, level_before, level_after, stage_before, stage_after, leveled_up, stage_changed)
       VALUES ($1,'FEED',$2,$3,$4,$5,$6,$7,$8)`,
      [character.id, growth.xpGained, growth.levelBefore, growth.levelAfter,
       growth.stageBefore, growth.stageAfter, growth.leveledUp, growth.stageChanged]
    );

    await client.query('COMMIT');

    if (growth.leveledUp) {
      eventBus.emit(EVENTS.CHARACTER_LEVELED_UP, { userId, levelBefore: growth.levelBefore, levelAfter: growth.levelAfter });
    }
    if (growth.stageChanged) {
      eventBus.emit(EVENTS.CHARACTER_STAGE_CHANGED, { userId, stageBefore: growth.stageBefore, stageAfter: growth.stageAfter });
    }

    return growth;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getCharacter(userId) {
  const res = await pool.query(
    `SELECT c.*, u.username FROM characters c JOIN users u ON c.user_id = u.id WHERE c.user_id = $1`,
    [userId]
  );
  return res.rows[0] || null;
}

async function getGrowthLog(userId, limit = 20, offset = 0) {
  const res = await pool.query(
    `SELECT ge.*, d.quantity, d.weight_grams, d.verified_at, u.username
     FROM growth_events ge
     JOIN characters c ON ge.character_id = c.id
     JOIN users u ON c.user_id = u.id
     LEFT JOIN donations d ON ge.donation_id = d.id
     WHERE c.user_id = $1
     ORDER BY ge.occurred_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return res.rows;
}

async function getLeaderboard(limit = 20) {
  const res = await pool.query(
    `SELECT u.username, c.level, c.stage, c.total_caps_donated, c.total_weight_grams, c.appearance
     FROM characters c
     JOIN users u ON c.user_id = u.id
     ORDER BY c.total_weight_grams DESC, c.level DESC
     LIMIT $1`,
    [limit]
  );
  return res.rows;
}

async function updateAppearance(userId, appearance) {
  const allowed = new Set(['color', 'hat', 'accessory', 'background']);
  const sanitized = {};
  for (const [key, val] of Object.entries(appearance)) {
    if (allowed.has(key)) sanitized[key] = val;
  }
  const res = await pool.query(
    `UPDATE characters SET appearance = appearance || $1::jsonb WHERE user_id = $2 RETURNING appearance`,
    [JSON.stringify(sanitized), userId]
  );
  return res.rows[0]?.appearance;
}

module.exports = {
  getOrCreateCharacter,
  creditXpFromDonation,
  feedCharacter,
  getCharacter,
  getGrowthLog,
  getLeaderboard,
  updateAppearance,
};
