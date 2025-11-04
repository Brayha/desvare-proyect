import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

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
      transports: ['websocket', 'polling'], // Agregar polling como fallback
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
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
      console.log('🔌 Desconectando Socket.IO...');
      this.socket.disconnect();
      this.socket = null;
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
}

export default new SocketService();

