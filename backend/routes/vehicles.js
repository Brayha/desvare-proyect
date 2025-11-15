const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
// const mlService = require('../services/mercadolibre'); // API externa (problemas)
const vehiclesLocalService = require('../services/vehiclesLocal'); // Datos locales Colombia

// ============================================
// ENDPOINTS PARA EL FRONTEND (Dropdowns)
// ============================================

/**
 * GET /api/vehicles/options/categories
 * Obtener categorías de vehículos para el dropdown
 */
router.get('/options/categories', (req, res) => {
  try {
    console.log('📋 Obteniendo categorías de vehículos...');
    const categories = vehiclesLocalService.getCategories();

    res.json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener categorías'
    });
  }
});

/**
 * GET /api/vehicles/options/brands
 * Obtener marcas de vehículos para el dropdown
 * Query params: categoryId (opcional)
 */
router.get('/options/brands', (req, res) => {
  try {
    const { categoryId } = req.query;
    console.log('🚗 Obteniendo marcas de vehículos...');
    if (categoryId) {
      console.log(`   📋 Filtradas por categoría: ${categoryId}`);
    }
    
    const brands = vehiclesLocalService.getBrands(categoryId);

    res.json({
      success: true,
      count: brands.length,
      data: brands
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener marcas'
    });
  }
});

/**
 * GET /api/vehicles/options/models
 * Obtener modelos de una marca para el dropdown
 * Query params: brandId (requerido), categoryId (opcional)
 */
router.get('/options/models', (req, res) => {
  try {
    const { brandId, categoryId } = req.query;

    if (!brandId) {
      return res.status(400).json({
        success: false,
        error: 'brandId es requerido'
      });
    }

    console.log(`🚙 Obteniendo modelos para marca ${brandId}...`);
    if (categoryId) {
      console.log(`   📋 Filtrados por categoría: ${categoryId}`);
    }
    
    const models = vehiclesLocalService.getModels(brandId, categoryId);

    res.json({
      success: true,
      count: models.length,
      data: models
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener modelos'
    });
  }
});

// ============================================
// CRUD DE VEHÍCULOS
// ============================================

/**
 * POST /api/vehicles
 * Crear un nuevo vehículo para un usuario
 */
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      category,
      brand,
      model,
      year,
      color,
      licensePlate
    } = req.body;

    // Validaciones
    if (!userId || !category || !brand || !model) {
      return res.status(400).json({
        success: false,
        error: 'userId, category, brand y model son requeridos'
      });
    }

    if (!category.id || !category.name) {
      return res.status(400).json({
        success: false,
        error: 'category debe tener id y name'
      });
    }

    if (!brand.id || !brand.name) {
      return res.status(400).json({
        success: false,
        error: 'brand debe tener id y name'
      });
    }

    if (!model.id || !model.name) {
      return res.status(400).json({
        success: false,
        error: 'model debe tener id y name'
      });
    }

    console.log(`🚗 Creando vehículo para usuario ${userId}:`);
    console.log(`   Categoría: ${category.name}`);
    console.log(`   Marca: ${brand.name}`);
    console.log(`   Modelo: ${model.name}`);

    // Crear vehículo
    const vehicle = new Vehicle({
      userId,
      category: {
        id: category.id,
        name: category.name
      },
      brand: {
        id: brand.id,
        name: brand.name
      },
      model: {
        id: model.id,
        name: model.name
      },
      year,
      color,
      licensePlate: licensePlate?.toUpperCase(),
      isActive: true
    });

    await vehicle.save();

    console.log(`✅ Vehículo creado con ID: ${vehicle._id}`);

    res.status(201).json({
      success: true,
      message: 'Vehículo registrado exitosamente',
      data: {
        id: vehicle._id,
        userId: vehicle.userId,
        category: vehicle.category,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color,
        licensePlate: vehicle.licensePlate,
        createdAt: vehicle.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Error creando vehículo:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear vehículo',
      details: error.message
    });
  }
});

/**
 * GET /api/vehicles/user/:userId
 * Obtener vehículos de un usuario
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`📋 Obteniendo vehículos del usuario ${userId}...`);
    
    const vehicles = await Vehicle.find({ 
      userId, 
      isActive: true 
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: vehicles.length,
      data: vehicles
    });
  } catch (error) {
    console.error('❌ Error obteniendo vehículos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener vehículos',
      details: error.message
    });
  }
});

/**
 * GET /api/vehicles/:id
 * Obtener un vehículo específico
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const vehicle = await Vehicle.findById(id);
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehículo no encontrado'
      });
    }

    res.json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    console.error('❌ Error obteniendo vehículo:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener vehículo',
      details: error.message
    });
  }
});

/**
 * PUT /api/vehicles/:id
 * Actualizar un vehículo
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { year, color, licensePlate } = req.body;

    console.log(`✏️ Actualizando vehículo ${id}...`);

    const vehicle = await Vehicle.findById(id);
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehículo no encontrado'
      });
    }

    // Actualizar solo campos permitidos
    if (year !== undefined) vehicle.year = year;
    if (color !== undefined) vehicle.color = color;
    if (licensePlate !== undefined) vehicle.licensePlate = licensePlate.toUpperCase();
    
    vehicle.updatedAt = Date.now();
    
    await vehicle.save();

    console.log(`✅ Vehículo ${id} actualizado`);

    res.json({
      success: true,
      message: 'Vehículo actualizado exitosamente',
      data: vehicle
    });
  } catch (error) {
    console.error('❌ Error actualizando vehículo:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar vehículo',
      details: error.message
    });
  }
});

/**
 * DELETE /api/vehicles/:id
 * Eliminar (desactivar) un vehículo
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ Eliminando vehículo ${id}...`);

    const vehicle = await Vehicle.findById(id);
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehículo no encontrado'
      });
    }

    // Soft delete
    vehicle.isActive = false;
    vehicle.updatedAt = Date.now();
    await vehicle.save();

    console.log(`✅ Vehículo ${id} eliminado (desactivado)`);

    res.json({
      success: true,
      message: 'Vehículo eliminado exitosamente'
    });
  } catch (error) {
    console.error('❌ Error eliminando vehículo:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar vehículo',
      details: error.message
    });
  }
});

// ============================================
// UTILIDADES
// ============================================

/**
 * GET /api/vehicles/stats
 * Obtener estadísticas del catálogo de vehículos
 */
router.get('/stats', (req, res) => {
  try {
    const stats = vehiclesLocalService.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas'
    });
  }
});

/**
 * POST /api/vehicles/admin/reload
 * Recargar datos de vehículos (admin)
 */
router.post('/admin/reload', (req, res) => {
  try {
    const stats = vehiclesLocalService.reload();
    res.json({
      success: true,
      message: 'Datos recargados exitosamente',
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al recargar datos'
    });
  }
});

module.exports = router;

