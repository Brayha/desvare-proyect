const fs = require('fs');
const path = require('path');

class VehiclesLocalService {
  constructor() {
    this.data = null;
    this.loadData();
  }

  /**
   * Cargar datos desde el archivo JSON
   */
  loadData() {
    try {
      const dataPath = path.join(__dirname, '../data/vehicles-colombia.json');
      const rawData = fs.readFileSync(dataPath, 'utf8');
      this.data = JSON.parse(rawData);
      console.log('✅ Datos de vehículos colombianos cargados correctamente');
      console.log(`   📋 ${this.data.categories.length} categorías`);
      console.log(`   🚗 ${this.data.brands.length} marcas`);
      console.log(`   📦 ${Object.keys(this.data.models).length} marcas con modelos`);
    } catch (error) {
      console.error('❌ Error cargando datos de vehículos:', error.message);
      this.data = { categories: [], brands: [], models: {} };
    }
  }

  /**
   * Obtener todas las categorías de vehículos (excluye las deprecadas)
   */
  getCategories() {
    return this.data.categories
      .filter(cat => !cat.deprecated && !cat.hidden)
      .map(cat => ({
        id: cat.id,
        name: cat.name,
        descripcion: cat.descripcion,
        icon: cat.icon,
        order: cat.order
      }))
      .sort((a, b) => (a.order || 999) - (b.order || 999));
  }

  /**
   * Obtener todas las marcas (opcionalmente filtradas por categoría)
   */
  getBrands(categoryId = null) {
    let brands = this.data.brands;

    console.log(`🔍 getBrands llamado con categoryId: ${categoryId}`);
    console.log(`📊 Total marcas disponibles: ${brands.length}`);

    // Filtrar por categoría si se especifica
    if (categoryId) {
      brands = brands.filter(brand => {
        const hasCategories = brand.categories && Array.isArray(brand.categories);
        const includes = hasCategories && brand.categories.includes(categoryId);
        
        // Debug para marcas de grúas
        if (categoryId.includes('GRUA') && brand.name) {
          console.log(`   🔧 Marca: ${brand.name}, categories: ${JSON.stringify(brand.categories)}, includes: ${includes}`);
        }
        
        return includes;
      });
      
      console.log(`✅ Marcas filtradas para ${categoryId}: ${brands.length}`);
    }

    // Retornar solo id y name, ordenado alfabéticamente
    return brands
      .map(brand => ({
        id: brand.id,
        name: brand.name
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Obtener modelos de una marca específica (opcionalmente filtrados por categoría)
   */
  getModels(brandId, categoryId = null) {
    const models = this.data.models[brandId] || [];

    // Filtrar por categoría si se especifica.
    // Si el modelo no tiene campo 'category' (modelos nuevos sin metadatos extra),
    // se incluye igualmente ya que el brandId ya implica la categoría.
    if (categoryId) {
      return models
        .filter(model => !model.category || model.category === categoryId)
        .map(({ id, name }) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    // Retornar todos los modelos
    return models
      .map(({ id, name }) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Buscar una marca por ID
   */
  getBrandById(brandId) {
    return this.data.brands.find(b => b.id === brandId);
  }

  /**
   * Buscar un modelo por ID dentro de una marca
   */
  getModelById(brandId, modelId) {
    const models = this.data.models[brandId] || [];
    return models.find(m => m.id === modelId);
  }

  /**
   * Buscar categoría por ID
   */
  getCategoryById(categoryId) {
    return this.data.categories.find(c => c.id === categoryId);
  }

  /**
   * Obtener estadísticas
   */
  getStats() {
    const totalModels = Object.values(this.data.models)
      .reduce((sum, models) => sum + models.length, 0);

    return {
      categories: this.data.categories.length,
      brands: this.data.brands.length,
      totalModels: totalModels,
      brandsWithModels: Object.keys(this.data.models).length
    };
  }

  /**
   * Recargar datos (útil si se actualiza el JSON)
   */
  reload() {
    this.loadData();
    return this.getStats();
  }
}

module.exports = new VehiclesLocalService();

