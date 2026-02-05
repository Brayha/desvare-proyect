/**
 * Script para limpiar base de datos de pruebas
 * Elimina solicitudes antiguas y clientes de prueba
 * Ejecutar con: node scripts/cleanDatabase.js
 */

const mongoose = require('mongoose');
const path = require('path');
const readline = require('readline');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Modelos
const Request = require('../models/Request');
const User = require('../models/User');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function cleanDatabase() {
  try {
    console.log('🧹 Script de Limpieza de Base de Datos - Desvare\n');

    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Conectado a MongoDB\n');

    // Contar datos actuales
    const requestCount = await Request.countDocuments();
    const clientCount = await User.countDocuments({ userType: 'client' });
    const driverCount = await User.countDocuments({ userType: 'driver' });
    const adminCount = await User.countDocuments({ userType: 'admin' });

    console.log('📊 Estado actual de la base de datos:');
    console.log(`   - Solicitudes: ${requestCount}`);
    console.log(`   - Clientes: ${clientCount}`);
    console.log(`   - Conductores: ${driverCount}`);
    console.log(`   - Admins: ${adminCount}\n`);

    if (requestCount === 0 && clientCount === 0) {
      console.log('✅ La base de datos ya está limpia. No hay nada que eliminar.\n');
      rl.close();
      process.exit(0);
    }

    // Confirmar eliminación
    console.log('⚠️  ADVERTENCIA: Esta operación eliminará:');
    console.log(`   ❌ TODAS las solicitudes (${requestCount})`);
    console.log(`   ❌ TODOS los clientes (${clientCount})`);
    console.log('   ✅ Se mantendrán: Conductores y Admins\n');

    const answer = await question('¿Estás seguro de continuar? (escribe "SI" para confirmar): ');

    if (answer.trim().toUpperCase() !== 'SI') {
      console.log('\n❌ Operación cancelada por el usuario.');
      rl.close();
      process.exit(0);
    }

    console.log('\n🔄 Iniciando limpieza...\n');

    // Eliminar todas las solicitudes
    const deletedRequests = await Request.deleteMany({});
    console.log(`✅ ${deletedRequests.deletedCount} solicitudes eliminadas`);

    // Eliminar todos los clientes
    const deletedClients = await User.deleteMany({ userType: 'client' });
    console.log(`✅ ${deletedClients.deletedCount} clientes eliminados`);

    // Verificar estado final
    const finalRequestCount = await Request.countDocuments();
    const finalClientCount = await User.countDocuments({ userType: 'client' });
    const finalDriverCount = await User.countDocuments({ userType: 'driver' });

    console.log('\n📊 Estado final de la base de datos:');
    console.log(`   - Solicitudes: ${finalRequestCount}`);
    console.log(`   - Clientes: ${finalClientCount}`);
    console.log(`   - Conductores: ${finalDriverCount} (sin cambios)`);
    
    console.log('\n✅ Limpieza completada exitosamente!');
    console.log('🎉 Base de datos lista para empezar de cero.\n');

    rl.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error durante la limpieza:', error);
    rl.close();
    process.exit(1);
  }
}

// Ejecutar
cleanDatabase();
