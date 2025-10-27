# 📦 Shared - Componentes y Utilidades Compartidas

Esta carpeta contiene todos los componentes, hooks, servicios y estilos compartidos entre `client-pwa` y `driver-app`.

## 📁 Estructura

```
shared/
├── components/          # Componentes UI reutilizables
│   ├── Button/         # Botón personalizado
│   ├── Input/          # Input con validaciones
│   ├── Card/           # Card con estilos
│   └── index.js        # Exports centralizados
│
├── layouts/            # Layouts compartidos
│   └── AuthLayout.jsx  # Layout para páginas de autenticación
│
├── hooks/              # Custom hooks
│   ├── useAuth.js      # Hook para autenticación
│   ├── useSocket.js    # Hook para Socket.IO
│   └── useToast.js     # Hook para notificaciones
│
├── services/           # Servicios
│   ├── api.js          # Cliente HTTP (Axios)
│   ├── socket.js       # Cliente Socket.IO
│   └── storage.js      # Helper para localStorage
│
├── styles/             # Estilos globales
│   ├── variables.css   # Variables CSS
│   ├── theme.css       # Tema Ionic
│   └── global.css      # Estilos globales
│
├── utils/              # Utilidades (futuro)
├── package.json        # Dependencias compartidas
├── index.js            # Punto de entrada principal
└── README.md           # Este archivo
```

## 🚀 Uso

### Importar desde path aliases

Los path aliases están configurados en `vite.config.js`:

```javascript
// Componentes
import { Button, Input, Card } from '@components';

// Layouts
import { AuthLayout } from '@layouts/AuthLayout';

// Hooks
import { useAuth, useSocket, useToast } from '@hooks/useAuth';

// Servicios
import { authAPI, requestAPI } from '@services/api';
import socketService from '@services/socket';
import storage from '@services/storage';

// Estilos (en main.jsx)
import '@styles/global.css';
```

## 🎨 Componentes

### Button

Botón reutilizable con múltiples variantes.

```jsx
import { Button } from '@components';

<Button 
  variant="primary"     // primary, secondary, success, danger, warning
  size="large"          // small, default, large
  expand="block"        // block, full
  loading={false}
  onClick={handleClick}
>
  Guardar
</Button>
```

### Input

Input con label, validaciones y mensajes de error.

```jsx
import { Input } from '@components';

<Input
  label="Email"
  type="email"
  value={email}
  onIonInput={(e) => setEmail(e.detail.value)}
  placeholder="tu@email.com"
  required
  error="Campo requerido"
  helper="Ingresa un email válido"
/>
```

### Card

Card con título, subtítulo y contenido.

```jsx
import { Card } from '@components';

<Card 
  title="Mi Tarjeta"
  subtitle="Subtítulo opcional"
  elevated={true}
  onClick={handleClick}
>
  <p>Contenido del card</p>
</Card>
```

## 🎯 Layouts

### AuthLayout

Layout para páginas de autenticación (Login, Register).

```jsx
import { AuthLayout } from '@layouts/AuthLayout';

<AuthLayout 
  title="Desvare - Cliente"
  toolbarColor="primary"
  showHeader={true}
>
  <Card title="Iniciar Sesión">
    {/* Contenido */}
  </Card>
</AuthLayout>
```

## 🪝 Hooks

### useAuth

Hook para manejo de autenticación.

```jsx
import { useAuth } from '@hooks/useAuth';

const { user, isAuthenticated, login, register, logout, loading, error } = useAuth();

// Login
const result = await login({ email, password, userType: 'client' });

// Register
const result = await register({ name, email, password, userType: 'driver' });

// Logout
logout();
```

### useSocket

Hook para Socket.IO.

```jsx
import { useSocket } from '@hooks/useSocket';

const { socket, isConnected, connect, disconnect } = useSocket();

// Emitir evento
socket.registerClient(userId);

// Escuchar evento
socket.onQuoteReceived((data) => {
  console.log('Cotización recibida:', data);
});
```

### useToast

Hook para mostrar notificaciones.

```jsx
import { useToast } from '@hooks/useToast';

const { showSuccess, showError, showWarning, showInfo } = useToast();

showSuccess('¡Operación exitosa!');
showError('Error al guardar');
showWarning('Campos incompletos');
showInfo('Información importante');
```

## 🛠️ Servicios

### API Service

Cliente HTTP con Axios.

```jsx
import { authAPI, requestAPI } from '@services/api';

// Autenticación
const response = await authAPI.login({ email, password, userType });
const response = await authAPI.register({ name, email, password, userType });
authAPI.logout();

// Solicitudes
const response = await requestAPI.createRequest(data);
const response = await requestAPI.getClientRequests(clientId);
```

### Socket Service

Cliente Socket.IO.

```jsx
import socketService from '@services/socket';

// Conectar
socketService.connect();

// Cliente
socketService.registerClient(clientId);
socketService.sendNewRequest(data);
socketService.onQuoteReceived(callback);

// Conductor
socketService.registerDriver(driverId);
socketService.sendQuote(data);
socketService.onRequestReceived(callback);

// Desconectar
socketService.disconnect();
```

### Storage Service

Helper para localStorage.

```jsx
import storage from '@services/storage';

// Token
storage.setToken(token);
const token = storage.getToken();
storage.removeToken();

// Usuario
storage.setUser(user);
const user = storage.getUser();
storage.removeUser();

// Sesión completa
storage.setSession(token, user);
storage.clearSession();
const isAuth = storage.isAuthenticated();

// Genéricos
storage.set('key', value);
const value = storage.get('key');
storage.remove('key');
```

## 🎨 Estilos

### Variables CSS

Todas las variables están en `styles/variables.css`:

- Colores: `--desvare-primary`, `--desvare-success`, etc.
- Espaciados: `--spacing-xs`, `--spacing-sm`, etc.
- Tipografía: `--font-size-xs`, `--font-size-sm`, etc.
- Bordes: `--border-radius-sm`, `--border-radius-md`, etc.
- Sombras: `--shadow-sm`, `--shadow-md`, etc.

### Clases Utilitarias

```css
/* Espaciados */
.mt-xs, .mt-sm, .mt-md, .mt-lg, .mt-xl
.mb-xs, .mb-sm, .mb-md, .mb-lg, .mb-xl
.p-xs, .p-sm, .p-md, .p-lg, .p-xl

/* Texto */
.text-center, .text-left, .text-right
.text-bold, .text-semibold, .text-normal
.text-xs, .text-sm, .text-md, .text-lg, .text-xl

/* Display */
.flex, .flex-column, .flex-center, .flex-between

/* Animaciones */
.fade-in, .slide-in-up

/* Responsive */
.hide-mobile, .hide-desktop
```

## 📝 Convenciones

1. **Componentes**: Usar PascalCase (Button.jsx, Input.jsx)
2. **Hooks**: Usar camelCase con prefijo `use` (useAuth.js, useSocket.js)
3. **Servicios**: Usar camelCase (api.js, socket.js)
4. **Estilos**: Archivos `.css` separados por componente
5. **Exports**: Centralizar en `index.js` de cada carpeta

## ✅ Ventajas

- ✅ **DRY**: No repetir código entre apps
- ✅ **Consistencia**: UI uniforme
- ✅ **Mantenibilidad**: Cambios en un solo lugar
- ✅ **Escalabilidad**: Fácil agregar nuevos componentes
- ✅ **Testing**: Probar componentes una sola vez
- ✅ **Documentación**: Todo centralizado

## 🔄 Actualizar Componentes

Cuando modifiques un componente shared, se reflejará automáticamente en ambas apps (client-pwa y driver-app) gracias a los path aliases.

## 📚 Próximos Componentes (Futuro)

- [ ] Modal
- [ ] Loader
- [ ] Alert
- [ ] Select
- [ ] Checkbox
- [ ] Radio
- [ ] Toggle
- [ ] Textarea
- [ ] Badge
- [ ] Avatar
- [ ] Skeleton
- [ ] Tabs
- [ ] Accordion
- [ ] Stepper
- [ ] DatePicker
- [ ] Map (con Mapbox)

---

**Desarrollado para Desvare App** 🚀

