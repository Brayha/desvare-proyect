const axios = require('axios');
const https = require('https');

const ML_BASE_URL = 'https://api.mercadolibre.com';
const ML_SITE = 'MCO'; // Colombia
const VEHICLES_CATEGORY_ID = 'MCO1744'; // Carros, Motos y Otros

// Configurar axios para desarrollo con headers apropiados
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({  
    rejectUnauthorized: false // Solo para desarrollo
  }),
  timeout: 10000, // 10 segundos timeout
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'es-CO,es;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive'
  }
});

class MercadoLibreService {
  constructor() {
    // Cache simple en memoria (en producción usar Redis)
    this.cache = {
      categories: null,
      brands: null,
      models: {},
      timestamp: null
    };
    this.cacheTimeout = 86400000; // 24 horas en milisegundos
  }

  /**
   * Verificar si el cache es válido
   */
  isCacheValid() {
    if (!this.cache.timestamp) return false;
    return (Date.now() - this.cache.timestamp) < this.cacheTimeout;
  }

  /**
   * Obtener categorías de vehículos (solo carros)
   */
  async getVehicleCategories() {
    if (this.isCacheValid() && this.cache.categories) {
      console.log('📋 Usando cache de categorías');
      return this.cache.categories;
    }

    try {
      console.log('🌐 Consultando categorías de ML...');
      const response = await axiosInstance.get(
        `${ML_BASE_URL}/sites/${ML_SITE}/categories`
      );
      
      // Filtrar solo categoría de vehículos
      const vehicleCategories = response.data.filter(cat => 
        cat.id === VEHICLES_CATEGORY_ID || 
        cat.name.toLowerCase().includes('carro') ||
        cat.name.toLowerCase().includes('auto')
      );

      this.cache.categories = vehicleCategories;
      this.cache.timestamp = Date.now();
      
      return vehicleCategories;
    } catch (error) {
      console.error('❌ Error obteniendo categorías:', error.message);
      throw new Error('No se pudieron obtener las categorías');
    }
  }

  /**
   * Obtener marcas de vehículos (BRAND attribute)
   */
  async getVehicleBrands(categoryId = VEHICLES_CATEGORY_ID) {
    if (this.isCacheValid() && this.cache.brands) {
      console.log('🚗 Usando cache de marcas');
      return this.cache.brands;
    }

    try {
      console.log('🌐 Consultando marcas de ML...');
      
      // Hacer una búsqueda para obtener filtros disponibles
      const response = await axiosInstance.get(
        `${ML_BASE_URL}/sites/${ML_SITE}/search`,
        {
          params: {
            category: categoryId,
            limit: 1
          }
        }
      );

      // Buscar el filtro de BRAND en available_filters
      const brandFilter = response.data.available_filters?.find(
        filter => filter.id === 'BRAND'
      );

      if (!brandFilter || !brandFilter.values) {
        throw new Error('No se encontraron marcas disponibles');
      }

      // Formatear marcas
      const brands = brandFilter.values.map(brand => ({
        id: brand.id,
        name: brand.name,
        results: brand.results || 0
      })).sort((a, b) => a.name.localeCompare(b.name));

      this.cache.brands = brands;
      this.cache.timestamp = Date.now();
      
      console.log(`✅ ${brands.length} marcas encontradas`);
      return brands;
    } catch (error) {
      console.error('❌ Error obteniendo marcas:', error.message);
      throw new Error('No se pudieron obtener las marcas');
    }
  }

  /**
   * Obtener modelos de una marca específica
   */
  async getVehicleModels(brandId, categoryId = VEHICLES_CATEGORY_ID) {
    const cacheKey = `${categoryId}_${brandId}`;
    
    if (this.isCacheValid() && this.cache.models[cacheKey]) {
      console.log(`🚙 Usando cache de modelos para marca ${brandId}`);
      return this.cache.models[cacheKey];
    }

    try {
      console.log(`🌐 Consultando modelos de ML para marca ${brandId}...`);
      
      // Búsqueda filtrada por marca
      const response = await axiosInstance.get(
        `${ML_BASE_URL}/sites/${ML_SITE}/search`,
        {
          params: {
            category: categoryId,
            BRAND: brandId,
            limit: 1
          }
        }
      );

      // Buscar el filtro de MODEL en available_filters
      const modelFilter = response.data.available_filters?.find(
        filter => filter.id === 'MODEL'
      );

      if (!modelFilter || !modelFilter.values) {
        throw new Error(`No se encontraron modelos para la marca ${brandId}`);
      }

      // Formatear modelos
      const models = modelFilter.values.map(model => ({
        id: model.id,
        name: model.name,
        results: model.results || 0
      })).sort((a, b) => a.name.localeCompare(b.name));

      this.cache.models[cacheKey] = models;
      this.cache.timestamp = Date.now();
      
      console.log(`✅ ${models.length} modelos encontrados para ${brandId}`);
      return models;
    } catch (error) {
      console.error('❌ Error obteniendo modelos:', error.message);
      throw new Error('No se pudieron obtener los modelos');
    }
  }

  /**
   * Limpiar cache (útil para mantenimiento)
   */
  clearCache() {
    this.cache = {
      categories: null,
      brands: null,
      models: {},
      timestamp: null
    };
    console.log('🗑️ Cache de Mercado Libre limpiado');
  }
}

module.exports = new MercadoLibreService();

