const API_BASE = '/api';
const toQuery = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value);
    }
  });
  const encoded = query.toString();
  return encoded ? `?${encoded}` : '';
};

const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.message || data.errors?.[0]?.msg || 'Request failed';
    throw new Error(message);
  }

  return data;
};

export const api = {
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  profile: () => request('/auth/me'),

  getInitiatives: (params) => request(`/initiatives${toQuery(params)}`),
  getInitiativeCoordinates: (params) => request(`/initiatives/coordinates${toQuery(params)}`),
  createInitiative: (payload) => request('/initiatives', { method: 'POST', body: JSON.stringify(payload) }),
  updateInitiative: (id, payload) =>
    request(`/initiatives/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteInitiative: (id) => request(`/initiatives/${id}`, { method: 'DELETE' }),

  addFeedback: (payload) => request('/feedback', { method: 'POST', body: JSON.stringify(payload) }),
  getFeedbackByInitiative: (id) => request(`/feedback/initiative/${id}`),
  getAllFeedback: () => request('/feedback'),
  deleteFeedback: (id) => request(`/feedback/${id}`, { method: 'DELETE' }),

  createIssue: (payload) => request('/issues', { method: 'POST', body: JSON.stringify(payload) }),
  getIssues: (params) => request(`/issues${toQuery(params)}`),
  getPublicIssues: (params) => request(`/issues/public${toQuery(params)}`),
  getUserIssues: (params) => request(`/issues/user${toQuery(params)}`),
  updateIssue: (id, payload) => request(`/issues/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  convertIssue: (id) => request(`/issues/${id}/convert`, { method: 'POST' })
};
