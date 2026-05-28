const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware: verifica que la petición viene de un usuario autenticado (client o driver).
 * Agrega req.user con los datos del usuario.
 */
const requireAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Acceso denegado. Se requiere autenticación.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password').lean();
    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sesión expirada. Inicia sesión nuevamente.' });
    }
    res.status(401).json({ error: 'Autenticación fallida.' });
  }
};

/**
 * Middleware: verifica que el usuario autenticado es un conductor aprobado.
 * Debe usarse DESPUÉS de requireAuth.
 */
const requireDriver = (req, res, next) => {
  if (req.user?.userType !== 'driver') {
    return res.status(403).json({ error: 'Acceso exclusivo para conductores.' });
  }
  if (req.user?.driverProfile?.status !== 'approved') {
    return res.status(403).json({ error: 'Tu cuenta de conductor aún no está aprobada.' });
  }
  next();
};

/**
 * Middleware: verifica que el usuario autenticado es un cliente.
 * Debe usarse DESPUÉS de requireAuth.
 */
const requireClient = (req, res, next) => {
  if (req.user?.userType !== 'client') {
    return res.status(403).json({ error: 'Acceso exclusivo para clientes.' });
  }
  next();
};

/**
 * Middleware: autenticación OPCIONAL.
 * Si hay token válido, agrega req.user. Si no hay token, continúa sin error.
 * Útil para endpoints que funcionan con o sin login.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password').lean();
    if (user) req.user = user;
    next();
  } catch {
    next();
  }
};

module.exports = { requireAuth, requireDriver, requireClient, optionalAuth };
