import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      this.socket.on('connect', () => {
        console.log('✅ Conectado al servidor Socket.IO:', this.socket.id);
        this.isConnected = true;
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Desconectado del servidor Socket.IO');
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Error de conexión Socket.IO:', error);
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }

  // ===== EVENTOS DEL CLIENTE =====
  registerClient(clientId) {
    if (this.socket) {
      this.socket.emit('client:register', clientId);
      console.log('📝 Cliente registrado:', clientId);
    }
  }

  sendNewRequest(data) {
    if (this.socket) {
      this.socket.emit('request:new', data);
      console.log('📤 Solicitud enviada:', data);
    }
  }

  onQuoteReceived(callback) {
    if (this.socket) {
      this.socket.on('quote:received', callback);
    }
  }

  offQuoteReceived() {
    if (this.socket) {
      this.socket.off('quote:received');
    }
  }

  // ===== EVENTOS DEL CONDUCTOR =====
  registerDriver(driverId) {
    if (this.socket) {
      this.socket.emit('driver:register', driverId);
      console.log('🚗 Conductor registrado:', driverId);
    }
  }

  sendQuote(data) {
    if (this.socket) {
      this.socket.emit('quote:send', data);
      console.log('💰 Cotización enviada:', data);
    }
  }

  onRequestReceived(callback) {
    if (this.socket) {
      this.socket.on('request:received', callback);
    }
  }

  offRequestReceived() {
    if (this.socket) {
      this.socket.off('request:received');
    }
  }

  // ===== EVENTOS DE TRACKING (para futuro) =====
  sendLocationUpdate(data) {
    if (this.socket) {
      this.socket.emit('driver:location-update', data);
    }
  }

  onLocationUpdate(callback) {
    if (this.socket) {
      this.socket.on('driver:location-update', callback);
    }
  }

  offLocationUpdate() {
    if (this.socket) {
      this.socket.off('driver:location-update');
    }
  }

  // ===== MÉTODO GENÉRICO PARA EMITIR EVENTOS =====
  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  // ===== MÉTODO GENÉRICO PARA ESCUCHAR EVENTOS =====
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // ===== MÉTODO GENÉRICO PARA DEJAR DE ESCUCHAR =====
  off(event) {
    if (this.socket) {
      this.socket.off(event);
    }
  }
}

export default new SocketService();

