import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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

// API de autenticación
export const authAPI = {
  // Autenticación tradicional (para drivers)
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  
  // Autenticación OTP (para clients)
  registerOTP: (data) => api.post('/api/auth/register-otp', data),
  loginOTP: (data) => api.post('/api/auth/login-otp', data),
  verifyOTP: (data) => api.post('/api/auth/verify-otp', data),
};

// API de solicitudes
export const requestAPI = {
  createRequest: (data) => api.post('/api/requests/new', data),
  getClientRequests: (clientId) => api.get(`/api/requests/client/${clientId}`),
  getRequestById: (requestId) => api.get(`/api/requests/${requestId}`),
};

export default api;

