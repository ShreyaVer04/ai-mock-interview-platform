import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_URL });

// Attach JWT token to every request if present in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the token is invalid/expired, log the user out automatically
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ---- Auth ----
export const signup = (data) => api.post('/auth/signup', data);
export const login = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');

// ---- Sessions ----
export const createSession = () => api.post('/sessions');
export const listSessions = () => api.get('/sessions');
export const getSession = (id) => api.get(`/sessions/${id}`);
export const endSession = (id) => api.patch(`/sessions/${id}/end`);

// ---- Interview turn (used for opening line / fallback without live Vapi events) ----
export const sendInterviewTurn = (sessionId, candidateMessage) =>
  api.post('/interview/turn', { sessionId, candidateMessage });

export const syncTranscript = (sessionId, role, content) =>
  api.post('/interview/transcript-sync', { sessionId, role, content });

// ---- Feedback ----
export const generateFeedback = (sessionId) => api.post(`/feedback/${sessionId}`);
export const getFeedback = (sessionId) => api.get(`/feedback/${sessionId}`);

export default api;
