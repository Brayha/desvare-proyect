/**
 * Configuración centralizada de Firebase para Client PWA
 * 
 * INSTRUCCIONES PARA CONFIGURAR:
 * 
 * 1. Ve a Firebase Console: https://console.firebase.google.com/
 * 2. Selecciona tu proyecto (o crea uno nuevo)
 * 3. Ve a "Project Settings" (⚙️ en el sidebar)
 * 4. Scroll down hasta "Your apps" y click en "Web app" (</> icono)
 * 5. Si no has creado una app web, créala ahora
 * 6. Copia la configuración de firebaseConfig
 * 7. Ve a la pestaña "Cloud Messaging"
 * 8. En "Web Push certificates", genera un nuevo par de claves (o usa el existente)
 * 9. Copia el "Key pair" (VAPID public key)
 * 10. Pega todas las credenciales en tu archivo .env
 * 
 * IMPORTANTE: 
 * - Nunca commitees las credenciales reales a Git
 * - Usa variables de entorno (VITE_*) para configuración
 * - Este archivo lee de .env automáticamente
 */

// Leer configuración desde variables de entorno
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

// VAPID Key para Web Push
export const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

// Validar que la configuración esté completa
export const isFirebaseConfigured = () => {
  const required = [
    firebaseConfig.apiKey,
    firebaseConfig.projectId,
    firebaseConfig.messagingSenderId,
    firebaseConfig.appId,
    VAPID_KEY
  ];
  
  const isValid = required.every(value => value && value.length > 0);
  
  if (!isValid) {
    console.warn(
      '⚠️ Firebase no está completamente configurado. ' +
      'Verifica tu archivo .env y asegúrate de tener todas las variables VITE_FIREBASE_*'
    );
  }
  
  return isValid;
};

// Exportar por defecto la configuración
export default {
  firebaseConfig,
  VAPID_KEY,
  isFirebaseConfigured
};
