const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clientName: { type: String, required: true },
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

module.exports = mongoose.model('Request', requestSchema);
