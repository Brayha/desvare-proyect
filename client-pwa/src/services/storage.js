/**
 * Servicio para manejo de localStorage con helpers útiles
 */

const storage = {
  // ===== TOKEN =====
  setToken: (token) => {
    localStorage.setItem('token', token);
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  removeToken: () => {
    localStorage.removeItem('token');
  },

  // ===== USUARIO =====
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
  },

  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  removeUser: () => {
    localStorage.removeItem('user');
  },

  // ===== SESIÓN COMPLETA =====
  setSession: (token, user) => {
    storage.setToken(token);
    storage.setUser(user);
  },

  clearSession: () => {
    storage.removeToken();
    storage.removeUser();
  },

  isAuthenticated: () => {
    return !!storage.getToken();
  },

  // ===== GENÉRICOS =====
  set: (key, value) => {
    if (typeof value === 'object') {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.setItem(key, value);
    }
  },

  get: (key) => {
    const value = localStorage.getItem(key);
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  },

  remove: (key) => {
    localStorage.removeItem(key);
  },

  clear: () => {
    localStorage.clear();
  },
};

export default storage;

