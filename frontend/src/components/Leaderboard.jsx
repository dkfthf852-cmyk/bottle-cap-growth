import { useEffect, useState } from 'react';
import { api } from '../api/client';

const STAGE_EMOJI = { EGG: '🥇', BABY: '🐣', CHILD: '🐥', TEEN: '🐤', ADULT: '🦜', MASTER: '🦅' };
const RANK_BADGE  = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const [board,   setBoard]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getLeaderboard().then(setBoard).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={card}><p style={{ color: '#999', textAlign: 'center' }}>로딩 중...</p></div>;

  return (
    <div style={card}>
      <h3 style={title}>기부 랭킹 🏆</h3>
      {board.length === 0 ? (
        <p style={{ color: '#999', textAlign: 'center' }}>아직 기부 기록이 없어요.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {board.map((entry, i) => (
            <div key={i} style={{ ...row, background: i < 3 ? '#fffbf0' : '#fafafa' }}>
              <div style={{ fontSize: 22, width: 32, textAlign: 'center' }}>{RANK_BADGE[i] || `${i + 1}`}</div>
              <div style={{ fontSize: 20 }}>{STAGE_EMOJI[entry.stage]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{entry.username}</div>
                <div style={{ fontSize: 12, color: '#888' }}>Lv.{entry.level} · {entry.stage}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#4caf50' }}>
                  {(entry.total_weight_grams || 0).toLocaleString()}g
                </div>
                <div style={{ fontSize: 11, color: '#bbb' }}>누적 기부</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const card  = { background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' };
const title = { margin: '0 0 14px', fontSize: 18, fontWeight: 700 };
const row   = { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: '1px solid #f0f0f0' };
