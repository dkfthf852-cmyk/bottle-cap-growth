import { useState } from 'react';

export default function AuthPage({ onAuth }) {
  const [mode,     setMode]     = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await onAuth.login(email, password);
      } else {
        await onAuth.register(username, email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={wrap}>
      <div style={box}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48 }}>♻️</div>
          <h1 style={{ margin: '8px 0 4px', fontSize: 22 }}>병뚜껑 성장 캐릭터</h1>
          <p style={{ color: '#888', margin: 0, fontSize: 13 }}>기부할수록 자라나는 나의 캐릭터</p>
        </div>

        <div style={{ display: 'flex', marginBottom: 20, borderRadius: 8, overflow: 'hidden', border: '1px solid #ddd' }}>
          {['login', 'register'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer', fontSize: 14,
                background: mode === m ? '#4caf50' : '#f5f5f5',
                color: mode === m ? '#fff' : '#555',
                fontWeight: mode === m ? 700 : 400,
              }}
            >
              {m === 'login' ? '로그인' : '회원가입'}
            </button>
          ))}
        </div>

        {error && <div style={errorBox}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <label style={label}>아이디</label>
              <input style={input} type="text" placeholder="아이디" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </>
          )}
          <label style={label}>이메일</label>
          <input style={input} type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label style={label}>비밀번호</label>
          <input style={input} type="password" placeholder="비밀번호 (6자 이상)" value={password} onChange={(e) => setPassword(e.target.value)} required />

          <button type="submit" disabled={loading} style={submitBtn}>
            {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>
      </div>
    </div>
  );
}

const wrap      = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f7f0' };
const box       = { background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 380, boxShadow: '0 4px 24px rgba(0,0,0,0.10)' };
const label     = { display: 'block', fontSize: 13, color: '#555', marginBottom: 4 };
const input     = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, marginBottom: 12, boxSizing: 'border-box' };
const submitBtn = { width: '100%', padding: '12px 0', background: '#4caf50', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 4 };
const errorBox  = { background: '#ffebee', borderRadius: 8, padding: 10, marginBottom: 12, color: '#c62828', fontSize: 13 };
