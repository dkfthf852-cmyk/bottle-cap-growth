// ============================================================
//  성장 엔진 — 기부량 → XP → 레벨/스테이지 변환 로직
// ============================================================

const BASE_XP_PER_CAP = 10; // 병뚜껑 1개당 기본 XP

// 스테이지 정의 (최소 레벨 기준)
const STAGES = [
  { name: 'EGG',    minLevel: 1  },
  { name: 'BABY',   minLevel: 10 },
  { name: 'CHILD',  minLevel: 20 },
  { name: 'TEEN',   minLevel: 35 },
  { name: 'ADULT',  minLevel: 50 },
  { name: 'MASTER', minLevel: 100 },
];

// 레벨별 다음 레벨 필요 XP (점진적 증가)
function xpToNextLevel(level) {
  if (level >= 100) return Infinity;
  return Math.floor(100 * Math.pow(1.15, level - 1));
}

// 레벨에 해당하는 스테이지 반환
function stageForLevel(level) {
  let stage = STAGES[0];
  for (const s of STAGES) {
    if (level >= s.minLevel) stage = s;
  }
  return stage.name;
}

// 스테이지 전환 시 해금 아이템/특성
const STAGE_UNLOCKS = {
  BABY:   { traits: ['eco_starter'],                 items: ['baby_hat'] },
  CHILD:  { traits: ['bottle_master'],               items: ['party_hat', 'blue_ribbon'] },
  TEEN:   { traits: ['eco_hero'],                    items: ['cape', 'sunglasses'] },
  ADULT:  { traits: ['sustainability_champion'],     items: ['crown', 'golden_badge'] },
  MASTER: { traits: ['legendary_recycler'],          items: ['legendary_aura', 'rainbow_trail'] },
};

// 보정 계수 계산
function calculateMultiplier(donation, character, lastDonationDate) {
  let multiplier = 1.0;

  // 첫 기부 보너스
  if (character.total_caps_donated === 0) {
    multiplier *= 2.0;
  }

  // 연속 기부 보너스 (7일 이내 이전 기부 존재)
  if (lastDonationDate) {
    const daysDiff = (Date.now() - new Date(lastDonationDate).getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff <= 7) multiplier *= 1.5;
  }

  // 대량 기부 보너스 (100개 이상)
  if (donation.quantity >= 100) {
    multiplier *= 1.2;
  }

  return Math.round(multiplier * 100) / 100;
}

// 핵심 성장 처리 함수
function processGrowth(character, donation, multiplier) {
  const xpGained = Math.floor(donation.quantity * BASE_XP_PER_CAP * multiplier);

  const levelBefore = character.level;
  const stageBefore = character.stage;

  let currentXp    = character.xp + xpGained;
  let currentLevel = character.level;
  let leveledUp    = false;
  const newUnlockedTraits = [...(character.unlocked_traits || [])];
  const newUnlockedItems  = [...(character.unlocked_items  || [])];

  // 레벨업 루프
  while (currentLevel < 100) {
    const needed = xpToNextLevel(currentLevel);
    if (currentXp < needed) break;
    currentXp -= needed;
    currentLevel++;
    leveledUp = true;
  }
  if (currentLevel >= 100) currentXp = 0;

  const newStage    = stageForLevel(currentLevel);
  const stageChanged = newStage !== stageBefore;

  // 스테이지 전환 해금 처리
  if (stageChanged && STAGE_UNLOCKS[newStage]) {
    const unlocks = STAGE_UNLOCKS[newStage];
    for (const trait of unlocks.traits) {
      if (!newUnlockedTraits.includes(trait)) newUnlockedTraits.push(trait);
    }
    for (const item of unlocks.items) {
      if (!newUnlockedItems.includes(item)) newUnlockedItems.push(item);
    }
  }

  return {
    xpGained,
    levelBefore,
    levelAfter:      currentLevel,
    xpAfter:         currentXp,
    xpToNextLevel:   xpToNextLevel(currentLevel),
    stageBefore,
    stageAfter:      newStage,
    leveledUp,
    stageChanged,
    newUnlockedTraits,
    newUnlockedItems,
  };
}

module.exports = { processGrowth, calculateMultiplier, stageForLevel, xpToNextLevel, STAGES };
