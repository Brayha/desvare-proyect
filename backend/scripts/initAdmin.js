/**
 * Script para inicializar el administrador principal de Desvare
 * Ejecutar con: node scripts/initAdmin.js
 */

const mongoose = require('mongoose');
const path = require('path');
const Admin = require('../models/Admin');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function initAdmin() {
  try {
    console.log('🔧 Inicializando administrador de Desvare...\n');

    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Conectado a MongoDB\n');

    // Verificar si ya existe el admin
    const existingAdmin = await Admin.findOne({ 
      email: 'desvareweb@gmail.com' 
    });

    if (existingAdmin) {
      console.log('⚠️  El administrador ya existe:');
      console.log('   Email:', existingAdmin.email);
      console.log('   Nombre:', existingAdmin.name);
      console.log('   Role:', existingAdmin.role);
      console.log('   Activo:', existingAdmin.isActive);
      console.log('   ID:', existingAdmin._id);
      console.log('\n✅ No es necesario crear el admin nuevamente.');
      process.exit(0);
    }

    // Crear admin principal
    const admin = new Admin({
      email: 'desvareweb@gmail.com',
      password: 'admin123*', // Se hasheará automáticamente en el pre-save
      role: 'super_admin',
      name: 'Administrador Desvare',
      isActive: true
    });

    await admin.save();

    console.log('✅ Admin creado exitosamente:\n');
    console.log('   Email:    desvareweb@gmail.com');
    console.log('   Password: admin123*');
    console.log('   Role:     super_admin');
    console.log('   ID:      ', admin._id);
    console.log('\n🔐 Guarda estas credenciales de forma segura.');
    console.log('📱 Accede al dashboard en: http://localhost:5174/login\n');

    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error inicializando admin:', error);
    process.exit(1);
  }
}

// Ejecutar
initAdmin();

