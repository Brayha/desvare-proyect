# Desvare Driver App

App móvil para conductores del sistema de cotizaciones Desvare.

## 🚀 Tecnologías

- React + Vite
- Ionic Framework
- Socket.IO Client
- Axios

## 📦 Instalación

```bash
npm install
```

## ⚙️ Configuración

1. Copia el archivo `.env.example` a `.env`:
```bash
cp .env.example .env
```

2. Edita `.env` y configura las URLs del backend:
   - `VITE_API_URL`: URL de la API REST
   - `VITE_SOCKET_URL`: URL del servidor Socket.IO

## 🏃 Ejecutar

### Modo desarrollo (navegador):
```bash
npm run dev
```

La app correrá en `http://localhost:5173`

### Build para producción:
```bash
npm run build
```

## 📱 Compilar para Android

### Requisitos:
- Android Studio instalado
- Java JDK 11 o superior

### Pasos:

1. Instalar Capacitor:
```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android
```

2. Inicializar Capacitor:
```bash
npx cap init
```

3. Build de la app:
```bash
npm run build
```

4. Agregar plataforma Android:
```bash
npx cap add android
```

5. Sincronizar archivos:
```bash
npx cap sync
```

6. Abrir en Android Studio:
```bash
npx cap open android
```

7. Desde Android Studio, compila y ejecuta en dispositivo/emulador

## 📱 Funcionalidades

### Autenticación
- Registro de conductor
- Inicio de sesión

### Recepción de Solicitudes
- Notificación en tiempo real de nuevas solicitudes
- Alerta visual cuando llega una solicitud
- Lista de todas las solicitudes recibidas

### Envío de Cotizaciones
- Modal para ingresar monto de cotización
- Envío en tiempo real al cliente
- Registro en base de datos
- Marcado de solicitudes respondidas

## 🔌 Comunicación en Tiempo Real

La app utiliza Socket.IO para:
- Recibir solicitudes de clientes en tiempo real
- Enviar cotizaciones instantáneamente
- Notificaciones push

## 📂 Estructura

```
src/
├── pages/
│   ├── Login.jsx       # Página de inicio de sesión
│   ├── Register.jsx    # Página de registro
│   └── Home.jsx        # Página principal (recibir solicitudes y cotizar)
├── services/
│   ├── api.js          # Cliente API REST
│   └── socket.js       # Cliente Socket.IO
└── App.jsx             # Componente principal con rutas
```

## 🎨 Características de UI

- Tema personalizado con color primary
- Alertas nativas para nuevas solicitudes
- Modal para envío de cotizaciones
- Lista de solicitudes con estado
- Badges de estado (Respondida/Pendiente)
