import { useState, useEffect, useCallback } from 'react';
import { useAuth }        from './hooks/useAuth';
import AuthPage           from './pages/AuthPage';
import CharacterViewer    from './components/CharacterViewer';
import DonationForm       from './components/DonationForm';
import GrowthLog          from './components/GrowthLog';
import Leaderboard        from './components/Leaderboard';
import { api }            from './api/client';

const TABS = [
  { id: 'character', label: '캐릭터 🐣' },
  { id: 'donate',    label: '기부 ♻️'   },
  { id: 'log',       label: '기록 📈'   },
  { id: 'rank',      label: '랭킹 🏆'   },
];

export default function App() {
  const auth      = useAuth();
  const [tab,     setTab]       = useState('character');
  const [character, setCharacter] = useState(null);
  const [stats,   setStats]     = useState(null);
  const [logKey,  setLogKey]    = useState(0);

  const loadCharacter = useCallback(async () => {
    if (!auth.user) return;
    try {
      const c = await api.getCharacter();
      setCharacter(c);
    } catch (err) {
      console.error(err.message);
    }
  }, [auth.user]);

  const loadStats = useCallback(async () => {
    if (!auth.user) return;
    try {
      const s = await api.getDonationStats();
      setStats(s);
    } catch (err) {
      console.error(err.message);
    }
  }, [auth.user]);

  useEffect(() => {
    loadCharacter();
    loadStats();
  }, [loadCharacter, loadStats]);

  function handleDonated() {
    // 500ms 후 캐릭터 갱신 (서버 이벤트 처리 대기)
    setTimeout(() => {
      loadCharacter();
      loadStats();
      setLogKey((k) => k + 1);
    }, 500);
  }

  if (!auth.user) return <AuthPage onAuth={auth} />;

  return (
    <div style={appWrap}>
      {/* 헤더 */}
      <header style={header}>
        <span style={{ fontWeight: 700, fontSize: 17 }}>♻️ 병뚜껑 성장</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {stats && (
            <span style={{ fontSize: 12, color: '#fff', opacity: 0.8 }}>
              총 {Number(stats.total_caps || 0).toLocaleString()}개 기부
            </span>
          )}
          <span style={{ fontSize: 13, color: '#fff', opacity: 0.9 }}>@{auth.user.username}</span>
          <button onClick={auth.logout} style={logoutBtn}>로그아웃</button>
        </div>
      </header>

      {/* 탭 */}
      <nav style={tabBar}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              ...tabBtn,
              background: tab === t.id ? '#fff' : 'transparent',
              color:      tab === t.id ? '#4caf50' : '#666',
              fontWeight: tab === t.id ? 700 : 400,
              borderBottom: tab === t.id ? '2px solid #4caf50' : '2px solid transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* 컨텐츠 */}
      <main style={main}>
        {tab === 'character' && (
          <CharacterViewer character={character} onRefresh={loadCharacter} />
        )}
        {tab === 'donate' && (
          <DonationForm onDonated={handleDonated} />
        )}
        {tab === 'log' && (
          <GrowthLog key={logKey} />
        )}
        {tab === 'rank' && (
          <Leaderboard />
        )}
      </main>
    </div>
  );
}

const appWrap  = { minHeight: '100vh', background: '#f0f7f0', fontFamily: "'Noto Sans KR', sans-serif" };
const header   = { background: '#4caf50', color: '#fff', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const tabBar   = { background: '#fff', display: 'flex', borderBottom: '1px solid #e0e0e0' };
const tabBtn   = { flex: 1, padding: '12px 0', border: 'none', cursor: 'pointer', fontSize: 14 };
const main     = { padding: 16, maxWidth: 480, margin: '0 auto' };
const logoutBtn = { padding: '4px 10px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.5)', borderRadius: 6, color: '#fff', fontSize: 12, cursor: 'pointer' };
