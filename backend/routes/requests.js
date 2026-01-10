const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const User = require('../models/User');

// POST /api/requests/new - Crear nueva solicitud de cotización
router.post('/new', async (req, res) => {
  try {
    const { 
      clientId, 
      clientName, 
      clientPhone, 
      clientEmail,
      origin,
      destination,
      distance,
      duration,
      notes,
      vehicleId,
      vehicleSnapshot,
      serviceDetails
    } = req.body;

    console.log('📦 Datos recibidos en el backend:', JSON.stringify(req.body, null, 2));

    // Validar campos requeridos básicos
    if (!clientId || !clientName) {
      return res.status(400).json({ 
        error: 'clientId y clientName son requeridos' 
      });
    }

    // Validar campos de ubicación requeridos
    if (!origin || !origin.coordinates || !origin.address) {
      return res.status(400).json({ 
        error: 'origin con coordinates y address son requeridos' 
      });
    }

    if (!destination || !destination.coordinates || !destination.address) {
      return res.status(400).json({ 
        error: 'destination con coordinates y address son requeridos' 
      });
    }

    // Validar que serviceDetails esté presente
    if (!serviceDetails || !serviceDetails.problem) {
      return res.status(400).json({ 
        error: 'serviceDetails con problem son requeridos' 
      });
    }

    // Crear nueva solicitud con todos los datos
    const request = new Request({
      clientId,
      clientName,
      clientPhone: clientPhone || 'N/A',
      clientEmail: clientEmail || 'N/A',
      origin: {
        type: 'Point',
        coordinates: origin.coordinates, // [lng, lat]
        address: origin.address
      },
      destination: {
        type: 'Point',
        coordinates: destination.coordinates, // [lng, lat]
        address: destination.address
      },
      distance: distance || 0,
      duration: duration || 0,
      notes: notes || '',
      vehicleId: vehicleId || null,
      vehicleSnapshot: vehicleSnapshot || null,
      serviceDetails: serviceDetails,
      status: 'pending',
      quotes: []
    });

    await request.save();

    console.log('✅ Nueva solicitud creada:', request._id);
    console.log('📍 Origen:', origin.address);
    console.log('📍 Destino:', destination.address);
    console.log('📏 Distancia:', distance, 'metros');
    console.log('⏱️ Duración:', duration, 'segundos');
    if (vehicleSnapshot) {
      console.log('🚗 Vehículo:', `${vehicleSnapshot.brand?.name} ${vehicleSnapshot.model?.name} (${vehicleSnapshot.licensePlate})`);
      console.log('📝 Problema:', serviceDetails?.problem);
    }

    res.status(201).json({
      message: 'Solicitud creada exitosamente',
      requestId: request._id,
      request: {
        id: request._id,
        clientId: request.clientId,
        clientName: request.clientName,
        origin: request.origin,
        destination: request.destination,
        distance: request.distance,
        duration: request.duration,
        status: request.status,
        createdAt: request.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Error al crear solicitud:', error);
    console.error('❌ Detalles del error:', error.message);
    console.error('❌ Stack:', error.stack);
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
    const { driverId, driverName, amount, location } = req.body;

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

    // Agregar cotización con ubicación del conductor
    request.quotes.push({
      driverId,
      driverName,
      amount: parseFloat(amount),
      location: location || null, // Ubicación del conductor
      timestamp: new Date()
    });

    // Actualizar estado a 'quoted' si era 'pending'
    if (request.status === 'pending') {
      request.status = 'quoted';
    }

    await request.save();

    console.log(`💰 Cotización agregada a solicitud ${id} por ${driverName}`);

    // ✅ Emitir evento de Socket.IO al cliente en tiempo real
    const io = global.io;
    const connectedClients = global.connectedClients;

    if (io && connectedClients) {
      const clientSocketId = connectedClients.get(request.clientId.toString());
      if (clientSocketId) {
        const quoteData = {
          requestId: request._id.toString(),
          driverId: driverId,
          driverName: driverName,
          amount: parseFloat(amount),
          location: location || null, // Incluir ubicación del conductor
          timestamp: new Date()
        };
        
        console.log('📤 Enviando cotización al cliente vía Socket.IO:', quoteData);
        io.to(clientSocketId).emit('quote:received', quoteData);
      } else {
        console.log('⚠️ Cliente no conectado vía Socket.IO (ID:', request.clientId.toString(), ')');
      }
    } else {
      console.log('⚠️ Socket.IO no disponible');
    }

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

// POST /api/requests/:id/accept - Aceptar una cotización específica
router.post('/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;
    const { clientId, driverId } = req.body;

    // Validar campos requeridos
    if (!clientId || !driverId) {
      return res.status(400).json({ 
        error: 'clientId y driverId son requeridos' 
      });
    }

    // Buscar la solicitud
    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({ 
        error: 'Solicitud no encontrada' 
      });
    }

    // Verificar que la solicitud pertenece al cliente
    if (request.clientId.toString() !== clientId) {
      return res.status(403).json({ 
        error: 'No tienes permiso para aceptar esta solicitud' 
      });
    }

    // Verificar que la solicitud no esté ya aceptada
    if (request.status === 'accepted') {
      return res.status(400).json({ 
        error: 'Esta solicitud ya fue aceptada' 
      });
    }

    // Verificar que el conductor haya cotizado
    const quote = request.quotes.find(q => q.driverId.toString() === driverId);
    if (!quote) {
      return res.status(404).json({ 
        error: 'El conductor no ha enviado una cotización para esta solicitud' 
      });
    }

    // Buscar al conductor
    const driver = await User.findById(driverId);
    if (!driver || driver.userType !== 'driver') {
      return res.status(404).json({ 
        error: 'Conductor no encontrado' 
      });
    }

    // Generar código de seguridad de 4 dígitos
    const securityCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Actualizar solicitud
    request.status = 'accepted';
    request.assignedDriverId = driverId;
    request.securityCode = securityCode;
    request.updatedAt = new Date();
    await request.save();

    // Cambiar conductor a OCUPADO automáticamente
    driver.driverProfile.isOnline = false;
    driver.driverProfile.currentServiceId = request._id;
    driver.driverProfile.lastOnlineAt = new Date();
    await driver.save();

    console.log(`✅ Cotización aceptada para solicitud ${id}`);
    console.log(`👤 Cliente: ${request.clientName}`);
    console.log(`🚗 Conductor asignado: ${driver.name} (ahora OCUPADO)`);
    console.log(`🔒 Código de seguridad: ${securityCode}`);

    // Preparar datos del conductor para el cliente
    const driverInfo = {
      id: driver._id,
      name: driver.name,
      phone: driver.phone,
      rating: driver.driverProfile.rating,
      totalServices: driver.driverProfile.totalServices,
      towTruck: driver.driverProfile.towTruck,
      vehicleCapabilities: driver.driverProfile.vehicleCapabilities
    };

    // Preparar lista de otros conductores que cotizaron
    const otherDriverIds = request.quotes
      .filter(q => q.driverId.toString() !== driverId)
      .map(q => q.driverId.toString());

    res.json({
      message: 'Cotización aceptada exitosamente',
      request: {
        id: request._id,
        status: request.status,
        securityCode: securityCode,
        assignedDriver: driverInfo,
        acceptedQuote: {
          amount: quote.amount,
          timestamp: quote.timestamp
        }
      },
      otherDriverIds: otherDriverIds // Para notificar por Socket.IO
    });

  } catch (error) {
    console.error('❌ Error al aceptar cotización:', error);
    res.status(500).json({ 
      error: 'Error al aceptar cotización',
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

// GET /api/requests/nearby/:driverId - Obtener solicitudes cercanas a un conductor
router.get('/nearby/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;
    
    // Buscar al conductor para obtener su ubicación y capacidades
    const driver = await User.findById(driverId);
    if (!driver || driver.userType !== 'driver') {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }

    // Verificar que el conductor esté aprobado
    if (driver.driverProfile.status !== 'approved') {
      return res.status(403).json({ 
        error: 'Conductor no está aprobado para recibir solicitudes' 
      });
    }

    // Verificar que el conductor esté activo (isOnline)
    if (!driver.driverProfile.isOnline) {
      return res.json({
        message: 'Conductor no está disponible (ocupado)',
        count: 0,
        requests: [],
        driverStatus: 'offline'
      });
    }

    // Obtener solicitudes pendientes (sin cotizar por este conductor y no expiradas)
    const now = new Date();
    const requests = await Request.find({
      status: { $in: ['pending', 'quoted'] }, // ✅ Solo pending y quoted (excluye accepted, cancelled, completed)
      'quotes.driverId': { $ne: driverId }, // No cotizadas por este conductor
      expiresAt: { $gt: now } // No expiradas
    })
    .sort({ createdAt: -1 }) // Más recientes primero
    .limit(50); // Limitar a 50 solicitudes

    console.log(`🔍 Solicitudes encontradas antes de formatear: ${requests.length}`);
    
    // Función helper para obtener iconos según categoría
    const getCategoryIcon = (categoryId) => {
      const icons = {
        'MOTOS': '🏍️',
        'AUTOS': '🚗',
        'CAMIONETAS': '🚙',
        'CAMIONES': '🚚',
        'BUSES': '🚌'
      };
      return icons[categoryId] || '🚗';
    };

    // Formatear para el frontend
    const formattedRequests = requests.map(req => ({
      id: req._id,
      requestId: req._id,
      timestamp: req.createdAt,
      
      // Cliente
      clientId: req.clientId,
      clientName: req.clientName,
      clientPhone: req.clientPhone,
      
      // Vehículo
      vehicle: req.vehicleSnapshot ? {
        category: req.vehicleSnapshot.category?.name || 'N/A',
        brand: req.vehicleSnapshot.brand?.name || 'N/A',
        model: req.vehicleSnapshot.model?.name || 'N/A',
        licensePlate: req.vehicleSnapshot.licensePlate || 'N/A',
        icon: getCategoryIcon(req.vehicleSnapshot.category?.id)
      } : null,
      
      // Ubicación
      origin: {
        address: req.origin.address,
        coordinates: req.origin.coordinates
      },
      destination: {
        address: req.destination.address,
        coordinates: req.destination.coordinates
      },
      
      // Distancia y tiempo
      distance: req.distance, // metros
      duration: req.duration, // segundos
      distanceKm: (req.distance / 1000).toFixed(1),
      durationMin: Math.round(req.duration / 60),
      
      // Problema
      problem: req.serviceDetails?.problem || 'Sin descripción',
      
      // Estado
      status: req.status,
      quotesCount: req.quotes.length,
      hasQuoted: false // Este conductor no ha cotizado
    }));

    console.log(`✅ ${formattedRequests.length} solicitudes cercanas para conductor ${driver.name}`);

    res.json({
      message: 'Solicitudes obtenidas exitosamente',
      count: formattedRequests.length,
      requests: formattedRequests
    });

  } catch (error) {
    console.error('❌ Error al obtener solicitudes cercanas:', error);
    res.status(500).json({ 
      error: 'Error al obtener solicitudes',
      details: error.message 
    });
  }
});

module.exports = router;

