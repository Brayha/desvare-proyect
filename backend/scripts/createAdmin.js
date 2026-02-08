const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createAdmin() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Verificar si ya existe un admin
    const existingAdmin = await User.findOne({ 
      email: 'admin@desvare.app',
      userType: 'admin' 
    });

    if (existingAdmin) {
      console.log('⚠️ Ya existe un usuario admin con ese email');
      console.log('📧 Email: admin@desvare.app');
      console.log('ℹ️ Si olvidaste la contraseña, elimina el usuario y vuelve a ejecutar este script');
      process.exit(0);
    }

    // Crear hash de la contraseña
    const hashedPassword = await bcrypt.hash('Admin123!', 10);

    // Crear usuario admin
    const admin = new User({
      name: 'Administrador Desvare',
      email: 'admin@desvare.app',
      phone: '3000000000',
      password: hashedPassword,
      userType: 'admin',
      isActive: true
    });

    await admin.save();
    
    console.log('');
    console.log('✅ Usuario admin creado exitosamente');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: admin@desvare.app');
    console.log('🔑 Password: Admin123!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login');
    console.log('');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createAdmin();
