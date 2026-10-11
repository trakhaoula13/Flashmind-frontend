import axios from 'axios';

export const TOKEN_KEY = 'fm_token';

// VITE_API_URL peut être donnée avec ou sans "/api" (ex. https://mon-backend.onrender.com)
const rawBase = String(import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
const baseURL = rawBase ? (rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`) : '/api';

const client = axios.create({ baseURL });

// Début de la journée dans le fuseau horaire de l'utilisateur (limite de nouvelles cartes/jour)
const dayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if ((config.method || 'get').toLowerCase() === 'get') {
    config.params = { dayStart: dayStart(), ...(config.params || {}) };
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    const isAuthCall = url.startsWith('/auth/login') || url.startsWith('/auth/register');
    if (err.response?.status === 401 && !isAuthCall) {
      window.dispatchEvent(new Event('fm:unauthorized'));
    }
    return Promise.reject(err);
  }
);

export const errorMessage = (err) =>
  err?.response?.data?.message ||
  (err?.code === 'ERR_NETWORK' ? 'Le serveur est injoignable. Vérifiez que le backend est démarré.' : err?.message) ||
  'Une erreur est survenue';

const data = (promise) => promise.then((r) => r.data);

export const authApi = {
  login: (payload) => data(client.post('/auth/login', payload)),
  register: (payload) => data(client.post('/auth/register', payload)),
  me: () => data(client.get('/auth/me')),
  updateProfile: (payload) => data(client.put('/auth/profile', payload)),
  changePassword: (payload) => data(client.put('/auth/password', payload)),
};

export const folderApi = {
  list: () => data(client.get('/folders')),
  get: (id) => data(client.get(`/folders/${id}`)),
  create: (payload) => data(client.post('/folders', payload)),
  update: (id, payload) => data(client.put(`/folders/${id}`, payload)),
  remove: (id) => data(client.delete(`/folders/${id}`)),
  cards: (id) => data(client.get(`/folders/${id}/cards`)),
  addCard: (id, payload) => data(client.post(`/folders/${id}/cards`, payload)),
  importCards: (id, cards, skipDuplicates = true) =>
    data(client.post(`/folders/${id}/cards/import`, { cards, skipDuplicates })),
};

export const cardApi = {
  update: (id, payload) => data(client.put(`/cards/${id}`, payload)),
  remove: (id) => data(client.delete(`/cards/${id}`)),
  review: (id, rating, endOfDay) => data(client.post(`/cards/${id}/review`, { rating, endOfDay })),
};

export const studyApi = {
  due: (folderId) => data(client.get('/study/due', { params: folderId ? { folder: folderId } : {} })),
  stats: () => data(client.get('/study/stats')),
};
