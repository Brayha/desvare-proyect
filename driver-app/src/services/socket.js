import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log('✅ Conectado al servidor Socket.IO');
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Desconectado del servidor Socket.IO');
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  registerDriver(driverId) {
    if (this.socket) {
      this.socket.emit('driver:register', driverId);
    }
  }

  notifyAvailabilityChange(driverId, isOnline) {
    if (this.socket) {
      this.socket.emit('driver:availability-changed', { driverId, isOnline });
      console.log(`📡 Notificado cambio de disponibilidad: ${isOnline ? 'ACTIVO' : 'OCUPADO'}`);
    }
  }

  sendQuote(data) {
    if (this.socket) {
      this.socket.emit('quote:send', data);
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

  onRequestCancelled(callback) {
    if (this.socket) {
      console.log('👂 Escuchando cancelaciones de solicitudes');
      this.socket.on('request:cancelled', callback);
    }
  }

  offRequestCancelled() {
    if (this.socket) {
      console.log('🔇 Dejando de escuchar cancelaciones');
      this.socket.off('request:cancelled');
    }
  }

  onServiceAccepted(callback) {
    if (this.socket) {
      console.log('👂 Escuchando aceptaciones de servicio');
      this.socket.on('service:accepted', callback);
    }
  }

  offServiceAccepted() {
    if (this.socket) {
      console.log('🔇 Dejando de escuchar aceptaciones');
      this.socket.off('service:accepted');
    }
  }

  onServiceTaken(callback) {
    if (this.socket) {
      console.log('👂 Escuchando servicios tomados por otros');
      this.socket.on('service:taken', callback);
    }
  }

  offServiceTaken() {
    if (this.socket) {
      console.log('🔇 Dejando de escuchar servicios tomados');
      this.socket.off('service:taken');
    }
  }

  onQuoteExpired(callback) {
    if (this.socket) {
      console.log('👂 Escuchando expiraciones de cotizaciones');
      this.socket.on('quote:expired', callback);
    }
  }

  offQuoteExpired() {
    if (this.socket) {
      console.log('🔇 Dejando de escuchar expiraciones');
      this.socket.off('quote:expired');
    }
  }
}

export default new SocketService();


