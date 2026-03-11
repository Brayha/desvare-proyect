import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this._reconnectCallbacks = [];
  }

  connect() {
    // Si ya está conectado, reutilizar
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    // Si existe pero está desconectado, reconectar el mismo socket
    if (this.socket && !this.socket.connected) {
      console.log('🔄 Reconectando socket existente...');
      this.socket.connect();
      return this.socket;
    }

    console.log('🔌 Creando nueva conexión Socket.IO...');
    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'], // polling como fallback en redes malas
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,      // Nunca rendirse
      reconnectionDelay: 2000,             // Esperar 2s entre intentos
      reconnectionDelayMax: 10000,         // Máximo 10s entre intentos
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket.IO conductor conectado:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO conductor desconectado:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.warn('⚠️ Error de conexión Socket.IO:', error.message);
    });

    // Al reconectar, ejecutar todos los callbacks registrados
    // (ej: re-registrar conductor, re-suscribirse a salas)
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket.IO reconectado (intento ${attemptNumber})`);
      this._reconnectCallbacks.forEach(cb => {
        try { cb(); } catch (e) { console.warn('Error en callback de reconexión:', e); }
      });
    });

    return this.socket;
  }

  // Registrar un callback que se ejecuta cada vez que el socket reconecta
  onReconnect(callback) {
    if (!this._reconnectCallbacks.includes(callback)) {
      this._reconnectCallbacks.push(callback);
    }
  }

  offReconnect(callback) {
    this._reconnectCallbacks = this._reconnectCallbacks.filter(cb => cb !== callback);
  }

  disconnect() {
    this._reconnectCallbacks = [];
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected() {
    return this.socket && this.socket.connected;
  }

  registerDriver(driverId) {
    if (this.socket) {
      this.socket.emit('driver:register', driverId);
      console.log('🚗 Conductor registrado en socket:', driverId);
    }
  }

  notifyAvailabilityChange(driverId, isOnline) {
    if (this.socket) {
      this.socket.emit('driver:availability-changed', { driverId, isOnline });
      console.log(`📡 Disponibilidad: ${isOnline ? 'ACTIVO' : 'OCUPADO'}`);
    }
  }

  sendQuote(data) {
    if (this.socket) {
      this.socket.emit('quote:send', data);
    }
  }

  onRequestReceived(callback) {
    if (this.socket) {
      this.socket.off('request:received');
      this.socket.on('request:received', callback);
    }
  }

  offRequestReceived() {
    if (this.socket) {
      this.socket.off('request:received');
    }
  }

  onRequestCancelled(callback) {
    if (this.socket) {
      this.socket.off('request:cancelled');
      this.socket.on('request:cancelled', callback);
    }
  }

  offRequestCancelled() {
    if (this.socket) {
      this.socket.off('request:cancelled');
    }
  }

  onServiceAccepted(callback) {
    if (this.socket) {
      this.socket.off('service:accepted');
      this.socket.on('service:accepted', callback);
    }
  }

  offServiceAccepted() {
    if (this.socket) {
      this.socket.off('service:accepted');
    }
  }

  onServiceTaken(callback) {
    if (this.socket) {
      this.socket.off('service:taken');
      this.socket.on('service:taken', callback);
    }
  }

  offServiceTaken() {
    if (this.socket) {
      this.socket.off('service:taken');
    }
  }

  onQuoteExpired(callback) {
    if (this.socket) {
      this.socket.off('quote:expired');
      this.socket.on('quote:expired', callback);
    }
  }

  offQuoteExpired() {
    if (this.socket) {
      this.socket.off('quote:expired');
    }
  }

  // ========================================
  // COMPLETAR SERVICIO
  // ========================================

  completeService(data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('service:complete', data);
      console.log('📡 Evento service:complete enviado via socket');
      return true;
    } else {
      console.warn('⚠️ Socket desconectado al intentar completar servicio');
      return false;
    }
  }

  // ========================================
  // TRACKING EN TIEMPO REAL
  // ========================================

  sendLocationUpdate(data) {
    if (this.socket) {
      this.socket.emit('driver:location-update', data);
    }
  }

  onLocationUpdate(callback) {
    if (this.socket) {
      this.socket.off('driver:location-update');
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
