const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const User = require('../models/User');

/**
 * POST /api/tracking/location
 *
 * Recibe actualizaciones de GPS enviadas directamente por el servicio
 * nativo Java (LocationTrackingService.java) que corre en el conductor Android.
 *
 * Este endpoint es la contraparte REST del evento Socket.IO 'driver:location-update'.
 * Hace exactamente lo mismo:
 *   1. Persiste la ubicación en MongoDB
 *   2. Emite el evento Socket.IO al cliente conectado
 *
 * No requiere autenticación JWT por simplicidad: el requestId y driverId ya
 * identifican el contexto, y el endpoint solo escribe ubicación.
 */
router.post('/location', async (req, res) => {
  try {
    const { requestId, driverId, lat, lng, speed, heading, accuracy } = req.body;

    if (!requestId || !driverId || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'requestId, driverId, lat y lng son requeridos' });
    }

    const latNum  = parseFloat(lat);
    const lngNum  = parseFloat(lng);
    const speedNum   = parseFloat(speed)   || 0;
    const headingNum = parseFloat(heading) || 0;

    console.log(`📍 [GPS Nativo] Conductor ${driverId}: (${latNum.toFixed(5)}, ${lngNum.toFixed(5)}) ±${Math.round(accuracy || 0)}m`);

    // Persistir en MongoDB (misma lógica que el handler Socket.IO)
    await Request.findByIdAndUpdate(requestId, {
      'trackingData.lastDriverLocation.lat':       latNum,
      'trackingData.lastDriverLocation.lng':       lngNum,
      'trackingData.lastDriverLocation.heading':   headingNum,
      'trackingData.lastDriverLocation.speed':     speedNum,
      'trackingData.lastDriverLocation.updatedAt': new Date(),
    });

    // Emitir evento Socket.IO solo al cliente de ESTE servicio (no broadcast global)
    if (global.io) {
      const locationPayload = {
        requestId,
        driverId,
        location: { lat: latNum, lng: lngNum },
        heading:  headingNum,
        speed:    speedNum,
        accuracy: accuracy || 0,
      };

      // Buscar el socket del cliente de este servicio específico
      const request = await Request.findById(requestId)
        .select('trackingData.clientId')
        .lean();
      const clientId = request?.trackingData?.clientId;
      const clientSocketId = clientId
        ? global.connectedClients?.get(clientId.toString())
        : null;

      if (clientSocketId) {
        global.io.to(clientSocketId).emit('driver:location-update', locationPayload);
      } else {
        // Fallback: emitir solo a la sala del servicio si existe, o loguear sin broadcast
        console.log(`⚠️ [GPS Nativo] Cliente de servicio ${requestId} no conectado al socket`);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error en POST /api/tracking/location:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
