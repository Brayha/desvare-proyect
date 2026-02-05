/**
 * Script para poblar categorías, marcas y modelos de grúas en Colombia
 * 
 * Este script agrega:
 * - 2 categorías: GRUA_LIVIANA y GRUA_PESADA
 * - 18 marcas (9 para livianas, 14 para pesadas, 5 compartidas)
 * - 80+ modelos específicos
 * 
 * Uso: node backend/scripts/populateTruckData.js
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/vehicles-colombia.json');

console.log('🚚 Iniciando población de datos de grúas...\n');

// Leer archivo actual
let vehiclesData;
try {
  const rawData = fs.readFileSync(DATA_FILE, 'utf8');
  vehiclesData = JSON.parse(rawData);
  console.log('✅ Archivo vehicles-colombia.json cargado correctamente');
} catch (error) {
  console.error('❌ Error leyendo archivo:', error.message);
  process.exit(1);
}

// ============================================
// CATEGORÍAS DE GRÚAS
// ============================================

const truckCategories = [
  {
    id: 'GRUA_LIVIANA',
    name: 'Grúa Liviana',
    descripcion: 'Camionetas, pickups y vehículos pequeños modificados como grúas',
    icon: '🚙',
    order: 6,
    canPickup: ['MOTOS', 'AUTOS']
  },
  {
    id: 'GRUA_PESADA',
    name: 'Grúa Pesada',
    descripcion: 'Camiones, cabezotes y vehículos de carga modificados como grúas',
    icon: '🚚',
    order: 7,
    canPickup: ['AUTOS', 'CAMIONETAS', 'CAMIONES', 'BUSES']
  }
];

// ============================================
// MARCAS Y MODELOS DE GRÚAS
// ============================================

const truckBrandsAndModels = {
  // GRÚAS LIVIANAS - Camionetas y Pickups
  GRUA_LIVIANA: [
    {
      brand: 'Chevrolet',
      models: ['LUV D-MAX', 'Colorado', 'S10', 'Montana', 'Silverado 1500']
    },
    {
      brand: 'Toyota',
      models: ['Hilux', 'Tacoma', 'Tundra', 'Land Cruiser']
    },
    {
      brand: 'Nissan',
      models: ['Frontier', 'Navara', 'NP300', 'Titan']
    },
    {
      brand: 'Mazda',
      models: ['BT-50', 'B2500', 'B2200']
    },
    {
      brand: 'Ford',
      models: ['Ranger', 'F-150', 'F-250', 'F-350']
    },
    {
      brand: 'Mitsubishi',
      models: ['L200', 'Triton', 'Montero Sport']
    },
    {
      brand: 'Isuzu',
      models: ['D-Max', 'Rodeo']
    },
    {
      brand: 'Great Wall',
      models: ['Wingle 5', 'Wingle 7', 'Poer']
    },
    {
      brand: 'JAC',
      models: ['T6', 'T8', 'X200']
    }
  ],

  // GRÚAS PESADAS - Camiones y Cabezotes
  GRUA_PESADA: [
    {
      brand: 'Chevrolet',
      models: ['NPR', 'NPR HD', 'NQR', 'FRR', 'FVR', 'NKR', 'NHR']
    },
    {
      brand: 'Hino',
      models: ['Serie 300 (316)', 'Serie 500 (500 FC)', 'Serie 700 (700 GH)', 'FC', 'GH', '268', '338']
    },
    {
      brand: 'Mitsubishi',
      models: ['Canter', 'Fuso', 'FE', 'FM', 'L300']
    },
    {
      brand: 'Isuzu',
      models: ['NPR', 'NPR HD', 'NQR', 'FTR', 'FVR', 'NKR', 'ELF']
    },
    {
      brand: 'Foton',
      models: ['Aumark', 'Auman', 'Ollin', 'View', 'BJ1049', 'BJ1069']
    },
    {
      brand: 'JAC',
      models: ['HFC1061', 'HFC1048', 'N Series', 'K Series']
    },
    {
      brand: 'Dongfeng',
      models: ['Captain', 'Rich', 'Succe', 'EQ1061', 'EQ1108']
    },
    {
      brand: 'Freightliner',
      models: ['M2 106', 'M2 112', 'Business Class', 'Cascadia']
    },
    {
      brand: 'International',
      models: ['4300', 'DuraStar', 'WorkStar', 'CV']
    },
    {
      brand: 'Kenworth',
      models: ['T370', 'T440', 'T800', 'T880']
    },
    {
      brand: 'Volvo',
      models: ['FM', 'FH', 'VNL', 'VHD']
    },
    {
      brand: 'Mercedes-Benz',
      models: ['Atego', 'Axor', 'Actros', '1214', '1418', '1618', '1720', '1933']
    },
    {
      brand: 'Scania',
      models: ['P 250', 'P 320', 'G 360', 'G 410', 'R 450', 'R 500']
    },
    {
      brand: 'Hyundai',
      models: ['HD65', 'HD72', 'HD78', 'HD120', 'Mighty', 'County']
    }
  ]
};

// ============================================
// FUNCIONES DE PROCESAMIENTO
// ============================================

function addCategories() {
  console.log('\n📦 Agregando categorías de grúas...');
  
  truckCategories.forEach(category => {
    const exists = vehiclesData.categories.find(cat => cat.id === category.id);
    if (exists) {
      console.log(`   ⚠️  Categoría ${category.id} ya existe, actualizando...`);
      Object.assign(exists, category);
    } else {
      vehiclesData.categories.push(category);
      console.log(`   ✅ Categoría ${category.id} agregada`);
    }
  });
}

function addBrandsAndModels() {
  console.log('\n🚛 Agregando marcas y modelos de grúas...');
  
  // Asegurar que models sea un objeto si no existe
  if (!vehiclesData.models || Array.isArray(vehiclesData.models)) {
    vehiclesData.models = {};
  }
  
  // Inicializar contadores
  const truckBrandsCount = { GRUA_LIVIANA: 0, GRUA_PESADA: 0 };
  const truckModelsCount = { GRUA_LIVIANA: 0, GRUA_PESADA: 0 };
  
  // 🧹 Limpiar marcas antiguas de grúas (con categoryId en lugar de categories)
  console.log('\n   🧹 Limpiando marcas antiguas de grúas...');
  const initialBrandsCount = vehiclesData.brands.length;
  vehiclesData.brands = vehiclesData.brands.filter(brand => {
    // Eliminar marcas que tengan categoryId con GRUA_ (estructura antigua)
    if (brand.categoryId && (brand.categoryId === 'GRUA_LIVIANA' || brand.categoryId === 'GRUA_PESADA')) {
      console.log(`      🗑️  Eliminando marca antigua: ${brand.name} (${brand.categoryId})`);
      return false;
    }
    return true;
  });
  const removedCount = initialBrandsCount - vehiclesData.brands.length;
  if (removedCount > 0) {
    console.log(`   ✅ ${removedCount} marcas antiguas eliminadas`);
  }
  
  Object.keys(truckBrandsAndModels).forEach(categoryId => {
    const brands = truckBrandsAndModels[categoryId];
    console.log(`\n   📁 Procesando ${categoryId}...`);
    
    brands.forEach(({ brand, models }) => {
      // Buscar o crear la marca
      const brandId = `${categoryId}_${brand.toUpperCase().replace(/\s+/g, '_')}`;
      let brandEntry = vehiclesData.brands.find(b => b.id === brandId);
      
      if (!brandEntry) {
        brandEntry = {
          id: brandId,
          name: brand,
          categories: [categoryId], // ✅ Usar array en lugar de string
          country: getBrandCountry(brand),
          logo_url: null
        };
        vehiclesData.brands.push(brandEntry);
        console.log(`      ✅ Marca agregada: ${brand} (${categoryId})`);
        truckBrandsCount[categoryId]++;
      }
      
      // ✅ CORRECCIÓN: Usar brandId completo (ej: GRUA_PESADA_CHEVROLET) en lugar de solo CHEVROLET
      // Inicializar array para esta marca si no existe
      if (!vehiclesData.models[brandId]) {
        vehiclesData.models[brandId] = [];
      }
      
      // Agregar modelos
      models.forEach(modelName => {
        const modelExists = vehiclesData.models[brandId].find(
          m => m.name === modelName && m.category === categoryId
        );
        
        if (!modelExists) {
          const newModel = {
            id: `${brandId}_${modelName.toUpperCase().replace(/[\s\-\/\(\)]/g, '_')}`,
            name: modelName,
            category: categoryId,
            brandId: brandId, // ✅ Agregar brandId para referencia
            tipo_combustible: 'Diésel',
            anos_populares: '2010-2024'
          };
          vehiclesData.models[brandId].push(newModel);
          console.log(`         ➕ Modelo: ${modelName}`);
          truckModelsCount[categoryId]++;
        }
      });
    });
  });
  
  // Retornar contadores para el resumen
  return { truckBrandsCount, truckModelsCount };
}

function getBrandCountry(brandName) {
  const countries = {
    'Chevrolet': 'USA',
    'Toyota': 'Japón',
    'Nissan': 'Japón',
    'Mazda': 'Japón',
    'Ford': 'USA',
    'Mitsubishi': 'Japón',
    'Isuzu': 'Japón',
    'Great Wall': 'China',
    'JAC': 'China',
    'Hino': 'Japón',
    'Foton': 'China',
    'Dongfeng': 'China',
    'Freightliner': 'USA',
    'International': 'USA',
    'Kenworth': 'USA',
    'Volvo': 'Suecia',
    'Mercedes-Benz': 'Alemania',
    'Scania': 'Suecia',
    'Hyundai': 'Corea del Sur'
  };
  return countries[brandName] || 'Desconocido';
}

function saveData() {
  console.log('\n💾 Guardando datos...');
  try {
    const jsonString = JSON.stringify(vehiclesData, null, 2);
    fs.writeFileSync(DATA_FILE, jsonString, 'utf8');
    console.log('✅ Archivo guardado correctamente');
  } catch (error) {
    console.error('❌ Error guardando archivo:', error.message);
    process.exit(1);
  }
}

function printSummary(truckBrandsCount, truckModelsCount) {
  const gruaLivianaCount = vehiclesData.brands.filter(b => b.categories && b.categories.includes('GRUA_LIVIANA')).length;
  const gruaPesadaCount = vehiclesData.brands.filter(b => b.categories && b.categories.includes('GRUA_PESADA')).length;
  
  // Contar modelos en el objeto models
  let gruaLivianaModelsCount = 0;
  let gruaPesadaModelsCount = 0;
  
  Object.keys(vehiclesData.models).forEach(brandKey => {
    const brandModels = vehiclesData.models[brandKey];
    brandModels.forEach(model => {
      if (model.category === 'GRUA_LIVIANA') gruaLivianaModelsCount++;
      if (model.category === 'GRUA_PESADA') gruaPesadaModelsCount++;
    });
  });
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMEN');
  console.log('='.repeat(50));
  console.log(`✅ Categorías: 2 agregadas (GRUA_LIVIANA, GRUA_PESADA)`);
  console.log(`✅ Marcas GRUA_LIVIANA: ${gruaLivianaCount}`);
  console.log(`✅ Marcas GRUA_PESADA: ${gruaPesadaCount}`);
  console.log(`✅ Modelos GRUA_LIVIANA: ${gruaLivianaModelsCount}`);
  console.log(`✅ Modelos GRUA_PESADA: ${gruaPesadaModelsCount}`);
  console.log(`✅ Total Modelos de Grúas: ${gruaLivianaModelsCount + gruaPesadaModelsCount}`);
  console.log('='.repeat(50));
  console.log('\n🎉 ¡Datos de grúas poblados exitosamente!');
  console.log('🔄 Reinicia el backend para aplicar los cambios\n');
}

// ============================================
// EJECUTAR SCRIPT
// ============================================

try {
  addCategories();
  const { truckBrandsCount, truckModelsCount } = addBrandsAndModels();
  saveData();
  printSummary(truckBrandsCount, truckModelsCount);
} catch (error) {
  console.error('\n❌ Error ejecutando script:', error.message);
  console.error(error.stack);
  process.exit(1);
}

