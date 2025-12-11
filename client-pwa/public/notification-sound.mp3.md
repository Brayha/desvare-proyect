# Archivo de Sonido para Notificaciones

## 📁 notification-sound.mp3

Este archivo debe ser un sonido de notificación corto (1-2 segundos).

### Opciones para obtener el sonido:

1. **Descargar sonido gratuito:**
   - https://mixkit.co/free-sound-effects/notification/
   - https://www.zapsplat.com/sound-effect-categories/
   - https://freesound.org/

2. **Usar sonido del sistema:**
   - Puedes grabar el sonido de notificación de tu teléfono
   - Convertirlo a MP3

3. **Generar con IA:**
   - https://www.soundraw.io/
   - https://soundful.com/

### Características recomendadas:
- **Duración:** 1-2 segundos
- **Formato:** MP3
- **Tamaño:** < 50KB
- **Tono:** Agradable, no molesto
- **Volumen:** Moderado

### Ubicación:
Colocar el archivo en: `/client-pwa/public/notification-sound.mp3`

### Temporalmente:
El hook `useNotification.js` maneja el error si el archivo no existe, por lo que la app funcionará sin problemas hasta que agregues el sonido real.
