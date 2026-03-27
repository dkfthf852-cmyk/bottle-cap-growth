const BASE = (import.meta.env.VITE_API_URL || '') + '/api/v1';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(BASE + path, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '요청 실패');
  return data;
}

export const api = {
  // 인증
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login:    (body) => request('/auth/login',    { method: 'POST', body: JSON.stringify(body) }),

  // 캐릭터
  getCharacter:     ()       => request('/character'),
  getGrowthLog:     (limit)  => request(`/character/growth-log?limit=${limit || 20}`),
  getLeaderboard:   ()       => request('/character/leaderboard'),
  updateAppearance: (data)   => request('/character/appearance', { method: 'PATCH', body: JSON.stringify({ appearance: data }) }),
  updateName:       (name)   => request('/character/name',       { method: 'PATCH', body: JSON.stringify({ name }) }),

  // 기부
  getDonationPoints: ()     => request('/donations/points'),
  createDonation:    (body) => request('/donations', { method: 'POST', body: JSON.stringify(body) }),
  getDonations:      ()     => request('/donations'),
  getDonationStats:  ()     => request('/donations/stats'),
};
