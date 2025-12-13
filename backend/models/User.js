const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Campos comunes
  name: {
    type: String,
    required: true
  },
  userType: {
    type: String,
    enum: ['client', 'driver'],
    required: true
  },
  
  // Teléfono (requerido para clients y drivers)
  phone: {
    type: String,
    required: true,
    unique: true,
    sparse: true, // Permite null/undefined sin violar unique
    trim: true
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    code: String,
    expiresAt: Date
  },
  
  // Para DRIVERS - Email (opcional, usado para notificaciones)
  email: {
    type: String,
    sparse: true,
    lowercase: true,
    trim: true
  },
  
  // Estado general del usuario (para suspensiones)
  isActive: {
    type: Boolean,
    default: true
  },
  suspensionReason: String,
  
  // ========================================
  // PERFIL DEL CONDUCTOR
  // ========================================
  driverProfile: {
    // Estado de verificación del conductor
    status: {
      type: String,
      enum: ['pending_documents', 'pending_review', 'approved', 'rejected', 'suspended'],
      default: 'pending_documents'
    },
    
    // Tipo de persona (Natural o Jurídica)
    entityType: {
      type: String,
      enum: ['natural', 'juridica'],
      required: false // Se completa en el paso 3 del registro
    },
    
    // Datos de empresa (solo si es jurídica)
    companyInfo: {
      nit: String,
      companyName: String,
      legalRepresentative: String
    },
    
    // Ubicación del conductor
    city: {
      type: String,
      required: false // Se completa en el paso 3 del registro
    },
    address: String,
    
    // ========================================
    // DOCUMENTOS (URLs de las fotos)
    // ========================================
    documents: {
      cedula: {
        front: String,
        back: String,
        verified: { type: Boolean, default: false }
      },
      licenciaTransito: {
        front: String,
        back: String,
        verified: { type: Boolean, default: false }
      },
      soat: {
        url: String,
        expirationDate: Date,
        verified: { type: Boolean, default: false }
      },
      tarjetaPropiedad: {
        front: String,
        back: String,
        verified: { type: Boolean, default: false }
      },
      seguroTodoRiesgo: {
        url: String,
        verified: { type: Boolean, default: false }
      },
      selfie: String
    },
    
    // ========================================
    // GRÚA DEL CONDUCTOR
    // ========================================
    towTruck: {
      brand: String,
      model: String,
      licensePlate: String,
      year: Number,
      photoUrl: String
    },
    
    // ========================================
    // CAPACIDADES DEL CONDUCTOR
    // ========================================
    // Categorías de vehículos que puede recoger
    vehicleCapabilities: [{
      type: String,
      enum: ['MOTOS', 'AUTOS', 'CAMIONETAS', 'CAMIONES', 'BUSES']
    }],
    
    // Tipos específicos dentro de cada categoría
    specificCapabilities: {
      // Para motos
      canPickupScooters: { type: Boolean, default: false },
      canPickupHighCC: { type: Boolean, default: false }, // Motos de alto cilindraje
      
      // Para autos/camionetas
      canPickupArmored: { type: Boolean, default: false }, // Vehículos blindados
      canPickupElectric: { type: Boolean, default: false },
      
      // Para camiones
      maxTonnage: Number, // Toneladas máximas
      canPickupFurgon: { type: Boolean, default: false },
      canPickupVolqueta: { type: Boolean, default: false },
      
      // Para buses
      maxPassengers: Number
    },
    
    // ========================================
    // ESTADO ONLINE/OFFLINE
    // ========================================
    isOnline: { type: Boolean, default: false },
    lastOnlineAt: Date,
    
    // ========================================
    // ESTADÍSTICAS Y RATING
    // ========================================
    rating: { type: Number, default: 5, min: 1, max: 5 },
    totalServices: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    
    // ========================================
    // NOTIFICACIONES PUSH
    // ========================================
    fcmToken: String, // Firebase Cloud Messaging token
    
    // ========================================
    // NOTAS ADMINISTRATIVAS
    // ========================================
    adminNotes: String,
    rejectionReason: String
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Actualizar timestamp antes de guardar
userSchema.pre('save', async function(next) {
  this.updatedAt = Date.now();
  next();
});

// ========================================
// MÉTODOS PARA OTP (Clients y Drivers)
// ========================================
userSchema.methods.generateOTP = function() {
  // Por ahora OTP fijo para testing, después será aleatorio
  this.otp = {
    code: '0000',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutos
  };
  return this.otp.code;
};

userSchema.methods.verifyOTP = function(code) {
  if (!this.otp || !this.otp.code) {
    return false;
  }
  if (new Date() > this.otp.expiresAt) {
    return false;
  }
  return this.otp.code === code;
};

userSchema.methods.clearOTP = function() {
  this.otp = undefined;
  this.phoneVerified = true;
};

// ========================================
// MÉTODOS PARA CONDUCTORES
// ========================================
userSchema.methods.isDocumentationComplete = function() {
  if (this.userType !== 'driver' || !this.driverProfile) return false;
  
  const docs = this.driverProfile.documents;
  return !!(
    docs.cedula?.front && docs.cedula?.back &&
    docs.licenciaTransito?.front && docs.licenciaTransito?.back &&
    docs.soat?.url &&
    docs.tarjetaPropiedad?.front && docs.tarjetaPropiedad?.back &&
    docs.selfie &&
    this.driverProfile.vehicleCapabilities?.length > 0
  );
};

userSchema.methods.canAcceptServices = function() {
  if (this.userType !== 'driver' || !this.driverProfile) return false;
  return this.driverProfile.status === 'approved' && this.driverProfile.isOnline;
};

module.exports = mongoose.model('User', userSchema);


