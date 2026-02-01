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
        // 🔍 Buscar información completa del conductor
        const User = require('../models/User');
        const driver = await User.findById(driverId);
        
        // 🔍 DEBUG: Ver estructura completa del conductor
        console.log('🔍 DEBUG - Conductor encontrado:', {
          id: driver?._id,
          name: driver?.name,
          userType: driver?.userType,
          tieneDriverProfile: !!driver?.driverProfile
        });
        
        if (driver?.driverProfile) {
          console.log('🔍 DEBUG - driverProfile:', {
            status: driver.driverProfile.status,
            tieneDocuments: !!driver.driverProfile.documents,
            rating: driver.driverProfile.rating,
            totalServices: driver.driverProfile.totalServices
          });
          
          if (driver.driverProfile.documents) {
            console.log('🔍 DEBUG - documents:', {
              tieneSelfie: !!driver.driverProfile.documents.selfie,
              selfie: driver.driverProfile.documents.selfie
            });
          } else {
            console.log('❌ DEBUG - NO tiene documents');
          }
        } else {
          console.log('❌ DEBUG - NO tiene driverProfile');
        }
        
        const quoteData = {
          requestId: request._id.toString(),
          driverId: driverId,
          driverName: driverName,
          amount: parseFloat(amount),
          location: location || null,
          // ✅ NUEVOS CAMPOS: Información del conductor
          driverPhoto: driver?.driverProfile?.documents?.selfie || null,
          driverRating: driver?.driverProfile?.rating || 5,
          driverServiceCount: driver?.driverProfile?.totalServices || 0,
          timestamp: new Date()
        };
        
        console.log('📤 Enviando cotización al cliente vía Socket.IO:', {
          requestId: quoteData.requestId,
          driverId: quoteData.driverId,
          driverName: quoteData.driverName,
          amount: quoteData.amount,
          driverPhoto: quoteData.driverPhoto ? `✅ ${quoteData.driverPhoto.substring(0, 50)}...` : '❌ Sin foto',
          driverRating: quoteData.driverRating,
          driverServiceCount: quoteData.driverServiceCount
        });
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

    // Marcar la cotización aceptada como 'accepted' y las demás como 'expired'
    request.quotes.forEach(q => {
      if (q.driverId.toString() === driverId) {
        q.status = 'accepted';
      } else if (q.status === 'pending') {
        q.status = 'expired';
      }
    });

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
      photo: driver.driverProfile?.documents?.selfie || null, // ✅ Foto del conductor
      rating: driver.driverProfile.rating,
      totalServices: driver.driverProfile.totalServices,
      towTruck: driver.driverProfile.towTruck,
      vehicleCapabilities: driver.driverProfile.vehicleCapabilities
    };
    
    // 🔍 DEBUG: Ver información del conductor que se enviará
    console.log('🔍 DEBUG - driverInfo preparado:', {
      id: driverInfo.id,
      name: driverInfo.name,
      tieneFoto: !!driverInfo.photo,
      photo: driverInfo.photo ? `${driverInfo.photo.substring(0, 50)}...` : '❌ Sin foto',
      rating: driverInfo.rating
    });

    // Preparar lista de otros conductores que cotizaron
    const otherDriverIds = request.quotes
      .filter(q => q.driverId.toString() !== driverId)
      .map(q => q.driverId.toString());

    // Notificar a los otros conductores que sus cotizaciones expiraron
    const io = global.io;
    const connectedDrivers = global.connectedDrivers || new Map();
    
    if (io) {
      otherDriverIds.forEach(otherDriverId => {
        const driverData = connectedDrivers.get(otherDriverId);
        if (driverData && driverData.socketId) {
          console.log(`📤 Notificando a conductor ${otherDriverId} que su cotización expiró`);
          io.to(driverData.socketId).emit('quote:expired', {
            requestId: request._id.toString(),
            reason: 'accepted_by_another',
            message: 'El cliente aceptó otra cotización'
          });
        }
      });
    }

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

// DELETE /api/requests/:requestId/quote/:driverId - Cancelar cotización del conductor
router.delete('/:requestId/quote/:driverId', async (req, res) => {
  try {
    const { requestId, driverId } = req.params;
    const { reason, customReason } = req.body;

    console.log(`🚫 Conductor ${driverId} cancelando cotización para solicitud ${requestId}`);
    console.log(`📝 Razón: ${reason}, Custom: ${customReason}`);

    // Buscar la solicitud
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ 
        error: 'Solicitud no encontrada' 
      });
    }

    // Verificar que la solicitud no esté aceptada o completada
    if (['accepted', 'in_progress', 'completed'].includes(request.status)) {
      return res.status(400).json({ 
        error: 'No puedes cancelar una cotización de un servicio ya aceptado. Debes cancelar el servicio completo.' 
      });
    }

    // Buscar la cotización del conductor
    const quoteIndex = request.quotes.findIndex(
      q => q.driverId.toString() === driverId && q.status === 'pending'
    );

    if (quoteIndex === -1) {
      return res.status(404).json({ 
        error: 'Cotización no encontrada o ya fue cancelada/aceptada' 
      });
    }

    // Guardar datos de la cotización antes de marcarla como cancelada
    const cancelledQuote = request.quotes[quoteIndex];

    // Marcar como cancelada (no eliminar, para historial)
    request.quotes[quoteIndex].status = 'cancelled';
    request.quotes[quoteIndex].cancelledAt = new Date();
    request.quotes[quoteIndex].cancellationReason = reason || null;
    request.quotes[quoteIndex].cancellationCustomReason = customReason || null;

    await request.save();

    console.log(`✅ Cotización cancelada exitosamente`);

    // Emitir evento Socket.IO al cliente
    const io = global.io;
    const connectedClients = global.connectedClients;
    
    if (io && connectedClients) {
      const clientSocketId = connectedClients.get(request.clientId.toString());
      if (clientSocketId) {
        const cancelData = {
          requestId: requestId,
          quoteId: cancelledQuote._id.toString(),
          driverId: driverId,
          driverName: cancelledQuote.driverName,
          amount: cancelledQuote.amount,
          reason: reason,
          customReason: customReason,
          timestamp: new Date()
        };
        
        console.log('📤 Enviando evento quote:cancelled al cliente:', cancelData);
        io.to(clientSocketId).emit('quote:cancelled', cancelData);
      } else {
        console.log('⚠️ Cliente no conectado vía Socket.IO');
      }
    }

    res.json({
      message: 'Cotización cancelada exitosamente',
      quote: {
        id: cancelledQuote._id,
        status: 'cancelled',
        cancelledAt: request.quotes[quoteIndex].cancelledAt,
        reason: reason,
        customReason: customReason
      }
    });

  } catch (error) {
    console.error('❌ Error al cancelar cotización:', error);
    res.status(500).json({ 
      error: 'Error al cancelar cotización',
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

    // ✅ Enriquecer las cotizaciones con datos del conductor
    const enrichedQuotes = await Promise.all(
      request.quotes.map(async (quote) => {
        try {
          const driver = await User.findById(quote.driverId);
          return {
            ...quote.toObject(),
            // Agregar información del conductor
            driverPhoto: driver?.driverProfile?.documents?.selfie || null,
            driverRating: driver?.driverProfile?.rating || 5,
            driverServiceCount: driver?.driverProfile?.totalServices || 0
          };
        } catch (error) {
          console.error('Error al obtener datos del conductor:', quote.driverId, error);
          // Si falla, devolver la cotización sin los datos extras
          return quote.toObject();
        }
      })
    );

    res.json({
      message: 'Solicitud obtenida exitosamente',
      request: {
        id: request._id,
        requestId: request._id,
        clientId: request.clientId,
        clientName: request.clientName,
        clientPhone: request.clientPhone,
        status: request.status,
        
        // Ubicaciones
        origin: {
          address: request.origin.address,
          coordinates: request.origin.coordinates
        },
        destination: {
          address: request.destination.address,
          coordinates: request.destination.coordinates
        },
        
        // Distancia y tiempo
        distance: request.distance,
        duration: request.duration,
        distanceKm: (request.distance / 1000).toFixed(1),
        durationMin: Math.round(request.duration / 60),
        
        // Vehículo
        vehicleSnapshot: request.vehicleSnapshot,
        
        // Detalles del servicio
        serviceDetails: request.serviceDetails,
        
        // Cotizaciones enriquecidas
        quotes: enrichedQuotes,
        quotesCount: enrichedQuotes.length,
        
        // Timestamps
        createdAt: request.createdAt,
        expiresAt: request.expiresAt
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

    // Obtener solicitudes pendientes y cotizadas por este conductor (no expiradas)
    const now = new Date();
    const requests = await Request.find({
      status: { $in: ['pending', 'quoted'] }, // ✅ Solo pending y quoted (excluye accepted, cancelled, completed)
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
    const formattedRequests = requests
      .map(req => ({
        id: req._id,
        requestId: req._id,
        timestamp: req.createdAt,
        
        // Cliente
        clientId: req.clientId,
        clientName: req.clientName,
        clientPhone: req.clientPhone,
        
        // Vehículo (datos básicos para compatibilidad)
        vehicle: req.vehicleSnapshot ? {
          category: req.vehicleSnapshot.category?.name || 'N/A',
          brand: req.vehicleSnapshot.brand?.name || 'N/A',
          model: req.vehicleSnapshot.model?.name || 'N/A',
          licensePlate: req.vehicleSnapshot.licensePlate || 'N/A',
          icon: getCategoryIcon(req.vehicleSnapshot.category?.id)
        } : null,
        
        // Vehículo snapshot completo (con datos adicionales de camiones/buses)
        vehicleSnapshot: req.vehicleSnapshot,
        
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
        
        // ✅ IMPORTANTE: Incluir quotes para que el frontend sepa si ya cotizó
        quotes: req.quotes.map(q => ({
          driverId: q.driverId,
          driverName: q.driverName,
          amount: q.amount,
          timestamp: q.timestamp,
          status: q.status
        }))
      }))
      // ✅ FILTRAR: No mostrar si mi cotización está cancelled o accepted
      .filter(req => {
        const myQuote = req.quotes.find(q => q.driverId.toString() === driverId);
        
        // Si no he cotizado, mostrar
        if (!myQuote) return true;
        
        // Si mi cotización está cancelled o accepted, NO mostrar
        if (myQuote.status === 'cancelled' || myQuote.status === 'accepted') {
          console.log(`🚫 Filtrando request ${req.requestId} - Quote status: ${myQuote.status}`);
          return false;
        }
        
        // Si está pending, mostrar
        return true;
      });

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

// ========================================
// POST /api/requests/:id/complete - Completar servicio
// ========================================
router.post('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId, completedAt } = req.body;
    
    console.log(`✅ Completando servicio ${id} por conductor ${driverId}`);
    
    const request = await Request.findById(id);
    
    if (!request) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }
    
    // Verificar que el conductor que completa es el asignado
    if (request.assignedDriverId?.toString() !== driverId?.toString()) {
      return res.status(403).json({ 
        error: 'No autorizado. Solo el conductor asignado puede completar el servicio.' 
      });
    }
    
    // Actualizar estado a completado
    request.status = 'completed';
    request.completedAt = completedAt || new Date();
    request.completedBy = driverId;
    request.updatedAt = new Date();
    
    await request.save();
    
    console.log(`✅ Servicio ${id} marcado como completado`);
    
    res.json({
      message: 'Servicio completado exitosamente',
      request: {
        id: request._id,
        status: request.status,
        completedAt: request.completedAt,
        clientId: request.clientId
      }
    });
    
  } catch (error) {
    console.error('❌ Error al completar servicio:', error);
    res.status(500).json({ 
      error: 'Error al completar servicio',
      details: error.message 
    });
  }
});

// ========================================
// POST /api/requests/:id/rate - Calificar servicio
// ========================================
router.post('/:id/rate', async (req, res) => {
  try {
    const { id } = req.params;
    const { stars, comment, tip } = req.body;
    
    console.log(`⭐ Calificando servicio ${id}:`, { stars, comment, tip });
    
    // Validar calificación
    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({ 
        error: 'La calificación debe estar entre 1 y 5 estrellas' 
      });
    }
    
    const request = await Request.findById(id);
    
    if (!request) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }
    
    // Verificar que el servicio esté completado
    if (request.status !== 'completed') {
      return res.status(400).json({ 
        error: 'Solo se pueden calificar servicios completados' 
      });
    }
    
    // Verificar que no haya sido calificado previamente
    if (request.rating && request.rating.ratedAt) {
      return res.status(400).json({ 
        error: 'Este servicio ya fue calificado' 
      });
    }
    
    // Actualizar calificación
    request.rating = {
      stars: stars,
      comment: comment || null,
      tip: tip || 0,
      ratedAt: new Date()
    };
    request.updatedAt = new Date();
    
    await request.save();
    
    console.log(`✅ Servicio ${id} calificado con ${stars} estrellas`);
    
    // ========================================
    // ACTUALIZAR PERFIL DEL CONDUCTOR
    // ========================================
    
    // Buscar al conductor asignado
    const driverId = request.assignedDriverId || request.completedBy;
    
    if (driverId) {
      try {
        const driver = await User.findById(driverId);
        
        if (driver && driver.driverProfile) {
          console.log(`📊 Actualizando perfil del conductor ${driver.name}...`);
          
          // 1. Calcular nuevo promedio de rating
          const allRatings = await Request.find({
            $or: [
              { assignedDriverId: driverId },
              { completedBy: driverId }
            ],
            'rating.stars': { $exists: true, $ne: null }
          }).select('rating.stars');
          
          const totalRatings = allRatings.length;
          const sumRatings = allRatings.reduce((sum, r) => sum + r.rating.stars, 0);
          const newAverage = totalRatings > 0 ? (sumRatings / totalRatings) : 5;
          
          // 2. Actualizar rating promedio
          driver.driverProfile.rating = Math.round(newAverage * 10) / 10; // Redondear a 1 decimal
          
          // 3. Incrementar totalServices (solo si es la primera calificación de este servicio)
          if (!request.rating || !request.rating.ratedAt) {
            driver.driverProfile.totalServices = (driver.driverProfile.totalServices || 0) + 1;
          }
          
          // 4. Actualizar totalEarnings
          const amount = request.quotes?.find(q => q.driverId?.toString() === driverId.toString())?.amount || 0;
          driver.driverProfile.totalEarnings = (driver.driverProfile.totalEarnings || 0) + amount;
          
          await driver.save();
          
          console.log(`✅ Perfil del conductor actualizado:`);
          console.log(`   - Rating: ${driver.driverProfile.rating} ⭐ (${totalRatings} servicios)`);
          console.log(`   - Total Servicios: ${driver.driverProfile.totalServices}`);
          console.log(`   - Total Ganancias: $${driver.driverProfile.totalEarnings.toLocaleString()}`);
        } else {
          console.log(`⚠️ Conductor ${driverId} no encontrado o sin perfil`);
        }
      } catch (driverError) {
        // No fallar el request si hay error al actualizar el conductor
        console.error('❌ Error al actualizar perfil del conductor:', driverError);
      }
    } else {
      console.log('⚠️ No se encontró conductor asignado para actualizar perfil');
    }
    
    res.json({
      message: 'Calificación registrada exitosamente',
      rating: request.rating
    });
    
  } catch (error) {
    console.error('❌ Error al calificar servicio:', error);
    res.status(500).json({ 
      error: 'Error al registrar calificación',
      details: error.message 
    });
  }
});

module.exports = router;

