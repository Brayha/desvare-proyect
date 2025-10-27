import { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import storage from '../services/storage';

/**
 * Hook personalizado para manejo de autenticación
 * 
 * @returns {Object} { user, isAuthenticated, login, register, logout, loading, error }
 */
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar si hay usuario en localStorage al montar
  useEffect(() => {
    const storedUser = storage.getUser();
    const token = storage.getToken();
    
    if (storedUser && token) {
      setUser(storedUser);
      setIsAuthenticated(true);
    }
    
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.login(credentials);
      const { token, user: userData } = response.data;
      
      storage.setSession(token, userData);
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true, user: userData };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error al iniciar sesión';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.register(userData);
      const { token, user: newUser } = response.data;
      
      storage.setSession(token, newUser);
      setUser(newUser);
      setIsAuthenticated(true);
      
      return { success: true, user: newUser };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error al registrarse';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    storage.clearSession();
    setUser(null);
    setIsAuthenticated(false);
  };

  return {
    user,
    isAuthenticated,
    login,
    register,
    logout,
    loading,
    error,
  };
};

export { useAuth };
export default useAuth;

