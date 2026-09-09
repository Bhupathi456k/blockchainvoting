import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateWallet: (data) => api.patch('/auth/wallet', data),
  logout: () => api.post('/auth/logout'),
};

// Elections API
export const electionsAPI = {
  getAll: () => api.get('/elections'),
  getActive: () => api.get('/elections/active'),
  getById: (id) => api.get(`/elections/${id}`),
  create: (data) => api.post('/elections', data),
  update: (id, data) => api.patch(`/elections/${id}`, data),
  start: (id) => api.post(`/elections/${id}/start`),
  end: (id) => api.post(`/elections/${id}/end`),
  delete: (id) => api.delete(`/elections/${id}`),
  getResults: (id) => api.get(`/elections/${id}/results`),
};

// Candidates API
export const candidatesAPI = {
  getByElection: (electionId) => api.get(`/candidates/election/${electionId}`),
  getById: (id) => api.get(`/candidates/${id}`),
  create: (electionId, data) => api.post(`/candidates/${electionId}`, data),
  update: (id, data) => api.patch(`/candidates/${id}`, data),
  delete: (id) => api.delete(`/candidates/${id}`),
};

// Voters API
export const votersAPI = {
  getAll: () => api.get('/voters'),
  getStats: () => api.get('/voters/stats'),
  getById: (id) => api.get(`/voters/${id}`),
  updateEligibility: (id, data) => api.patch(`/voters/${id}/eligibility`, data),
  authorizeOnChain: (id) => api.post(`/voters/${id}/authorize-on-chain`),
  batchAuthorizeOnChain: () => api.post('/voters/batch-authorize-on-chain'),
};

// Blockchain API
export const blockchainAPI = {
  getStatus: () => api.get('/blockchain/status'),
  getContract: () => api.get('/blockchain/contract'),
  verifyTransaction: (txHash) => api.get(`/blockchain/transactions/${txHash}`),
  getTransactions: (params) => api.get('/blockchain/transactions', { params }),
  recordVote: (data) => api.post('/blockchain/vote', data),
};

// Host Requests API
export const hostRequestsAPI = {
  submit: (data) => api.post('/host-requests', data),
  getMyRequests: () => api.get('/host-requests/me'),
  getAll: (params) => api.get('/host-requests', { params }),
  getById: (id) => api.get(`/host-requests/${id}`),
  approve: (id) => api.post(`/host-requests/${id}/approve`),
  reject: (id, data) => api.post(`/host-requests/${id}/reject`, data),
};

// Audit Logs API (Admin only)
export const auditLogsAPI = {
  getAll: (params) => api.get('/audit-logs', { params }),
  export: (format = 'csv') =>
    api.get(`/audit-logs/export?format=${format}`, {
      responseType: format === 'csv' ? 'blob' : 'json',
    }),
};

// Reports API (Admin only)
export const reportsAPI = {
  getSummary: () => api.get('/reports/summary'),
  getElections: () => api.get('/reports/elections'),
  export: (type = 'elections', format = 'csv') =>
    api.get(`/reports/export?type=${type}&format=${format}`, {
      responseType: format === 'csv' ? 'blob' : 'json',
    }),
};
