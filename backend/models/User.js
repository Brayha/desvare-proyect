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
  
  // Para CLIENTS (autenticación con OTP)
  phone: {
    type: String,
    required: function() { return this.userType === 'client'; },
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
  
  // Para DRIVERS (autenticación con email+password)
  email: {
    type: String,
    required: function() { return this.userType === 'driver'; },
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() { return this.userType === 'driver'; }
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash de contraseña antes de guardar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseñas (solo para drivers)
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Métodos para OTP (solo para clients)
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

module.exports = mongoose.model('User', userSchema);


