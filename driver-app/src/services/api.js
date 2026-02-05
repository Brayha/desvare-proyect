import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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

// API de autenticación de conductores
export const authAPI = {
  // Registro inicial con OTP
  registerDriverInitial: (data) => api.post('/api/drivers/register-initial', data),
  verifyDriverOTP: (data) => api.post('/api/drivers/verify-otp', data),
  
  // Login con OTP (para conductores existentes)
  loginDriverOTP: (data) => api.post('/api/drivers/login-otp', data),
  
  // Registro completo
  registerDriverComplete: (data) => api.post('/api/drivers/register-complete', data),
  uploadDriverDocuments: (data) => api.post('/api/drivers/upload-documents', data), // Ahora envía JSON con base64
  setDriverCapabilities: (data) => api.post('/api/drivers/set-capabilities', data),
  
  // Estado del conductor
  getDriverStatus: (userId) => api.get(`/api/drivers/status/${userId}`),
  toggleDriverOnline: (data) => api.put('/api/drivers/toggle-online', data),
};

// API de solicitudes
export const requestAPI = {
  addQuote: (requestId, data) => api.post(`/api/requests/${requestId}/quote`, data),
  getRequest: (requestId) => api.get(`/api/requests/${requestId}`),
  getNearbyRequests: (driverId) => api.get(`/api/requests/nearby/${driverId}`),
  cancelQuote: (requestId, driverId, data) => api.delete(`/api/requests/${requestId}/quote/${driverId}`, { data }),
};

// API de ciudades
export const citiesAPI = {
  getAll: () => api.get('/api/cities'),
  getByRegion: () => api.get('/api/cities/by-region'),
};

// 🆕 API de vehículos (para catálogo de marcas/modelos de grúas)
export const vehicleAPI = {
  getCategories: () => api.get('/api/vehicles/options/categories'),
  getBrands: (categoryId) => api.get(`/api/vehicles/options/brands?categoryId=${categoryId}`),
  getModels: (brandId, categoryId) => api.get(`/api/vehicles/options/models?brandId=${brandId}&categoryId=${categoryId}`),
};

export default api;


