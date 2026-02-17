# 🚀 Próximos Pasos - Roadmap Desvare

## ✅ SPRINT 0 - COMPLETADO ✨

### Lo que se logró:
- ✅ Carpeta `shared/` con estructura completa
- ✅ 3 componentes reutilizables (Button, Input, Card)
- ✅ 1 layout compartido (AuthLayout)
- ✅ 3 hooks personalizados (useAuth, useSocket, useToast)
- ✅ 3 servicios mejorados (api, socket, storage)
- ✅ Estilos y tema unificado
- ✅ Path aliases configurados
- ✅ Login y Register refactorizados en ambas apps
- ✅ Documentación completa

---

## 📦 SPRINT 1 - Integración Mapbox + Geolocalización

### Duración Estimada: 2-3 semanas

### 🎯 Objetivos:

#### 1. Setup Mapbox (Día 1-2)
- [ ] Crear cuenta en Mapbox (https://www.mapbox.com/)
- [ ] Obtener Access Token
- [ ] Configurar en `.env` de ambas apps
- [ ] Instalar dependencias:
  ```bash
  npm install mapbox-gl react-map-gl
  ```

#### 2. Componente MapPicker Shared (Día 3-5)
- [ ] Crear `shared/components/Map/MapPicker.jsx`
- [ ] Mapa con estilo personalizado
- [ ] Marcador de ubicación actual (origen)
- [ ] Marcador de destino (arrastrable)
- [ ] Geocoding para búsqueda de direcciones
- [ ] Trazado de ruta entre puntos
- [ ] Cálculo de distancia y tiempo

Estructura:
```javascript
<MapPicker
  originLabel="¿Dónde estás?"
  destinationLabel="¿A dónde vas?"
  onRouteCalculated={(routeData) => {
    // routeData: { distance, duration, coordinates }
  }}
/>
```

#### 3. Geolocalización del Navegador (Día 6-7)
- [ ] Hook `useGeolocation` en `shared/hooks/`
- [ ] Solicitar permisos de ubicación
- [ ] Manejo de errores (permisos denegados)
- [ ] Obtener coordenadas actuales
- [ ] Actualización continua de posición

```javascript
const { location, loading, error, requestLocation } = useGeolocation();
```

#### 4. Nueva Página RequestService (Día 8-12)
- [ ] Crear `client-pwa/src/pages/RequestService.jsx`
- [ ] **Paso 1:** Mapa para seleccionar origen y destino
- [ ] **Paso 2:** Información del vehículo (siguiente sprint)
- [ ] **Paso 3:** Autenticación (ya existe)
- [ ] **Paso 4:** Resumen y búsqueda
- [ ] Stepper/Progress bar para indicar paso actual

#### 5. Backend - Geolocalización (Día 13-14)
- [ ] Agregar campos `location` a modelo Request:
  ```javascript
  origin: {
    type: { type: String, default: 'Point' },
    coordinates: [Number], // [lng, lat]
    address: String
  },
  destination: {
    type: { type: String, default: 'Point' },
    coordinates: [Number],
    address: String
  },
  distance: Number, // en metros
  duration: Number, // en segundos
  ```
- [ ] Crear índice geoespacial:
  ```javascript
  RequestSchema.index({ 'origin.location': '2dsphere' });
  ```

#### 6. Integración con Flow Existente (Día 15-16)
- [ ] Actualizar Home para usar RequestService
- [ ] Pasar datos de ruta al crear solicitud
- [ ] Mostrar ruta en mapa cuando conductor acepta
- [ ] Tracking de ubicación del conductor

### 📁 Archivos a Crear:

```
shared/
├── components/
│   └── Map/
│       ├── MapPicker.jsx          ← Componente principal
│       ├── MapPicker.css
│       ├── LocationMarker.jsx     ← Marcador personalizado
│       └── RouteLayer.jsx         ← Capa de ruta
│
├── hooks/
│   └── useGeolocation.js          ← Hook de geolocalización
│
└── utils/
    ├── mapbox.js                  ← Helpers de Mapbox
    └── geocoding.js               ← Búsqueda de direcciones

client-pwa/src/
└── pages/
    └── RequestService.jsx         ← Nueva página

backend/
└── models/
    └── Request.js                 ← Actualizar modelo
```

### 🔑 APIs Necesarias:

1. **Mapbox Geocoding API** - Buscar direcciones
2. **Mapbox Directions API** - Calcular rutas
3. **Mapbox Static Images API** - Miniaturas de mapas (opcional)
4. **Browser Geolocation API** - Ubicación del usuario

### 💰 Costos Estimados (Mapbox):

- **Gratis:** Hasta 50,000 requests/mes
- **Carga de mapa:** Gratis hasta 50k cargas
- **Geocoding:** Gratis hasta 100k requests
- **Directions:** Gratis hasta 50k requests

**Para MVP:** Todo entra en tier gratuito ✅

### 🎨 Diseño de UI:

```
┌─────────────────────────────────────────┐
│  📍 ¿Dónde estás?                      │
│  [Usar mi ubicación actual] [Buscar]   │
│  ┌───────────────────────────────────┐ │
│  │                                   │ │
│  │         MAPA INTERACTIVO          │ │
│  │                                   │ │
│  │   📍 Origen (punto azul)          │ │
│  │   ━━━━━━ Ruta (línea)             │ │
│  │   📌 Destino (punto rojo)         │ │
│  │                                   │ │
│  └───────────────────────────────────┘ │
│                                         │
│  📌 ¿A dónde vas?                      │
│  [Buscar dirección...]                 │
│                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  📏 Distancia: 15.5 km                 │
│  ⏱️  Tiempo aprox: 25 min              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                         │
│  [Continuar →]                         │
└─────────────────────────────────────────┘
```

---

## 📦 SPRINT 2 - Formulario Dinámico de Vehículo

### Duración Estimada: 2 semanas

### 🎯 Objetivos:

#### 1. Selector de Tipo de Vehículo
- [ ] Componente con iconos visuales
- [ ] 5 tipos: Moto, Carro, Camioneta, Bus, Camión
- [ ] Cards clickeables con animación

#### 2. Formularios Específicos por Tipo
- [ ] Formulario para Moto
- [ ] Formulario para Carro
- [ ] Formulario para Camioneta
- [ ] Formulario para Bus
- [ ] Formulario para Camión
- [ ] Campos dinámicos según tipo

#### 3. Integración API Mercado Libre
- [ ] Endpoint para obtener marcas
- [ ] Endpoint para obtener modelos por marca
- [ ] Select con autocomplete
- [ ] Cache de resultados

#### 4. Validaciones Específicas
- [ ] Validación de placa (formato colombiano)
- [ ] Validación de peso (solo camiones)
- [ ] Validación de dimensiones
- [ ] Validación de capacidad (buses)

### 📁 Archivos a Crear:

```
shared/
├── components/
│   ├── VehicleSelector/
│   │   ├── VehicleSelector.jsx
│   │   ├── VehicleCard.jsx
│   │   └── VehicleSelector.css
│   │
│   └── VehicleForm/
│       ├── VehicleForm.jsx
│       ├── MotorcycleForm.jsx
│       ├── CarForm.jsx
│       ├── TruckForm.jsx
│       ├── BusForm.jsx
│       └── forms.css
│
└── utils/
    ├── mercadolibre.js
    └── validators.js

backend/
└── models/
    └── Vehicle.js                 ← Nuevo modelo
```

---

## 📦 SPRINT 3 - Autenticación OTP (SMS)

### Duración Estimada: 2 semanas

### 🎯 Objetivos:

#### 1. Setup Twilio
- [ ] Crear cuenta en Twilio
- [ ] Configurar número de teléfono
- [ ] Obtener credenciales (Account SID, Auth Token)

#### 2. Backend - OTP
- [ ] Endpoint `/api/auth/send-otp`
- [ ] Endpoint `/api/auth/verify-otp`
- [ ] Almacenar códigos temporalmente (5 minutos)
- [ ] Límite de intentos (3 por número)

#### 3. Frontend - OTP
- [ ] Pantalla para ingresar número
- [ ] Pantalla para validar código
- [ ] Timer de reenvío (60 segundos)
- [ ] Inputs especiales de 6 dígitos

### 📁 Archivos a Crear:

```
shared/
└── components/
    └── OTPInput/
        ├── OTPInput.jsx           ← Input de 6 dígitos
        └── OTPInput.css

client-pwa/src/
└── pages/
    ├── PhoneLogin.jsx             ← Ingresar teléfono
    └── OTPVerification.jsx        ← Validar código

backend/
└── services/
    └── sms.js                     ← Servicio Twilio
```

---

## 📦 SPRINT 4 - Notificaciones Push

### Duración Estimada: 1-2 semanas

### 🎯 Objetivos:

#### 1. Firebase Cloud Messaging
- [ ] Configurar proyecto Firebase
- [ ] Obtener credenciales
- [ ] Service Worker para PWA

#### 2. Push Notifications (Android Web)
- [ ] Solicitar permisos
- [ ] Guardar tokens
- [ ] Enviar notificaciones desde backend

#### 3. Fallback SMS (iOS)
- [ ] Detectar plataforma
- [ ] Enviar SMS cuando nueva cotización
- [ ] Enlace a la app con deep link

---

## 📅 Timeline Completo

```
Semana 1-3:   SPRINT 0 ✅ COMPLETADO
Semana 4-6:   SPRINT 1 - Mapbox + Geo
Semana 7-8:   SPRINT 2 - Formulario Vehículo
Semana 9-10:  SPRINT 3 - OTP SMS
Semana 11-12: SPRINT 4 - Push Notifications
Semana 13-14: SPRINT 5 - Tracking Tiempo Real
Semana 15-16: SPRINT 6 - Código Seguridad
Semana 17-19: SPRINT 7 - Panel Admin
Semana 20:    SPRINT 8 - Calificaciones
Semana 21-22: SPRINT 9 - Build Nativo (Capacitor)
Semana 23-24: SPRINT 10 - Polish + Deploy

Total: ~6 meses para MVP completo
```

---

## 🎓 Recursos de Aprendizaje

### Mapbox
- Docs: https://docs.mapbox.com/
- React examples: https://docs.mapbox.com/mapbox-gl-js/example/
- Geocoding API: https://docs.mapbox.com/api/search/geocoding/

### Twilio SMS
- Quickstart: https://www.twilio.com/docs/sms/quickstart/node
- Pricing: https://www.twilio.com/sms/pricing

### Firebase FCM
- Web Push: https://firebase.google.com/docs/cloud-messaging/js/client
- Service Workers: https://firebase.google.com/docs/cloud-messaging/js/receive

### Capacitor
- Docs: https://capacitorjs.com/docs
- Geolocation: https://capacitorjs.com/docs/apis/geolocation
- Push Notifications: https://capacitorjs.com/docs/apis/push-notifications

---

## ⚠️ Consideraciones Importantes

### Prioridades:
1. **CRÍTICO**: Mapbox + Geolocalización (core del negocio)
2. **ALTO**: Formulario de vehículo (información necesaria)
3. **MEDIO**: OTP SMS (mejor UX pero no bloqueante)
4. **MEDIO**: Push notifications (mejor UX)
5. **BAJO**: Tracking tiempo real (nice to have)

### Presupuesto Mensual Esperado:
- Mapbox: $0-20
- Twilio SMS: $30-50
- Firebase: $0
- Digital Ocean: $10-25
- MongoDB Atlas: $0
- **Total**: $40-95/mes

### Tiempo de Desarrollo (Con IA):
- Sprint 0: ✅ **2-3 días** (COMPLETADO)
- Sprint 1: **1-2 semanas**
- Sprint 2: **1 semana**
- Sprint 3: **1 semana**
- Sprint 4+: **4-8 semanas**

**MVP Completo**: 3-4 meses trabajando constante

---

## 🎯 Hitos Importantes

### Hito 1: MVP Básico (Sprint 0-2) ✅ 50%
- ✅ UI compartida funcionando
- ⏳ Mapas + Geolocalización
- ⏳ Formulario de vehículo

### Hito 2: MVP Mejorado (Sprint 3-5)
- ⏳ OTP SMS
- ⏳ Push notifications
- ⏳ Tracking tiempo real

### Hito 3: MVP Completo (Sprint 6-8)
- ⏳ Código de seguridad
- ⏳ Panel administración
- ⏳ Calificaciones

### Hito 4: Producción (Sprint 9-10)
- ⏳ Build nativo
- ⏳ Deploy servidores
- ⳳ Launch 🚀

---

## 📞 Próxima Sesión

### Para la próxima sesión necesitarás:

1. **Cuenta Mapbox creada** (si quieres empezar Sprint 1)
2. **Access Token de Mapbox** guardado
3. **Verificar que Sprint 0 funciona** (seguir TESTING_SPRINT_0.md)
4. **Decisión:** ¿Comenzamos con Sprint 1 o hay algo más de Sprint 0?

### Preguntas para ti:

1. ¿Todo funciona correctamente después de seguir TESTING_SPRINT_0.md?
2. ¿Quieres agregar o modificar algo de los componentes shared?
3. ¿Estás listo para comenzar con Mapbox (Sprint 1)?
4. ¿Hay alguna funcionalidad que quieras priorizar diferente?

---

**¡Excelente progreso!** 🎉

Has completado la base más importante del proyecto. A partir de ahora, cada sprint agrega funcionalidad concreta sobre esta base sólida.

**Desarrollado para Desvare App** 🚀

