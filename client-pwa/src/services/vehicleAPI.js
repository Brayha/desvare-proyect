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

/**
 * API de Vehículos
 * Servicios para gestionar vehículos del usuario y catálogo
 */
export const vehicleAPI = {
  // ========================================
  // CATÁLOGO (Opciones para dropdowns)
  // ========================================

  /**
   * Obtener categorías de vehículos
   * @returns {Promise} Lista de categorías
   */
  getCategories: () => api.get('/api/vehicles/options/categories'),

  /**
   * Obtener marcas de vehículos
   * @param {string} categoryId - ID de categoría (opcional)
   * @returns {Promise} Lista de marcas
   */
  getBrands: (categoryId = null) => {
    const params = categoryId ? { categoryId } : {};
    return api.get('/api/vehicles/options/brands', { params });
  },

  /**
   * Obtener modelos de una marca
   * @param {string} brandId - ID de marca (requerido)
   * @param {string} categoryId - ID de categoría (opcional)
   * @returns {Promise} Lista de modelos
   */
  getModels: (brandId, categoryId = null) => {
    const params = { brandId };
    if (categoryId) params.categoryId = categoryId;
    return api.get('/api/vehicles/options/models', { params });
  },

  // ========================================
  // CRUD DE VEHÍCULOS
  // ========================================

  /**
   * Crear un nuevo vehículo
   * @param {Object} vehicleData - Datos del vehículo
   * @returns {Promise} Vehículo creado
   */
  createVehicle: (vehicleData) => api.post('/api/vehicles', vehicleData),

  /**
   * Obtener vehículos de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise} Lista de vehículos
   */
  getUserVehicles: (userId) => api.get(`/api/vehicles/user/${userId}`),

  /**
   * Obtener un vehículo específico
   * @param {string} vehicleId - ID del vehículo
   * @returns {Promise} Datos del vehículo
   */
  getVehicleById: (vehicleId) => api.get(`/api/vehicles/${vehicleId}`),

  /**
   * Actualizar un vehículo
   * @param {string} vehicleId - ID del vehículo
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise} Vehículo actualizado
   */
  updateVehicle: (vehicleId, updateData) => api.put(`/api/vehicles/${vehicleId}`, updateData),

  /**
   * Eliminar un vehículo (soft delete)
   * @param {string} vehicleId - ID del vehículo
   * @returns {Promise} Confirmación
   */
  deleteVehicle: (vehicleId) => api.delete(`/api/vehicles/${vehicleId}`),

  // ========================================
  // UTILIDADES
  // ========================================

  /**
   * Obtener estadísticas del catálogo
   * @returns {Promise} Estadísticas
   */
  getStats: () => api.get('/api/vehicles/stats'),
};

export default vehicleAPI;

