import { useEffect, useState } from 'react';
import { api } from '../api/client';

const STAGE_EMOJI = { EGG: '🥚', BABY: '🐣', CHILD: '🐥', TEEN: '🐤', ADULT: '🦜', MASTER: '🦅' };

export default function GrowthLog() {
  const [log,     setLog]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getGrowthLog(30).then(setLog).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={card}><p style={{ color: '#999', textAlign: 'center' }}>로딩 중...</p></div>;
  if (!log.length) return <div style={card}><p style={{ color: '#999', textAlign: 'center' }}>아직 기록이 없어요. 기부해보세요! 🌱</p></div>;

  return (
    <div style={card}>
      <h3 style={title}>성장 기록 📈</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {log.map((ev) => (
          <div key={ev.id} style={row}>
            <div style={{ fontSize: 24 }}>{ev.event_type === 'FEED' ? '🍬' : (STAGE_EMOJI[ev.stage_after] || '🌱')}</div>
            <div style={{ flex: 1 }}>
              {ev.event_type === 'DONATION' ? (
                <>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {ev.username}님 병뚜껑 {ev.quantity > 0 ? `${ev.quantity}개 ` : ''}<span style={{ color: '#888' }}>({ev.weight_grams}g)</span> 기부 → <span style={{ color: '#4caf50' }}>+{ev.xp_gained} XP 적립</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#aaa' }}>XP 잔액에 적립됨</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    먹이주기 <span style={{ color: '#f57c00' }}>-100 XP</span> → 캐릭터 성장
                  </div>
                  <div style={{ fontSize: 12, color: '#888' }}>
                    Lv.{ev.level_before} → Lv.{ev.level_after}
                    {ev.stage_changed && <span style={{ marginLeft: 6, color: '#9c27b0', fontWeight: 600 }}>스테이지 업! {ev.stage_before}→{ev.stage_after}</span>}
                    {ev.leveled_up && !ev.stage_changed && <span style={{ marginLeft: 6, color: '#1976d2' }}>레벨업!</span>}
                  </div>
                </>
              )}
            </div>
            <div style={{ fontSize: 11, color: '#bbb', whiteSpace: 'nowrap' }}>
              {new Date(ev.occurred_at).toLocaleDateString('ko-KR')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const card  = { background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' };
const title = { margin: '0 0 14px', fontSize: 18, fontWeight: 700 };
const row   = { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#fafafa', borderRadius: 10, border: '1px solid #f0f0f0' };
