import { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function DonationForm({ onDonated }) {
  const [points,      setPoints]      = useState([]);
  const [pointId,     setPointId]     = useState('');
  const [quantity,    setQuantity]    = useState('');
  const [weightGrams, setWeightGrams] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [result,      setResult]      = useState(null);
  const [error,       setError]       = useState('');

  useEffect(() => {
    api.getDonationPoints().then(setPoints).catch(console.error);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setResult(null);
    if (!pointId) return setError('기부소를 선택해주세요.');
    if (!weightGrams || parseInt(weightGrams) < 1) return setError('무게를 입력해주세요.');

    setLoading(true);
    try {
      const donation = await api.createDonation({
        donationPointId: pointId,
        quantity:    quantity ? parseInt(quantity) : 0,
        weightGrams: parseInt(weightGrams),
      });
      setResult(donation);
      setQuantity(''); setWeightGrams('');
      onDonated?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={card}>
      <h3 style={title}>병뚜껑 기부하기 ♻️</h3>

      {result && (
        <div style={successBox}>
          <div style={{ fontSize: 20, marginBottom: 6 }}>기부 완료! 🎉</div>
          <div style={{ fontSize: 14 }}>
            <b>{result.weight_grams}g</b> 기부 → XP <b>+{result.xp_awarded}</b> 적립
          </div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            캐릭터 탭에서 먹이주기 버튼으로 성장시켜 보세요! 🍬
          </div>
        </div>
      )}

      {error && <div style={errorBox}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <label style={label}>기부소 선택</label>
        <select value={pointId} onChange={(e) => setPointId(e.target.value)} style={input} required>
          <option value="">-- 기부소를 선택하세요 --</option>
          {points.map((p) => (
            <option key={p.id} value={p.id}>{p.name} ({p.address})</option>
          ))}
        </select>

        <label style={label}>무게 (g) <span style={{ color: '#e53935' }}>*필수</span></label>
        <input type="number" min="1" max="10000" placeholder="병뚜껑 무게 입력 (g)" value={weightGrams} onChange={(e) => setWeightGrams(e.target.value)} style={input} required />

        <label style={label}>개수 (개) <span style={{ color: '#aaa' }}>선택</span></label>
        <input type="number" min="0" placeholder="병뚜껑 개수 (선택)" value={quantity} onChange={(e) => setQuantity(e.target.value)} style={input} />

        <div style={{ fontSize: 12, color: '#888', marginBottom: 12, background: '#f9f9f9', borderRadius: 8, padding: '8px 10px' }}>
          💡 10g = 1 XP 적립 · 보유 XP 100개당 먹이주기 1회
        </div>

        <button type="submit" disabled={loading} style={submitBtn}>
          {loading ? '처리 중...' : '기부하기'}
        </button>
      </form>
    </div>
  );
}

const card      = { background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' };
const title     = { margin: '0 0 16px', fontSize: 18, fontWeight: 700 };
const label     = { display: 'block', fontSize: 13, color: '#555', marginBottom: 4 };
const input     = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, marginBottom: 12, boxSizing: 'border-box' };
const submitBtn = { width: '100%', padding: '12px 0', background: '#4caf50', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer' };
const successBox = { background: '#e8f5e9', borderRadius: 8, padding: 12, marginBottom: 12, textAlign: 'center' };
const errorBox   = { background: '#ffebee', borderRadius: 8, padding: 10, marginBottom: 12, color: '#c62828', fontSize: 13 };
