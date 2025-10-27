import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 segundos
});

// Interceptor para agregar token a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejo de errores global
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ===== API de Autenticación =====
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};

// ===== API de Solicitudes =====
export const requestAPI = {
  createRequest: (data) => api.post('/api/requests/new', data),
  getClientRequests: (clientId) => api.get(`/api/requests/client/${clientId}`),
  getRequestById: (requestId) => api.get(`/api/requests/${requestId}`),
  addQuote: (requestId, data) => api.post(`/api/requests/${requestId}/quote`, data),
};

// ===== API de Conductores (para futuro) =====
export const driverAPI = {
  getProfile: (driverId) => api.get(`/api/drivers/${driverId}`),
  updateProfile: (driverId, data) => api.put(`/api/drivers/${driverId}`, data),
  uploadDocument: (driverId, formData) => 
    api.post(`/api/drivers/${driverId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

export default api;

