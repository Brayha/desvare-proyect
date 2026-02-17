# 🎨 Guía Visual - Componentes Compartidos

Esta guía muestra visualmente cómo usar los nuevos componentes compartidos.

---

## 📦 Importaciones Simplificadas

### ❌ ANTES (Cada app tenía su propia versión)

```javascript
// client-pwa/src/pages/Login.jsx
import { IonButton, IonInput, IonCard } from '@ionic/react';
import { authAPI } from '../services/api';
```

```javascript
// driver-app/src/pages/Login.jsx  
import { IonButton, IonInput, IonCard } from '@ionic/react';
import { authAPI } from '../services/api';
```

### ✅ AHORA (Importaciones desde shared/)

```javascript
// Ambas apps usan lo mismo
import { Button, Input, Card } from '@components';
import { AuthLayout } from '@layouts/AuthLayout';
import { authAPI } from '@services/api';
import { useToast } from '@hooks/useToast';
```

---

## 🎯 Componente Button

### Uso Básico

```jsx
import { Button } from '@components';

// Botón primario
<Button variant="primary">
  Guardar
</Button>

// Botón con tamaño grande
<Button variant="success" size="large" expand="block">
  Registrarse
</Button>

// Botón con estado de carga
<Button loading={isLoading} variant="primary">
  {isLoading ? 'Cargando...' : 'Enviar'}
</Button>
```

### Variantes Disponibles

```jsx
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="success">Success</Button>
<Button variant="danger">Danger</Button>
<Button variant="warning">Warning</Button>
```

### Tamaños

```jsx
<Button size="small">Pequeño</Button>
<Button size="default">Normal</Button>
<Button size="large">Grande</Button>
```

---

## 📝 Componente Input

### Uso Básico

```jsx
import { Input } from '@components';

<Input
  label="Email"
  type="email"
  value={email}
  onIonInput={(e) => setEmail(e.detail.value)}
  placeholder="tu@email.com"
  required
/>
```

### Con Validación y Mensajes

```jsx
<Input
  label="Contraseña"
  type="password"
  value={password}
  onIonInput={(e) => setPassword(e.detail.value)}
  placeholder="Mínimo 6 caracteres"
  helper="Debe tener al menos 6 caracteres"
  error={passwordError}
  required
/>
```

### Ejemplo de Validación en Tiempo Real

```jsx
<Input
  label="Confirmar Contraseña"
  type="password"
  value={confirmPassword}
  onIonInput={(e) => setConfirmPassword(e.detail.value)}
  error={
    confirmPassword && password !== confirmPassword
      ? 'Las contraseñas no coinciden'
      : ''
  }
  required
/>
```

---

## 🃏 Componente Card

### Uso Básico

```jsx
import { Card } from '@components';

<Card title="Mi Tarjeta">
  <p>Contenido de la tarjeta</p>
</Card>
```

### Con Subtítulo

```jsx
<Card 
  title="Iniciar Sesión"
  subtitle="Ingresa tus credenciales"
>
  <form onSubmit={handleLogin}>
    {/* Formulario aquí */}
  </form>
</Card>
```

### Card Clickeable

```jsx
<Card 
  title="Solicitud #1234"
  elevated={true}
  onClick={() => handleCardClick()}
>
  <p>Click para ver detalles</p>
</Card>
```

---

## 🏛️ Layout AuthLayout

### Para Cliente (PWA)

```jsx
import { AuthLayout } from '@layouts/AuthLayout';
import { Card, Input, Button } from '@components';

const Login = () => {
  return (
    <AuthLayout title="Desvare - Cliente">
      <Card title="Iniciar Sesión">
        <form onSubmit={handleLogin}>
          <Input
            label="Email"
            type="email"
            value={email}
            onIonInput={(e) => setEmail(e.detail.value)}
          />
          
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onIonInput={(e) => setPassword(e.detail.value)}
          />
          
          <Button expand="block" type="submit">
            Iniciar Sesión
          </Button>
        </form>
      </Card>
    </AuthLayout>
  );
};
```

### Para Conductor (App)

```jsx
// Mismo código, solo cambia el color del toolbar
<AuthLayout 
  title="Desvare - Conductor" 
  toolbarColor="secondary"  // 👈 Cambia a cyan
>
  <Card title="Iniciar Sesión como Conductor">
    {/* Mismo formulario */}
  </Card>
</AuthLayout>
```

---

## 🪝 Hooks Personalizados

### useAuth

```jsx
import { useAuth } from '@hooks/useAuth';

const MyComponent = () => {
  const { 
    user,              // Usuario actual
    isAuthenticated,   // Boolean de autenticación
    login,             // Función para login
    register,          // Función para registro
    logout,            // Función para logout
    loading,           // Estado de carga
    error              // Errores
  } = useAuth();

  const handleLogin = async () => {
    const result = await login({
      email: 'user@example.com',
      password: 'password123',
      userType: 'client'
    });
    
    if (result.success) {
      console.log('Login exitoso:', result.user);
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <p>Hola, {user.name}</p>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
};
```

### useToast

```jsx
import { useToast } from '@hooks/useToast';

const MyComponent = () => {
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  const handleSave = async () => {
    try {
      await saveData();
      showSuccess('¡Datos guardados exitosamente!');
    } catch (error) {
      showError('Error al guardar los datos');
    }
  };

  return <button onClick={handleSave}>Guardar</button>;
};
```

### useSocket

```jsx
import { useSocket } from '@hooks/useSocket';
import { useEffect } from 'react';

const MyComponent = () => {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (isConnected) {
      // Registrar cliente
      socket.registerClient(userId);
      
      // Escuchar cotizaciones
      socket.onQuoteReceived((quote) => {
        console.log('Nueva cotización:', quote);
      });
      
      // Cleanup
      return () => {
        socket.offQuoteReceived();
      };
    }
  }, [isConnected]);

  return (
    <div>
      Estado: {isConnected ? '✅ Conectado' : '❌ Desconectado'}
    </div>
  );
};
```

---

## 🎨 Clases Utilitarias CSS

### Espaciados

```jsx
// Margin top
<div className="mt-xs">Margen pequeño arriba</div>
<div className="mt-sm">Margen chico arriba</div>
<div className="mt-md">Margen medio arriba</div>
<div className="mt-lg">Margen grande arriba</div>
<div className="mt-xl">Margen extra grande arriba</div>

// Margin bottom
<div className="mb-md">Margen medio abajo</div>

// Padding
<div className="p-md">Padding medio en todos lados</div>
```

### Texto

```jsx
// Alineación
<p className="text-center">Texto centrado</p>
<p className="text-left">Texto a la izquierda</p>
<p className="text-right">Texto a la derecha</p>

// Peso
<p className="text-bold">Texto en negrita</p>
<p className="text-semibold">Texto semi-negrita</p>

// Tamaños
<p className="text-xs">Texto extra pequeño</p>
<p className="text-sm">Texto pequeño</p>
<p className="text-md">Texto mediano</p>
<p className="text-lg">Texto grande</p>
<p className="text-xl">Texto extra grande</p>
```

### Display Flex

```jsx
// Flex básico
<div className="flex">
  <span>Item 1</span>
  <span>Item 2</span>
</div>

// Flex column
<div className="flex flex-column">
  <span>Item 1</span>
  <span>Item 2</span>
</div>

// Flex centrado
<div className="flex-center">
  <span>Centrado vertical y horizontal</span>
</div>

// Flex space-between
<div className="flex-between">
  <span>Izquierda</span>
  <span>Derecha</span>
</div>
```

### Animaciones

```jsx
// Fade in
<div className="fade-in">
  Aparece con fade
</div>

// Slide in up
<div className="slide-in-up">
  Se desliza desde abajo
</div>
```

---

## 📱 Ejemplo Completo: Página de Login

```jsx
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonText, useIonLoading } from '@ionic/react';

// Imports desde shared/
import { AuthLayout } from '@layouts/AuthLayout';
import { Button, Input, Card } from '@components';
import { authAPI } from '@services/api';
import { useToast } from '@hooks/useToast';
import storage from '@services/storage';

const Login = () => {
  const history = useHistory();
  const { showSuccess, showWarning, showError } = useToast();
  const [presentLoading, dismissLoading] = useIonLoading();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      showWarning('Por favor completa todos los campos');
      return;
    }

    await presentLoading('Iniciando sesión...');

    try {
      const response = await authAPI.login({
        email,
        password,
        userType: 'client',
      });

      storage.setSession(response.data.token, response.data.user);

      await dismissLoading();
      showSuccess('¡Bienvenido!');
      history.push('/home');
    } catch (error) {
      await dismissLoading();
      showError(error.response?.data?.error || 'Error al iniciar sesión');
    }
  };

  return (
    <AuthLayout title="Desvare - Cliente">
      <Card title="Iniciar Sesión">
        <form onSubmit={handleLogin}>
          <Input
            label="Email"
            type="email"
            value={email}
            onIonInput={(e) => setEmail(e.detail.value)}
            placeholder="tu@email.com"
            required
          />

          <Input
            label="Contraseña"
            type="password"
            value={password}
            onIonInput={(e) => setPassword(e.detail.value)}
            placeholder="••••••••"
            required
          />

          <Button 
            expand="block" 
            type="submit" 
            size="large"
            className="mt-md"
          >
            Iniciar Sesión
          </Button>

          <div className="text-center mt-md">
            <IonText>
              ¿No tienes cuenta?{' '}
              <a onClick={() => history.push('/register')}>
                Regístrate aquí
              </a>
            </IonText>
          </div>
        </form>
      </Card>
    </AuthLayout>
  );
};

export default Login;
```

---

## 🎯 Comparación Visual

### ANTES vs DESPUÉS

#### Código ANTES (duplicado, más líneas)

```jsx
// ~130 líneas de código
import { 
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar,
  IonInput, IonButton, IonItem, IonLabel, IonText,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  useIonToast, useIonLoading 
} from '@ionic/react';
import { authAPI } from '../services/api';

const Login = () => {
  // ... 50 líneas de lógica ...
  
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Desvare - Cliente</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
          <IonCard style={{ width: '100%', maxWidth: '400px' }}>
            <IonCardHeader>
              <IonCardTitle>Iniciar Sesión</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <form onSubmit={handleLogin}>
                <IonItem>
                  <IonLabel position="floating">Email</IonLabel>
                  <IonInput
                    type="email"
                    value={email}
                    onIonInput={(e) => setEmail(e.detail.value)}
                    required
                  />
                </IonItem>
                {/* ... más código ... */}
              </form>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};
```

#### Código DESPUÉS (limpio, menos líneas)

```jsx
// ~80 líneas de código (38% menos)
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonText, useIonLoading } from '@ionic/react';
import { AuthLayout } from '@layouts/AuthLayout';
import { Button, Input, Card } from '@components';
import { authAPI } from '@services/api';
import { useToast } from '@hooks/useToast';
import storage from '@services/storage';

const Login = () => {
  // ... lógica simplificada ...
  
  return (
    <AuthLayout title="Desvare - Cliente">
      <Card title="Iniciar Sesión">
        <form onSubmit={handleLogin}>
          <Input
            label="Email"
            type="email"
            value={email}
            onIonInput={(e) => setEmail(e.detail.value)}
            placeholder="tu@email.com"
            required
          />
          {/* ... código más limpio ... */}
        </form>
      </Card>
    </AuthLayout>
  );
};
```

---

## ✅ Beneficios Visuales

1. **38% menos código** por página
2. **Imports más limpios** (3-5 líneas vs 10-15 líneas)
3. **Más legible** y fácil de entender
4. **Componentes semánticos** (`<Input>` vs `<IonItem><IonLabel><IonInput>`)
5. **Validaciones visuales** integradas
6. **Estilos consistentes** automáticamente
7. **Mantenimiento simplificado** (cambio en 1 lugar = actualiza 2 apps)

---

**Desarrollado para Desvare App** 🚀

