/**
 * Punto de entrada principal para la carpeta shared
 * Exporta todos los componentes, hooks, servicios y utilidades
 */

// Componentes
export { Button, Input, Card } from './components';

// Layouts
export { default as AuthLayout } from './layouts/AuthLayout';

// Hooks
export { default as useAuth } from './hooks/useAuth';
export { default as useSocket } from './hooks/useSocket';
export { default as useToast } from './hooks/useToast';

// Servicios
export { default as api, authAPI, requestAPI, driverAPI } from './services/api';
export { default as socketService } from './services/socket';
export { default as storage } from './services/storage';

// Estilos (se importan directamente en main.jsx)
// import '@desvare/shared/styles/global.css';

