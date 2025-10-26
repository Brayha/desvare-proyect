const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// POST /api/auth/register - Registrar nuevo usuario
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, userType } = req.body;

    // Validar que todos los campos estén presentes
    if (!email || !password || !name || !userType) {
      return res.status(400).json({ 
        error: 'Todos los campos son requeridos: email, password, name, userType' 
      });
    }

    // Validar tipo de usuario
    if (!['client', 'driver'].includes(userType)) {
      return res.status(400).json({ 
        error: 'userType debe ser "client" o "driver"' 
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        error: 'El email ya está registrado' 
      });
    }

    // Crear nuevo usuario (el password se hashea automáticamente en el modelo)
    const user = new User({
      email: email.toLowerCase(),
      password,
      name,
      userType
    });

    await user.save();

    // Generar JWT
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        userType: user.userType 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Retornar token y datos del usuario (sin password)
    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        userType: user.userType
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ 
      error: 'Error al registrar usuario',
      details: error.message 
    });
  }
});

// POST /api/auth/login - Iniciar sesión
router.post('/login', async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    // Validar campos
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email y password son requeridos' 
      });
    }

    // Buscar usuario por email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas' 
      });
    }

    // Verificar tipo de usuario si se proporciona
    if (userType && user.userType !== userType) {
      return res.status(401).json({ 
        error: `Este usuario no está registrado como ${userType}` 
      });
    }

    // Verificar contraseña
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas' 
      });
    }

    // Generar JWT
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        userType: user.userType 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Retornar token y datos del usuario
    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        userType: user.userType
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      error: 'Error al iniciar sesión',
      details: error.message 
    });
  }
});

module.exports = router;

