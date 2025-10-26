const express = require('express');
const router = express.Router();
const Request = require('../models/Request');

// POST /api/requests/new - Crear nueva solicitud de cotización
router.post('/new', async (req, res) => {
  try {
    const { clientId, clientName } = req.body;

    // Validar campos requeridos
    if (!clientId || !clientName) {
      return res.status(400).json({ 
        error: 'clientId y clientName son requeridos' 
      });
    }

    // Crear nueva solicitud
    const request = new Request({
      clientId,
      clientName,
      status: 'pending',
      quotes: []
    });

    await request.save();

    console.log('✅ Nueva solicitud creada:', request._id);

    res.status(201).json({
      message: 'Solicitud creada exitosamente',
      requestId: request._id,
      request: {
        id: request._id,
        clientId: request.clientId,
        clientName: request.clientName,
        status: request.status,
        createdAt: request.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Error al crear solicitud:', error);
    res.status(500).json({ 
      error: 'Error al crear solicitud',
      details: error.message 
    });
  }
});

// POST /api/requests/:id/quote - Agregar cotización a una solicitud
router.post('/:id/quote', async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId, driverName, amount } = req.body;

    // Validar campos requeridos
    if (!driverId || !driverName || !amount) {
      return res.status(400).json({ 
        error: 'driverId, driverName y amount son requeridos' 
      });
    }

    // Validar que amount sea un número positivo
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ 
        error: 'amount debe ser un número positivo' 
      });
    }

    // Buscar la solicitud
    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({ 
        error: 'Solicitud no encontrada' 
      });
    }

    // Verificar si el conductor ya cotizó
    const existingQuote = request.quotes.find(
      q => q.driverId.toString() === driverId
    );

    if (existingQuote) {
      return res.status(400).json({ 
        error: 'Este conductor ya envió una cotización para esta solicitud' 
      });
    }

    // Agregar cotización
    request.quotes.push({
      driverId,
      driverName,
      amount: parseFloat(amount),
      timestamp: new Date()
    });

    // Actualizar estado a 'quoted' si era 'pending'
    if (request.status === 'pending') {
      request.status = 'quoted';
    }

    await request.save();

    console.log(`💰 Cotización agregada a solicitud ${id} por ${driverName}`);

    res.json({
      message: 'Cotización agregada exitosamente',
      request: {
        id: request._id,
        status: request.status,
        quotesCount: request.quotes.length,
        latestQuote: request.quotes[request.quotes.length - 1]
      }
    });

  } catch (error) {
    console.error('❌ Error al agregar cotización:', error);
    res.status(500).json({ 
      error: 'Error al agregar cotización',
      details: error.message 
    });
  }
});

// GET /api/requests/client/:id - Obtener solicitudes de un cliente
router.get('/client/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar todas las solicitudes del cliente
    const requests = await Request.find({ clientId: id })
      .sort({ createdAt: -1 }); // Más recientes primero

    res.json({
      message: 'Solicitudes obtenidas exitosamente',
      count: requests.length,
      requests: requests.map(req => ({
        id: req._id,
        clientName: req.clientName,
        status: req.status,
        quotesCount: req.quotes.length,
        quotes: req.quotes,
        createdAt: req.createdAt
      }))
    });

  } catch (error) {
    console.error('❌ Error al obtener solicitudes:', error);
    res.status(500).json({ 
      error: 'Error al obtener solicitudes',
      details: error.message 
    });
  }
});

// GET /api/requests/:id - Obtener una solicitud específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({ 
        error: 'Solicitud no encontrada' 
      });
    }

    res.json({
      message: 'Solicitud obtenida exitosamente',
      request: {
        id: request._id,
        clientId: request.clientId,
        clientName: request.clientName,
        status: request.status,
        quotes: request.quotes,
        createdAt: request.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Error al obtener solicitud:', error);
    res.status(500).json({ 
      error: 'Error al obtener solicitud',
      details: error.message 
    });
  }
});

module.exports = router;

