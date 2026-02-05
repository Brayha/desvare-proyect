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
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido o expirado
      localStorage.removeItem('adminToken');
      localStorage.removeItem('admin');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API de autenticación
export const authAPI = {
  login: (credentials) => api.post('/api/admin/login', credentials),
  logout: () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
  },
};

// API de dashboard
export const dashboardAPI = {
  getStats: () => api.get('/api/admin/stats'),
  getActiveServices: () => api.get('/api/admin/services/active'),
};

// API de conductores
export const driversAPI = {
  getAll: (params) => api.get('/api/admin/drivers', { params }),
  getById: (id) => api.get(`/api/admin/drivers/${id}`),
  approve: (id) => api.put(`/api/admin/drivers/${id}/approve`),
  reject: (id, reason) => api.put(`/api/admin/drivers/${id}/reject`, { reason }),
  suspend: (id, reason) => api.put(`/api/admin/drivers/${id}/suspend`, { reason }),
  activate: (id) => api.put(`/api/admin/drivers/${id}/activate`),
  update: (id, data) => api.put(`/api/admin/drivers/${id}`, data),
  delete: (id) => api.delete(`/api/admin/drivers/${id}`),
  addNotes: (id, notes) => api.post(`/api/admin/drivers/${id}/notes`, { notes }),
};

// API de clientes
export const clientsAPI = {
  getAll: (params) => api.get('/api/admin/clients', { params }),
  getById: (id) => api.get(`/api/admin/clients/${id}`),
  suspend: (id, reason) => api.put(`/api/admin/clients/${id}/suspend`, { reason }),
  activate: (id) => api.put(`/api/admin/clients/${id}/activate`),
  delete: (id) => api.delete(`/api/admin/clients/${id}`),
};

// API de servicios
export const servicesAPI = {
  getAll: (params) => api.get('/api/admin/services', { params }),
  getById: (id) => api.get(`/api/admin/services/${id}`),
};

// API de reportes
export const reportsAPI = {
  getRevenue: (params) => api.get('/api/admin/reports/revenue', { params }),
  export: (params) => api.get('/api/admin/reports/export', { params, responseType: 'blob' }),
};

export default api;

