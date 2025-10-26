import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

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

  registerClient(clientId) {
    if (this.socket) {
      this.socket.emit('client:register', clientId);
    }
  }

  sendNewRequest(data) {
    if (this.socket) {
      this.socket.emit('request:new', data);
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
}

export default new SocketService();

