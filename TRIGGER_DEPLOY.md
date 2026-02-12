# Fix: Trigger redeploy para aplicar variables de entorno

Las variables VITE_API_URL y VITE_SOCKET_URL ya están configuradas en Vercel,
pero necesitan un nuevo build para aplicarse.

Este commit fuerza un nuevo deploy.
