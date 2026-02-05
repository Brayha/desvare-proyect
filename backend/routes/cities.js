/**
 * Rutas para obtener ciudades de Colombia
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

/**
 * GET /api/cities
 * Obtiene lista de ciudades de Colombia
 */
router.get('/', (req, res) => {
  try {
    const citiesPath = path.join(__dirname, '../data/ciudades-colombia.json');
    const citiesData = JSON.parse(fs.readFileSync(citiesPath, 'utf8'));
    
    // Filtrar solo ciudades habilitadas y ordenar por nombre
    const enabledCities = citiesData.ciudades
      .filter(city => city.enabled)
      .sort((a, b) => a.name.localeCompare(b.name));
    
    res.json({
      success: true,
      total: enabledCities.length,
      cities: enabledCities
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo ciudades:', error);
    res.status(500).json({
      error: 'Error al obtener ciudades',
      details: error.message
    });
  }
});

/**
 * GET /api/cities/by-region
 * Obtiene ciudades agrupadas por región
 */
router.get('/by-region', (req, res) => {
  try {
    const citiesPath = path.join(__dirname, '../data/ciudades-colombia.json');
    const citiesData = JSON.parse(fs.readFileSync(citiesPath, 'utf8'));
    
    // Agrupar por región
    const byRegion = {};
    citiesData.ciudades
      .filter(city => city.enabled)
      .forEach(city => {
        if (!byRegion[city.region]) {
          byRegion[city.region] = [];
        }
        byRegion[city.region].push(city);
      });
    
    // Ordenar ciudades dentro de cada región
    Object.keys(byRegion).forEach(region => {
      byRegion[region].sort((a, b) => a.name.localeCompare(b.name));
    });
    
    res.json({
      success: true,
      regions: Object.keys(byRegion).sort(),
      data: byRegion
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo ciudades por región:', error);
    res.status(500).json({
      error: 'Error al obtener ciudades',
      details: error.message
    });
  }
});

module.exports = router;

