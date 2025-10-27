import { useEffect, useState } from 'react';
import socketService from '../services/socket';

/**
 * Hook personalizado para manejo de Socket.IO
 * 
 * @returns {Object} { socket, isConnected, connect, disconnect }
 */
const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Conectar al montar
    const socket = socketService.connect();

    // Actualizar estado de conexión
    const updateConnectionStatus = () => {
      setIsConnected(socketService.getConnectionStatus());
    };

    socket.on('connect', updateConnectionStatus);
    socket.on('disconnect', updateConnectionStatus);

    // Cleanup al desmontar
    return () => {
      socket.off('connect', updateConnectionStatus);
      socket.off('disconnect', updateConnectionStatus);
    };
  }, []);

  const connect = () => {
    socketService.connect();
  };

  const disconnect = () => {
    socketService.disconnect();
    setIsConnected(false);
  };

  return {
    socket: socketService,
    isConnected,
    connect,
    disconnect,
  };
};

export { useSocket };
export default useSocket;

