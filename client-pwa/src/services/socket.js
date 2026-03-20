import { io } from 'socket.io-client';

// TEMPORAL: Hardcodeado para testing - debe funcionar con variables después
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://api.desvare.app';

console.log('🔧 SOCKET_URL configurada:', SOCKET_URL);

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    // Si ya existe y está conectado, reutilizarlo
    if (this.socket && this.socket.connected) {
      console.log('🔄 Socket.IO ya está conectado, reutilizando conexión');
      return this.socket;
    }

    // Si existe pero está desconectado, reconectar
    if (this.socket && !this.socket.connected) {
      console.log('🔄 Reconectando Socket.IO...');
      this.socket.connect();
      return this.socket;
    }

    // Crear nueva conexión
    console.log('🔌 Creando nueva conexión Socket.IO...');
    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'], // polling como fallback en redes malas
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,      // Nunca rendirse
      reconnectionDelay: 2000,             // 2s entre intentos
      reconnectionDelayMax: 10000,         // Máximo 10s entre intentos
      timeout: 10000,
    });

    // Event listeners
    this.socket.on('connect', () => {
      console.log('✅ Socket.IO conectado exitosamente');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO desconectado:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión Socket.IO:', error.message);
    });

    this.socket.on('error', (error) => {
      console.error('❌ Error Socket.IO:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Desconectando Socket.IO (solo llamar al cerrar app)...');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Método para mantener conexión activa (no desconectar)
  keepAlive() {
    if (!this.socket || !this.socket.connected) {
      console.log('🔄 Socket desconectado, reconectando...');
      this.connect();
    } else {
      console.log('✅ Socket.IO conectado y activo');
    }
  }

  isConnected() {
    return this.socket && this.socket.connected;
  }

  getSocket() {
    return this.socket;
  }

  registerClient(clientId) {
    if (this.socket && this.socket.connected) {
      console.log('👤 Registrando cliente:', clientId);
      this.socket.emit('client:register', clientId);
    } else {
      console.warn('⚠️ No se puede registrar cliente: Socket no conectado');
    }
  }

  sendNewRequest(data) {
    if (this.socket && this.socket.connected) {
      console.log('📤 Enviando nueva solicitud:', data.requestId);
      this.socket.emit('request:new', data);
    } else {
      console.warn('⚠️ No se puede enviar solicitud: Socket no conectado');
    }
  }

  cancelRequest(requestId) {
    if (this.socket && this.socket.connected) {
      console.log('🚫 Cancelando solicitud:', requestId);
      this.socket.emit('request:cancel', { requestId });
    } else {
      console.warn('⚠️ No se puede cancelar solicitud: Socket no conectado');
    }
  }

  // Método para cancelar servicio con detalles completos (razón, vehículo, etc.)
  cancelServiceWithDetails(data) {
    if (this.socket && this.socket.connected) {
      console.log('🚫 Cancelando servicio con detalles:', data.requestId);
      console.log('📝 Razón:', data.reason, data.customReason || '');
      this.socket.emit('request:cancel', data);
    } else {
      console.warn('⚠️ No se puede cancelar servicio: Socket no conectado');
    }
  }

  acceptService(data) {
    if (this.socket && this.socket.connected) {
      console.log('✅ Aceptando servicio:', data.requestId);
      this.socket.emit('service:accept', data);
    } else {
      console.warn('⚠️ No se puede aceptar servicio: Socket no conectado');
    }
  }

  onQuoteReceived(callback) {
    if (this.socket) {
      // Remover listener anterior para evitar duplicados
      this.socket.off('quote:received');
      // Agregar nuevo listener
      this.socket.on('quote:received', callback);
      console.log('👂 Listener de cotizaciones registrado');
    }
  }

  offQuoteReceived() {
    if (this.socket) {
      this.socket.off('quote:received');
      console.log('🔇 Listener de cotizaciones removido');
    }
  }

  onQuoteCancelled(callback) {
    if (this.socket) {
      // Remover listener anterior para evitar duplicados
      this.socket.off('quote:cancelled');
      // Agregar nuevo listener
      this.socket.on('quote:cancelled', callback);
      console.log('👂 Listener de cancelación de cotizaciones registrado');
    }
  }

  offQuoteCancelled() {
    if (this.socket) {
      this.socket.off('quote:cancelled');
      console.log('🔇 Listener de cancelación de cotizaciones removido');
    }
  }

  // ========================================
  // COMPLETAR SERVICIO
  // ========================================
  
  onServiceCompleted(callback) {
    if (this.socket) {
      // Remover listener anterior para evitar duplicados
      this.socket.off('service:completed');
      // Agregar nuevo listener
      this.socket.on('service:completed', callback);
      console.log('👂 Listener de servicio completado registrado');
    }
  }

  offServiceCompleted() {
    if (this.socket) {
      this.socket.off('service:completed');
      console.log('🔇 Listener de servicio completado removido');
    }
  }

  // ========================================
  // 🆕 TRACKING EN TIEMPO REAL
  // ========================================
  
  sendLocationUpdate(data) {
    if (this.socket) {
      this.socket.emit('driver:location-update', data);
    }
  }

  onLocationUpdate(callback) {
    if (this.socket) {
      this.socket.off('driver:location-update'); // Evitar listeners duplicados al reconectar
      this.socket.on('driver:location-update', callback);
    }
  }

  offLocationUpdate() {
    if (this.socket) {
      this.socket.off('driver:location-update');
    }
  }
}

export default new SocketService();

