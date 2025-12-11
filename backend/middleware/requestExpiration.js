/**
 * Middleware para marcar solicitudes expiradas automáticamente
 */

const Request = require('../models/Request');

/**
 * Marca solicitudes expiradas como 'cancelled'
 * Se puede ejecutar periódicamente o al iniciar el servidor
 */
async function markExpiredRequests() {
  try {
    const now = new Date();
    
    const result = await Request.updateMany(
      {
        status: { $in: ['pending', 'quoted'] },
        expiresAt: { $lte: now }
      },
      {
        $set: { 
          status: 'cancelled',
          updatedAt: now
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`⏰ ${result.modifiedCount} solicitudes marcadas como expiradas`);
    }

    return result.modifiedCount;
  } catch (error) {
    console.error('❌ Error marcando solicitudes expiradas:', error);
    return 0;
  }
}

/**
 * Inicia un intervalo para verificar solicitudes expiradas
 * @param {number} intervalMinutes - Intervalo en minutos (por defecto 30)
 */
function startExpirationChecker(intervalMinutes = 30) {
  console.log(`⏰ Iniciando verificador de expiración (cada ${intervalMinutes} minutos)`);
  
  // Ejecutar inmediatamente al iniciar
  markExpiredRequests();
  
  // Ejecutar periódicamente
  const intervalMs = intervalMinutes * 60 * 1000;
  setInterval(() => {
    markExpiredRequests();
  }, intervalMs);
}

module.exports = {
  markExpiredRequests,
  startExpirationChecker
};
