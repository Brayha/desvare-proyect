# 🎨 Rediseño: Vista "Buscando Cotizaciones"

**Fecha:** 5 de Enero, 2026  
**Objetivo:** Mejorar la experiencia visual de la vista de búsqueda de cotizaciones con un diseño moderno y minimalista.

---

## 📋 Cambios Implementados

### 1. **Eliminación de Header y Footer**
- ✅ **Antes:** Vista con header estándar de Ionic (título + botón atrás)
- ✅ **Ahora:** Mapa a pantalla completa sin header ni footer
- **Beneficio:** Mayor espacio para el mapa y mejor experiencia visual

### 2. **Card Flotante Superior - Notificación SMS**
```jsx
<div className="floating-card-top">
  <div className="sms-notification-card">
    <IonIcon icon={chatbubbleEllipsesOutline} className="sms-icon" />
    <IonText className="sms-text">
      Cuando lleguen las cotizaciones te notificaremos vía mensaje de texto
    </IonText>
  </div>
</div>
```

**Características:**
- 📍 Posición: Top (20px desde arriba)
- 🎨 Diseño: Gradiente púrpura (667eea → 764ba2)
- 💬 Icono: Mensaje de texto (chatbubbleEllipsesOutline)
- ✨ Animación: slideDownFade (0.5s)
- 🌟 Efecto: Box shadow con blur para profundidad

### 3. **Card Flotante Inferior - Spinner + Botón**
```jsx
<div className="floating-card-bottom">
  <div className="search-status-card">
    <div className="spinner-container">
      <IonSpinner name="crescent" className="search-spinner-large" />
      <IonText className="search-text">
        <h3>Buscando Cotizaciones</h3>
        <p>Esto puede tomar unos segundos...</p>
      </IonText>
    </div>
    <IonButton
      expand="block"
      color="danger"
      onClick={handleCancelRequest}
      className="cancel-request-button"
      size="large"
    >
      Cancelar Solicitud
    </IonButton>
  </div>
</div>
```

**Características:**
- 📍 Posición: Bottom (24px desde abajo)
- 🎨 Diseño: Card blanca con backdrop blur
- ⚙️ Spinner: Grande (56px) con texto descriptivo
- 🔴 Botón: Rojo (danger) con sombra y bordes redondeados
- ✨ Animación: slideUpFade (0.5s)
- 📱 Responsive: Se adapta a pantallas pequeñas

---

## 🎨 Paleta de Colores

### Card Superior (SMS)
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
```
- **Color primario:** #667eea (Azul-púrpura)
- **Color secundario:** #764ba2 (Púrpura oscuro)
- **Texto:** Blanco (#ffffff)

### Card Inferior (Búsqueda)
```css
background: rgba(255, 255, 255, 0.98);
box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
backdrop-filter: blur(20px);
```
- **Fondo:** Blanco semi-transparente (98% opacidad)
- **Spinner:** Color primario de Ionic
- **Botón:** Danger (rojo) con sombra

---

## 📐 Estructura CSS

### Clases Principales

#### 1. **map-container-fullscreen-no-header**
```css
.map-container-fullscreen-no-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100vh;
  z-index: 1;
}
```

#### 2. **floating-card-top**
```css
.floating-card-top {
  position: absolute;
  top: 20px;
  left: 16px;
  right: 16px;
  z-index: 10;
  animation: slideDownFade 0.5s ease-out;
}
```

#### 3. **floating-card-bottom**
```css
.floating-card-bottom {
  position: absolute;
  bottom: 24px;
  left: 16px;
  right: 16px;
  z-index: 10;
  animation: slideUpFade 0.5s ease-out;
}
```

---

## 🎬 Animaciones

### slideDownFade (Card Superior)
```css
@keyframes slideDownFade {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### slideUpFade (Card Inferior)
```css
@keyframes slideUpFade {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## 📱 Responsive Design

### Pantallas pequeñas (≤ 375px)
```css
@media (max-width: 375px) {
  .floating-card-top {
    left: 12px;
    right: 12px;
    top: 16px;
  }

  .floating-card-bottom {
    left: 12px;
    right: 12px;
    bottom: 20px;
  }

  .sms-notification-card {
    padding: 14px 16px;
    gap: 12px;
  }

  .sms-icon {
    font-size: 24px;
  }

  .sms-text {
    font-size: 13px;
  }

  .search-status-card {
    padding: 20px 16px;
  }

  .search-spinner-large {
    width: 48px;
    height: 48px;
  }

  .search-text h3 {
    font-size: 16px;
  }

  .search-text p {
    font-size: 13px;
  }

  .cancel-request-button {
    height: 50px;
    font-size: 15px;
  }
}
```

---

## 🌙 Modo Oscuro

```css
@media (prefers-color-scheme: dark) {
  .waiting-quotes-page {
    --background: transparent;
  }

  .search-status-card {
    background: rgba(30, 30, 30, 0.98);
  }

  .search-text h3 {
    color: var(--ion-color-light);
  }

  .search-text p {
    color: var(--ion-color-medium);
  }
}
```

---

## 🔄 Comportamiento

### Visibilidad de Cards
- **Cards flotantes:** Solo se muestran cuando `quotesReceived.length === 0`
- **Cuando llegan cotizaciones:** Las cards desaparecen y se muestra el mapa con los marcadores
- **Sheet de detalles:** Se mantiene para mostrar información de cotizaciones seleccionadas

### Interacción
1. **Usuario entra a la vista** → Animación de entrada de ambas cards
2. **Usuario espera** → Spinner girando, mensaje informativo
3. **Usuario cancela** → Limpieza completa de estado y redirección a `/home`
4. **Llegan cotizaciones** → Cards desaparecen, marcadores aparecen en el mapa

---

## ✅ Archivos Modificados

1. **client-pwa/src/pages/WaitingQuotes.jsx**
   - Eliminado: `IonHeader`, `IonToolbar`, `IonTitle`, `IonButtons`, `arrowBack`
   - Agregado: `chatbubbleEllipsesOutline` icon
   - Agregado: Cards flotantes superior e inferior
   - Modificado: Clase del contenedor del mapa

2. **client-pwa/src/pages/WaitingQuotes.css**
   - Agregado: `.map-container-fullscreen-no-header`
   - Agregado: `.floating-card-top` y `.sms-notification-card`
   - Agregado: `.floating-card-bottom` y `.search-status-card`
   - Agregado: Animaciones `slideDownFade` y `slideUpFade`
   - Modificado: Media queries para responsive
   - Modificado: Modo oscuro

---

## 🎯 Resultado Final

### Vista "Buscando Cotizaciones"
```
┌─────────────────────────────────────┐
│  ╔═══════════════════════════════╗  │ ← Card Superior (SMS)
│  ║ 💬 Cuando lleguen las...     ║  │
│  ╚═══════════════════════════════╝  │
│                                     │
│                                     │
│           🗺️ MAPA FULLSCREEN        │
│         (Ubicación del cliente)     │
│                                     │
│                                     │
│  ╔═══════════════════════════════╗  │ ← Card Inferior
│  ║  ⚙️  Buscando Cotizaciones    ║  │
│  ║     Esto puede tomar...       ║  │
│  ║                               ║  │
│  ║  [ Cancelar Solicitud ]       ║  │
│  ╚═══════════════════════════════╝  │
└─────────────────────────────────────┘
```

---

## 🚀 Próximos Pasos Sugeridos

1. ✅ **Probar en dispositivo real** para verificar animaciones
2. ✅ **Verificar modo oscuro** en diferentes dispositivos
3. ✅ **Probar responsive** en pantallas pequeñas (iPhone SE, etc.)
4. 🔄 **Ajustar colores** si el usuario lo requiere
5. 🔄 **Ajustar tamaños** de texto/iconos si es necesario

---

## 📝 Notas del Desarrollador

- El diseño usa **gradientes modernos** y **backdrop blur** para un look premium
- Las **animaciones suaves** mejoran la experiencia de usuario
- El **diseño responsive** asegura compatibilidad con todos los dispositivos
- El **modo oscuro** está implementado para mejor experiencia nocturna
- La **estructura modular** permite fácil mantenimiento y ajustes futuros

---

**Estado:** ✅ Implementado y listo para pruebas  
**Pendiente:** Ajustes visuales según feedback del usuario

