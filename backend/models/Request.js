const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  // Información del cliente
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clientName: { type: String, required: true },
  clientPhone: { type: String },
  clientEmail: { type: String },
  
  // Información de ubicación y ruta
  origin: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  destination: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  
  // Detalles de la ruta
  distance: { type: Number }, // en metros
  duration: { type: Number }, // en segundos
  
  // ========================================
  // INFORMACIÓN DEL VEHÍCULO
  // ========================================
  
  // Referencia al vehículo (si está guardado, null si es temporal)
  vehicleId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Vehicle',
    default: null
  },
  
  // Snapshot del vehículo (guardamos los datos para historial)
  vehicleSnapshot: {
    category: {
      id: String,
      name: String
    },
    brand: {
      id: String,
      name: String
    },
    model: {
      id: String,
      name: String
    },
    licensePlate: String,
    year: Number,
    color: String,
    isArmored: Boolean,
    
    // Datos de camiones
    truckData: {
      trailerType: String,
      length: Number,
      height: Number,
      axleType: String
    },
    
    // Datos de buses
    busData: {
      length: Number,
      height: Number,
      axleType: String,
      passengerCapacity: Number
    }
  },
  
  // ========================================
  // DETALLES DEL SERVICIO ACTUAL
  // ========================================
  
  serviceDetails: {
    // Problema actual (REQUERIDO para todos)
    problem: { 
      type: String, 
      required: true,
      maxlength: 500,
      trim: true
    },
    
    // Sótano (para MOTOS, AUTOS y CAMIONETAS)
    basement: {
      isInBasement: { 
        type: Boolean, 
        default: false 
      },
      level: { 
        type: Number,  // -1, -2, -3, etc.
        min: -10,
        max: -1,
        validate: {
          validator: function(v) {
            // Solo validar si isInBasement es true
            if (this.basement && this.basement.isInBasement) {
              return v !== null && v !== undefined;
            }
            return true;
          },
          message: 'El nivel del sótano es requerido cuando el vehículo está en un sótano'
        }
      }
    },
    
    // Estado actual del camión (SOLO CAMIONES)
    truckCurrentState: {
      isLoaded: { 
        type: Boolean, 
        default: false 
      },
      currentWeight: { 
        type: Number,  // toneladas (decimal permitido)
        min: 0.5,
        max: 50,
        validate: {
          validator: function(v) {
            // Solo validar si isLoaded es true
            if (this.truckCurrentState && this.truckCurrentState.isLoaded) {
              return v !== null && v !== undefined && v > 0;
            }
            return true;
          },
          message: 'El peso es requerido cuando el camión está cargado'
        }
      }
    }
  },
  
  // Estado y cotizaciones
  status: { 
    type: String, 
    enum: ['pending', 'quoted', 'accepted', 'in_progress', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  quotes: [{
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    driverName: String,
    amount: Number,
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number] // [lng, lat]
    },
    timestamp: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'cancelled', 'expired'],
      default: 'pending'
    },
    cancelledAt: { type: Date, default: null },
    cancellationReason: {
      type: String,
      enum: ['no_puedo_atender', 'error_monto', 'muy_lejos', 'cliente_sospechoso', 'otro', null],
      default: null
    },
    cancellationCustomReason: {
      type: String,
      maxlength: 200,
      default: null
    }
  }],
  
  // Conductor asignado (cuando se acepta una cotización)
  assignedDriverId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null
  },
  
  // Código de seguridad (generado al confirmar servicio)
  securityCode: { 
    type: String,
    length: 4
  },
  
  // Expiración de la solicitud (24 horas por defecto)
  expiresAt: { 
    type: Date, 
    default: function() {
      return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
    }
  },
  
  // Información de cancelación
  cancelledAt: { 
    type: Date,
    default: null
  },
  cancellationReason: {
    type: String,
    enum: ['resuelto', 'conductor_no_viene', 'conductor_no_responde', 'otra_grua', 'muy_caro', 'muy_lejos', 'otro', null],
    default: null
  },
  cancellationCustomReason: {
    type: String,
    maxlength: 200,
    default: null
  },
  
  // ========================================
  // INFORMACIÓN DE FINALIZACIÓN DEL SERVICIO
  // ========================================
  
  // Finalización del servicio
  completedAt: { 
    type: Date,
    default: null
  },
  completedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null
  },
  
  // ========================================
  // CALIFICACIÓN DEL CLIENTE
  // ========================================
  
  rating: {
    stars: { 
      type: Number, 
      min: 1, 
      max: 5,
      default: null
    },
    comment: { 
      type: String, 
      maxlength: 500,
      default: null
    },
    tip: { 
      type: Number, 
      default: 0,
      min: 0
    },
    ratedAt: { 
      type: Date,
      default: null
    }
  },
  
  // ========================================
  // TIMESTAMPS DEL FLUJO DEL SERVICIO
  // ========================================
  
  // Cuando el cliente aceptó una cotización
  acceptedAt: { 
    type: Date, 
    default: null 
  },
  
  // Cuando el conductor inició el servicio (llegó al origen)
  startedAt: { 
    type: Date, 
    default: null 
  },
  
  // Cuando el conductor llegó al origen (validó código)
  arrivedAtOriginAt: { 
    type: Date, 
    default: null 
  },
  
  // Cuando el conductor llegó al destino
  arrivedAtDestinationAt: { 
    type: Date, 
    default: null 
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Crear índice geoespacial para búsquedas por proximidad
requestSchema.index({ 'origin.coordinates': '2dsphere' });
requestSchema.index({ 'destination.coordinates': '2dsphere' });

module.exports = mongoose.model('Request', requestSchema);
