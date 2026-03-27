import { useEffect, useState, useRef } from 'react';

// 스테이지별 이모지와 설명
const STAGE_INFO = {
  EGG:    { emoji: '🥚', label: '알',     desc: '조심스럽게 흔들리고 있어요',      color: '#fff3cd' },
  BABY:   { emoji: '🐣', label: '아기',   desc: '막 부화했어요! 세상이 신기해요', color: '#d4edda' },
  CHILD:  { emoji: '🐥', label: '어린이', desc: '호기심이 왕성해요',               color: '#cce5ff' },
  TEEN:   { emoji: '🐤', label: '청소년', desc: '에너지가 넘쳐요',                 color: '#e2d9f3' },
  ADULT:  { emoji: '🦜', label: '성인',   desc: '친환경 챔피언이에요',             color: '#fff3cd' },
  MASTER: { emoji: '🦅', label: '마스터', desc: '전설의 재활용 영웅!',             color: '#ffddc1' },
};

const HAT_EMOJI   = { baby_hat: '👒', party_hat: '🎩', cape: '🦸', crown: '👑', legendary_aura: '✨' };
const COLOR_STYLE = { white: '#fff', green: '#c8f7c5', blue: '#bde0fe', yellow: '#fff9c4', purple: '#e8c8f7', red: '#ffc8c8' };

function XpBar({ xp, xpToNext }) {
  const pct = Math.min((xp / xpToNext) * 100, 100);
  return (
    <div style={{ margin: '8px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', marginBottom: 3 }}>
        <span>XP {xp.toLocaleString()}</span>
        <span>다음 레벨까지 {(xpToNext - xp).toLocaleString()} XP</span>
      </div>
      <div style={{ background: '#e9ecef', borderRadius: 8, height: 12, overflow: 'hidden' }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #4caf50, #81c784)',
            borderRadius: 8,
            transition: 'width 0.8s ease',
          }}
        />
      </div>
    </div>
  );
}

export default function CharacterViewer({ character, onRefresh }) {
  const [animating, setAnimating] = useState(false);
  const prevLevel = useRef(character?.level);

  useEffect(() => {
    if (character && prevLevel.current !== undefined && character.level > prevLevel.current) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 1000);
    }
    prevLevel.current = character?.level;
  }, [character?.level]);

  if (!character) {
    return (
      <div style={card}>
        <p style={{ textAlign: 'center', color: '#999' }}>캐릭터 정보를 불러오는 중...</p>
      </div>
    );
  }

  const info = STAGE_INFO[character.stage] || STAGE_INFO.EGG;
  const hat  = character.unlocked_items?.find((i) => HAT_EMOJI[i]);
  const bgColor = COLOR_STYLE[character.appearance?.color] || '#fff';

  return (
    <div style={card}>
      {/* 캐릭터 표시 영역 */}
      <div
        style={{
          background: bgColor,
          borderRadius: 16,
          padding: '24px 0',
          textAlign: 'center',
          marginBottom: 16,
          border: `2px solid ${info.color}`,
          position: 'relative',
          transition: 'background 0.5s',
        }}
      >
        {animating && (
          <div style={levelUpBanner}>LEVEL UP! 🎉</div>
        )}
        <div style={{ fontSize: 72, lineHeight: 1 }}>
          {hat ? HAT_EMOJI[hat] : ''}{info.emoji}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, marginTop: 8 }}>
          {character.name}
        </div>
        <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{info.desc}</div>
      </div>

      {/* 레벨 / 스테이지 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <Badge label="레벨" value={`Lv.${character.level}`} bg="#e3f2fd" />
        <Badge label="스테이지" value={info.label} bg={info.color} />
        <Badge label="누적 병뚜껑" value={`${character.total_caps_donated.toLocaleString()}개`} bg="#e8f5e9" />
      </div>

      {/* XP 바 */}
      <XpBar xp={character.xp} xpToNext={character.xp_to_next_level} />

      {/* 해금 특성 */}
      {character.unlocked_traits?.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>해금된 특성</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {character.unlocked_traits.map((t) => (
              <span key={t} style={traitBadge}>{t.replace(/_/g, ' ')}</span>
            ))}
          </div>
        </div>
      )}

      <button onClick={onRefresh} style={refreshBtn}>새로고침</button>
    </div>
  );
}

function Badge({ label, value, bg }) {
  return (
    <div style={{ flex: 1, background: bg, borderRadius: 8, padding: '6px 0', textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: '#666' }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

const card        = { background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' };
const traitBadge  = { background: '#f0f4ff', border: '1px solid #c5cae9', borderRadius: 12, padding: '2px 10px', fontSize: 11, color: '#3949ab' };
const refreshBtn  = { marginTop: 14, width: '100%', padding: '8px 0', background: '#f5f5f5', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#555' };
const levelUpBanner = {
  position: 'absolute', top: 0, left: 0, right: 0,
  background: 'linear-gradient(90deg,#ff6b6b,#ffd93d)',
  color: '#fff', fontWeight: 700, fontSize: 16,
  padding: '6px 0', borderRadius: '14px 14px 0 0',
  animation: 'none',
};
