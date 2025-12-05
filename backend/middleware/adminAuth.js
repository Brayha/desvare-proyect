const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

/**
 * Middleware para verificar que el usuario es admin
 */
const requireAdmin = async (req, res, next) => {
  try {
    // Obtener token del header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Acceso denegado. Token no proporcionado.' 
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'desvare-secret-key-2024');
    
    // Verificar que es admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Acceso denegado. Se requieren permisos de administrador.' 
      });
    }

    // Buscar admin en DB
    const admin = await Admin.findById(decoded.id);
    
    if (!admin || !admin.isActive) {
      return res.status(401).json({ 
        error: 'Admin no encontrado o inactivo.' 
      });
    }

    // Agregar admin al request
    req.admin = admin;
    next();
    
  } catch (error) {
    console.error('❌ Error en autenticación admin:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido.' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado.' });
    }
    
    res.status(401).json({ error: 'Autenticación fallida.' });
  }
};

module.exports = { requireAdmin };

