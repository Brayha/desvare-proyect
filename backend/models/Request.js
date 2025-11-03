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
  notes: { type: String }, // Notas adicionales del cliente
  
  // Estado y cotizaciones
  status: { 
    type: String, 
    enum: ['pending', 'quoted', 'accepted', 'rejected', 'completed'], 
    default: 'pending' 
  },
  quotes: [{
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    driverName: String,
    amount: Number,
    timestamp: { type: Date, default: Date.now }
  }],
  
  createdAt: { type: Date, default: Date.now }
});

// Crear índice geoespacial para búsquedas por proximidad
requestSchema.index({ 'origin.coordinates': '2dsphere' });
requestSchema.index({ 'destination.coordinates': '2dsphere' });

module.exports = mongoose.model('Request', requestSchema);
