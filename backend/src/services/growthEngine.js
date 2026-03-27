// 성장 엔진
const STAGES = [
  { name: 'EGG',    minLevel: 1   },
  { name: 'BABY',   minLevel: 10  },
  { name: 'CHILD',  minLevel: 20  },
  { name: 'TEEN',   minLevel: 35  },
  { name: 'ADULT',  minLevel: 50  },
  { name: 'MASTER', minLevel: 100 },
];

function xpToNextLevel(level) {
  if (level >= 100) return Infinity;
  return Math.floor(100 * Math.pow(1.15, level - 1));
}

function stageForLevel(level) {
  let stage = STAGES[0];
  for (const s of STAGES) {
    if (level >= s.minLevel) stage = s;
  }
  return stage.name;
}

const STAGE_UNLOCKS = {
  BABY:   { traits: ['eco_starter'],              items: ['baby_hat'] },
  CHILD:  { traits: ['bottle_master'],            items: ['party_hat', 'blue_ribbon'] },
  TEEN:   { traits: ['eco_hero'],                 items: ['cape', 'sunglasses'] },
  ADULT:  { traits: ['sustainability_champion'],  items: ['crown', 'golden_badge'] },
  MASTER: { traits: ['legendary_recycler'],       items: ['legendary_aura', 'rainbow_trail'] },
};

// 기부 → XP 적립량 계산 (10g = 1 XP)
function calcDonationXp(weightGrams) {
  return Math.floor(weightGrams / 10);
}

// 먹이주기 1회(100 XP 소비) → 캐릭터 성장 처리
function processFeed(character) {
  const XP_PER_FEED = 100;
  const levelBefore = character.level;
  const stageBefore = character.stage;

  let currentXp    = character.xp + XP_PER_FEED;
  let currentLevel = character.level;
  let leveledUp    = false;
  const newUnlockedTraits = [...(character.unlocked_traits || [])];
  const newUnlockedItems  = [...(character.unlocked_items  || [])];

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
    xpGained: XP_PER_FEED,
    levelBefore,
    levelAfter:       currentLevel,
    xpAfter:          currentXp,
    xpToNextLevel:    xpToNextLevel(currentLevel),
    stageBefore,
    stageAfter:       newStage,
    leveledUp,
    stageChanged,
    newUnlockedTraits,
    newUnlockedItems,
  };
}

module.exports = { calcDonationXp, processFeed, stageForLevel, xpToNextLevel, STAGES };
