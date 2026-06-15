const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    required: true,
    index: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  senderType: {
    type: String,
    enum: ['client', 'driver'],
    required: true,
  },
  senderName: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  readAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

chatMessageSchema.index({ requestId: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
