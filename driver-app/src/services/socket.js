import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://api.desvare.app';

class SocketService {
  constructor() {
    this.socket = null;
    this._reconnectCallbacks = [];
    this._pendingLocationUpdate = null; // Última ubicación pendiente de enviar al reconectar
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
    const token = localStorage.getItem('token') || '';
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['polling', 'websocket'], // polling primero: más compatible con iOS y proxies de redes móviles
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

    // Al reconectar: ejecutar callbacks y enviar ubicación pendiente si la hay
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket.IO reconectado (intento ${attemptNumber})`);
      this._reconnectCallbacks.forEach(cb => {
        try { cb(); } catch (e) { console.warn('Error en callback de reconexión:', e); }
      });
      // Enviar la última ubicación que no pudo enviarse mientras estaba desconectado
      if (this._pendingLocationUpdate) {
        console.log('📡 Enviando ubicación pendiente tras reconexión...');
        this.socket.emit('driver:location-update', this._pendingLocationUpdate);
        this._pendingLocationUpdate = null;
      }
    });

    return this.socket;
  }

  // Actualizar el token JWT del socket (llamar después de login/refresh de token)
  updateAuth() {
    const token = localStorage.getItem('token') || '';
    if (this.socket) {
      this.socket.auth = { token };
      if (this.socket.connected) {
        this.socket.disconnect().connect();
      }
    }
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

  // Patrón: on(callback) registra SOLO ese callback; off(callback) elimina SOLO ese callback.
  // Esto permite que múltiples páginas (ej. Home + QuoteDetail en el stack de Ionic)
  // tengan sus propios listeners sin pisarse entre sí.

  onRequestReceived(callback) {
    if (this.socket) {
      this.socket.off('request:received', callback);
      this.socket.on('request:received', callback);
    }
  }

  offRequestReceived(callback) {
    if (this.socket && callback) {
      this.socket.off('request:received', callback);
    }
  }

  onRequestCancelled(callback) {
    if (this.socket) {
      this.socket.off('request:cancelled', callback);
      this.socket.on('request:cancelled', callback);
    }
  }

  offRequestCancelled(callback) {
    if (this.socket && callback) {
      this.socket.off('request:cancelled', callback);
    }
  }

  onServiceAccepted(callback) {
    if (this.socket) {
      this.socket.off('service:accepted', callback);
      this.socket.on('service:accepted', callback);
    }
  }

  offServiceAccepted(callback) {
    if (this.socket && callback) {
      this.socket.off('service:accepted', callback);
    }
  }

  onServiceTaken(callback) {
    if (this.socket) {
      this.socket.off('service:taken', callback);
      this.socket.on('service:taken', callback);
    }
  }

  offServiceTaken(callback) {
    if (this.socket && callback) {
      this.socket.off('service:taken', callback);
    }
  }

  onQuoteExpired(callback) {
    if (this.socket) {
      this.socket.off('quote:expired', callback);
      this.socket.on('quote:expired', callback);
    }
  }

  offQuoteExpired(callback) {
    if (this.socket && callback) {
      this.socket.off('quote:expired', callback);
    }
  }

  // Notificar al backend que el código fue validado correctamente.
  // El backend verifica el código y emite service:started al cliente si es correcto.
  notifyCodeValidated(data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('service:code-validated', data);
      console.log('🔑 Evento service:code-validated enviado al backend');
    } else {
      console.warn('⚠️ Socket desconectado al validar código');
    }
  }

  // Escuchar rechazo de código inválido desde el servidor
  onCodeInvalid(callback) {
    if (this.socket) {
      this.socket.off('service:code-invalid');
      this.socket.on('service:code-invalid', callback);
    }
  }

  offCodeInvalid() {
    if (this.socket) {
      this.socket.off('service:code-invalid');
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
    // Guardar siempre como última ubicación pendiente (útil para reenviar al reconectar)
    this._pendingLocationUpdate = data;

    if (!this.socket) {
      console.log('🔄 Socket null en tracking GPS — recreando conexión...');
      this.connect();
      return;
    }
    if (this.socket.connected) {
      this.socket.emit('driver:location-update', data);
      this._pendingLocationUpdate = null; // enviado con éxito
    } else {
      console.log('🔄 Socket desconectado durante tracking — reconectando...');
      this.socket.connect();
      // _pendingLocationUpdate queda guardado; se enviará en el evento 'reconnect'
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

  // El conductor cancela un servicio en curso (por emergencia o imposibilidad de continuar)
  cancelService(data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('request:cancel', { ...data, cancelledBy: 'driver' });
      console.log('🚫 Evento request:cancel (conductor) enviado al backend');
      return true;
    } else {
      console.warn('⚠️ Socket desconectado al intentar cancelar servicio');
      return false;
    }
  }

  // Evento directo cuando el cliente cancela un servicio que el conductor ya aceptó
  onServiceCancelled(callback) {
    if (this.socket) {
      this.socket.off('service:cancelled');
      this.socket.on('service:cancelled', callback);
    }
  }

  offServiceCancelled() {
    if (this.socket) {
      this.socket.off('service:cancelled');
    }
  }

  // ========================================
  // 💬 CHAT EN TIEMPO REAL
  // ========================================

  sendChatMessage(data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('chat:message', data);
    }
  }

  onChatMessage(callback) {
    if (this.socket) {
      this.socket.on('chat:message', callback);
    }
  }

  offChatMessage(callback) {
    if (this.socket) {
      if (callback) {
        this.socket.off('chat:message', callback);
      } else {
        this.socket.off('chat:message');
      }
    }
  }
}

export default new SocketService();
