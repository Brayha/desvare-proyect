import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { vehicleAPI } from '../services/vehicleAPI';
import { requestNotificationPermission } from '../services/fcmService';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  const initializeAuth = useCallback(async () => {
    console.log('🔐 Inicializando autenticación...');
    setIsLoadingAuth(true);
    
    try {
      const userData = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (userData && token) {
        const parsedUser = JSON.parse(userData);
        console.log('✅ Usuario encontrado:', parsedUser.name);
        
        setUser(parsedUser);
        setIsLoggedIn(true);
        
        // Cargar vehículos automáticamente
        await loadVehicles(parsedUser.id);

        // Refrescar suscripción Web Push si ya hay permisos (iOS + Android)
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          setTimeout(() => {
            requestNotificationPermission(parsedUser.id).catch(e =>
              console.warn('⚠️ No se pudo refrescar Web Push al iniciar:', e.message)
            );
          }, 3000);
        }
      } else {
        console.log('ℹ️ No hay sesión activa');
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('❌ Error inicializando auth:', error);
      setIsLoggedIn(false);
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  // Validar sesión y cargar vehículos al iniciar la app
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const loadVehicles = async (userId) => {
    console.log('🚗 Cargando vehículos del usuario:', userId);
    setIsLoadingVehicles(true);
    
    try {
      const response = await vehicleAPI.getUserVehicles(userId);
      const vehiclesData = response.data?.data || [];
      setVehicles(vehiclesData);
      console.log(`✅ ${vehiclesData.length} vehículos cargados`);
    } catch (error) {
      console.error('❌ Error cargando vehículos:', error);
      setVehicles([]);
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  const login = async (userData) => {
    console.log('👤 Login exitoso:', userData.name);
    setUser(userData);
    setIsLoggedIn(true);
    
    // Guardar en localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Cargar vehículos
    await loadVehicles(userData.id);

    // Solicitar permisos de notificaciones después del login (con delay de 2 segundos)
    setTimeout(() => {
      const promptDismissed = localStorage.getItem('notificationPromptDismissed') === 'true';
      const hasNotificationAPI = typeof window !== 'undefined' && 'Notification' in window;

      if (hasNotificationAPI && Notification.permission === 'granted') {
        // Permisos ya concedidos → refrescar Web Push en silencio
        console.log('🔄 Refrescando suscripción Web Push en background...');
        requestNotificationPermission(userData.id).catch(e =>
          console.warn('⚠️ No se pudo refrescar Web Push:', e.message)
        );
      } else if (hasNotificationAPI && Notification.permission === 'default' && !promptDismissed) {
        console.log('🔔 Mostrando prompt de notificaciones...');
        setShowNotificationPrompt(true);
      } else {
        console.log('ℹ️ Prompt de notificaciones no necesario:', {
          promptDismissed,
          notificationAvailable: hasNotificationAPI,
          permission: hasNotificationAPI ? Notification.permission : 'N/A'
        });
      }
    }, 2000);
  };

  const logout = () => {
    console.log('👋 Cerrando sesión...');
    
    // Limpiar localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('requestData');
    localStorage.removeItem('vehicleData');
    localStorage.removeItem('currentRequestId');
    localStorage.removeItem('activeService');
    localStorage.removeItem('activeServiceStatus');
    localStorage.removeItem('completedService');
    localStorage.removeItem('quotesReceived');
    
    // Limpiar estado
    setUser(null);
    setIsLoggedIn(false);
    setVehicles([]);
    setShowNotificationPrompt(false);
  };

  const dismissNotificationPrompt = () => {
    localStorage.setItem('notificationPromptDismissed', 'true');
    setShowNotificationPrompt(false);
  };

  const refreshVehicles = async () => {
    if (user?.id) {
      await loadVehicles(user.id);
    }
  };

  /** Actualiza datos del usuario en sesión sin re-ejecutar el flujo de login. */
  const updateUser = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const value = {
    user,
    isLoggedIn,
    vehicles,
    isLoadingAuth,
    isLoadingVehicles,
    login,
    logout,
    refreshVehicles,
    updateUser,
    showNotificationPrompt,
    setShowNotificationPrompt,
    dismissNotificationPrompt,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

