import axios from 'axios';

export const apiClient = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, ''),
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('talentdesk_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      window.dispatchEvent(new Event('talentdesk:unauthorized'));
    }
    const message = error.response?.data?.error || (error.code === 'ERR_NETWORK' ? 'Cannot reach the server. Check that the backend is running.' : error.message);
    const cleanError = new Error(message);
    cleanError.status = error.response?.status;
    cleanError.details = error.response?.data?.details;
    return Promise.reject(cleanError);
  },
);

const data = (promise) => promise.then((response) => response.data);

export const api = {
  auth: {
    login: (credentials) => data(apiClient.post('/api/auth/login', credentials)),
    me: () => data(apiClient.get('/api/auth/me')),
  },
  jobs: {
    list: (params) => data(apiClient.get('/api/jobs', { params })),
    get: (id) => data(apiClient.get(`/api/jobs/${id}`)),
    candidates: (id, params) => data(apiClient.get(`/api/jobs/${id}/candidates`, { params })),
    create: (payload) => data(apiClient.post('/api/jobs', payload)),
    update: (id, payload) => data(apiClient.patch(`/api/jobs/${id}`, payload)),
    remove: (id) => data(apiClient.delete(`/api/jobs/${id}`)),
  },
  candidates: {
    list: (params) => data(apiClient.get('/api/candidates', { params })),
    get: (id) => data(apiClient.get(`/api/candidates/${id}`)),
    create: (payload) => data(apiClient.post('/api/candidates', payload)),
    update: (id, payload) => data(apiClient.patch(`/api/candidates/${id}`, payload)),
    remove: (id) => data(apiClient.delete(`/api/candidates/${id}`)),
    moveStage: (id, toStage) => data(apiClient.post(`/api/candidates/${id}/move-stage`, { toStage })),
  },
  documents: {
    list: () => data(apiClient.get('/api/documents')),
    upload: (file, jobId) => {
      const form = new FormData();
      form.append('file', file);
      if (jobId) form.append('jobId', jobId);
      return data(apiClient.post('/api/documents', form));
    },
    get: (id) => data(apiClient.get(`/api/documents/${id}`)),
    remove: (id) => data(apiClient.delete(`/api/documents/${id}`)),
  },
  chat: {
    ask: (message) => data(apiClient.post('/api/chat', { message })),
  },
};
