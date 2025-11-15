const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  // Relación con el usuario (cliente o conductor)
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Datos estandarizados del vehículo (desde Mercado Libre)
  category: {
    id: { type: String, required: true }, // MCO1744
    name: { type: String, required: true } // "Carros, Motos y Otros"
  },
  
  brand: {
    id: { type: String, required: true }, // "KIA"
    name: { type: String, required: true } // "Kia"
  },
  
  model: {
    id: { type: String, required: true }, // "CERATO"
    name: { type: String, required: true } // "Cerato"
  },
  
  // Datos adicionales opcionales
  year: { type: Number }, // Año del vehículo
  color: { type: String }, // Color
  licensePlate: { type: String, uppercase: true, trim: true }, // Placa
  
  // Metadata
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Índices para búsqueda rápida
vehicleSchema.index({ userId: 1 });
vehicleSchema.index({ 'brand.id': 1, 'model.id': 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);

