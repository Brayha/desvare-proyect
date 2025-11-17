const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  // Relación con el usuario (cliente o conductor)
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Datos básicos del vehículo
  category: {
    id: { type: String, required: true }, // "AUTOS", "MOTOS", "CAMIONES", "BUSES", "ELECTRICOS"
    name: { type: String, required: true } // "Automóviles", "Motocicletas", etc.
  },
  
  brand: {
    id: { type: String, required: true }, // "RENAULT", "KIA", etc.
    name: { type: String, required: true } // "Renault", "Kia", etc.
  },
  
  model: {
    id: { type: String, required: true }, // "LOGAN", "CERATO", etc.
    name: { type: String, required: true } // "Logan", "Cerato", etc.
  },
  
  // Placa (requerida, formato flexible: ABC-123, GIQ-79F, AB2-123)
  licensePlate: { 
    type: String, 
    required: true,
    uppercase: true, 
    trim: true,
    validate: {
      validator: function(v) {
        // Validación flexible: 2-3 caracteres alfanuméricos, guión opcional, 2-4 caracteres alfanuméricos
        return /^[A-Z0-9]{2,3}-?[A-Z0-9]{2,4}$/.test(v);
      },
      message: props => `${props.value} no es un formato de placa válido. Ejemplos: ABC-123, GIQ-79F, AB2-123`
    }
  },
  
  // Datos opcionales comunes
  year: { type: Number, min: 1900, max: new Date().getFullYear() + 1 }, // Año del vehículo
  color: { type: String }, // Color
  
  // ========================================
  // CAMPOS ESPECÍFICOS POR TIPO DE VEHÍCULO
  // ========================================
  
  // Solo para AUTOS, CAMIONETAS, ELECTRICOS
  isArmored: { 
    type: Boolean, 
    default: false 
  },
  
  // Solo para CAMIONES
  truckData: {
    type: {
      trailerType: { 
        type: String, 
        enum: ['varillaje', 'caja_metalica'],
        required: true
      },
      length: { 
        type: Number,  // metros (decimal permitido)
        min: 1,
        max: 20,
        required: true
      },
      height: { 
        type: Number,  // metros (decimal permitido)
        min: 1,
        max: 6,
        required: true
      },
      axleType: { 
        type: String, 
        enum: ['sencilla', 'doble'],
        required: true
      }
    },
    required: false,
    default: undefined  // NO crear objeto vacío por defecto
  },
  
  // Solo para BUSES
  busData: {
    type: {
      length: { 
        type: Number,  // metros (decimal permitido)
        min: 5,
        max: 20,
        required: true
      },
      height: { 
        type: Number,  // metros (decimal permitido)
        min: 2,
        max: 5,
        required: true
      },
      axleType: { 
        type: String, 
        enum: ['sencilla', 'doble'],
        required: true
      },
      passengerCapacity: { 
        type: Number,
        min: 10,
        max: 100,
        required: true
      }
    },
    required: false,
    default: undefined  // NO crear objeto vacío por defecto
  },
  
  // Metadata
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Índices para búsqueda rápida
vehicleSchema.index({ userId: 1, isActive: 1 });
vehicleSchema.index({ 'brand.id': 1, 'model.id': 1 });
vehicleSchema.index({ licensePlate: 1 });

// Método para validar que los datos específicos sean correctos según la categoría
vehicleSchema.pre('save', function(next) {
  const category = this.category?.id;
  
  // Validar que solo los vehículos correctos tengan isArmored
  if (this.isArmored && !['AUTOS', 'CAMIONETAS', 'ELECTRICOS'].includes(category)) {
    return next(new Error('Solo los autos, camionetas y eléctricos pueden ser blindados'));
  }
  
  // Validar que solo los camiones tengan truckData
  if (this.truckData && Object.keys(this.truckData).length > 0 && category !== 'CAMIONES') {
    return next(new Error('Solo los camiones pueden tener truckData'));
  }
  
  // Validar que solo los buses tengan busData
  if (this.busData && Object.keys(this.busData).length > 0 && category !== 'BUSES') {
    return next(new Error('Solo los buses pueden tener busData'));
  }
  
  next();
});

module.exports = mongoose.model('Vehicle', vehicleSchema);

