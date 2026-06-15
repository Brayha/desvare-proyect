// ── Socket.IO Redis Adapter (env-gated) ──────────────────────────────────────
// Permite correr VARIOS procesos del backend (ej. PM2 en modo cluster en el
// mismo droplet, o varios droplets detrás de un balanceador) compartiendo los
// eventos de Socket.IO a través de Redis Pub/Sub.
//
// Comportamiento:
//   - Sin REDIS_URL  → no se toca nada. Socket.IO usa su adapter en memoria.
//                      El backend corre EXACTAMENTE igual que antes (1 proceso).
//   - Con REDIS_URL  → se activa el adapter Redis. Si Redis está caído, la
//                      entrega LOCAL (mismo proceso) sigue funcionando; solo se
//                      pierde la propagación entre procesos hasta que Redis vuelva.
//
// Nunca lanza para no tumbar el servidor: cualquier error cae a memoria.

const { createAdapter } = require('@socket.io/redis-adapter');
const Redis = require('ioredis');

/**
 * Conecta el adapter Redis a la instancia de Socket.IO si REDIS_URL está definida.
 * @param {import('socket.io').Server} io
 * @returns {boolean} true si el adapter Redis quedó activo
 */
function setupRedisAdapter(io) {
  const url = process.env.REDIS_URL;

  if (!url) {
    console.log('ℹ️ REDIS_URL no configurada — Socket.IO usa adapter en memoria (un solo proceso).');
    return false;
  }

  try {
    const redisOptions = {
      // El adapter necesita reintentos infinitos para reconectar tras caídas.
      maxRetriesPerRequest: null,
      retryStrategy: (times) => Math.min(times * 200, 5000),
    };

    const pubClient = new Redis(url, redisOptions);
    const subClient = pubClient.duplicate();

    // Manejadores de error: evitan "unhandled error event" que tumbaría el proceso.
    pubClient.on('error', (err) => console.error('❌ Redis (pub) error:', err.message));
    subClient.on('error', (err) => console.error('❌ Redis (sub) error:', err.message));
    pubClient.on('connect', () => console.log('✅ Redis (pub) conectado'));
    subClient.on('connect', () => console.log('✅ Redis (sub) conectado'));

    io.adapter(createAdapter(pubClient, subClient));
    console.log('✅ Socket.IO Redis adapter ACTIVADO (listo para múltiples procesos).');
    return true;
  } catch (err) {
    console.error('❌ No se pudo activar el Redis adapter, se continúa en memoria:', err.message);
    return false;
  }
}

module.exports = { setupRedisAdapter };
