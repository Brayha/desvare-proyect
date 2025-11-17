import React, { createContext, useState, useEffect, useContext } from 'react';
import { vehicleAPI } from '../services/vehicleAPI';

const AuthContext = createContext();

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

  // Validar sesión y cargar vehículos al iniciar la app
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
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
  };

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
  };

  const logout = () => {
    console.log('👋 Cerrando sesión...');
    
    // Limpiar localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('requestData');
    localStorage.removeItem('vehicleData');
    localStorage.removeItem('currentRequestId');
    
    // Limpiar estado
    setUser(null);
    setIsLoggedIn(false);
    setVehicles([]);
  };

  const refreshVehicles = async () => {
    if (user?.id) {
      await loadVehicles(user.id);
    }
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

