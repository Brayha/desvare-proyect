# 🎬 Guía de Animaciones Reutilizables

Esta guía te explica cómo usar las animaciones en cualquier componente de tu proyecto.

## 📦 Importar las animaciones

### Opción 1: En un componente específico (CSS)
```css
@import '../../../../shared/styles/animations.css';
```

### Opción 2: En tu archivo principal (index.css o App.css)
```css
@import '../shared/styles/animations.css';
```

### Opción 3: En un componente JSX
```jsx
import '../../../../shared/styles/animations.css';
```

---

## 🎯 Uso Básico

### 1️⃣ **Aplicar con clases CSS**

La forma más simple es agregar la clase directamente en el HTML/JSX:

```jsx
<div className="fade-in-up">
  Contenido que aparece con animación
</div>
```

### 2️⃣ **Aplicar con keyframes personalizados**

En tu CSS del componente:

```css
.mi-componente {
  animation: fadeInUp 0.4s ease-out;
}
```

### 3️⃣ **Forzar re-animación con key** (Recomendado para pasos/vistas)

Cuando el contenido cambia pero el componente no se desmonta:

```jsx
function MiComponente() {
  const [paso, setPaso] = useState(0);
  
  return (
    <div className="fade-in-up" key={paso}>
      Contenido del paso {paso}
    </div>
  );
}
```

El `key` fuerza a React a re-renderizar el componente, activando la animación nuevamente.

---

## 🎨 Animaciones Disponibles

### **Fade Animations** (Aparecer/Desaparecer)

| Clase | Descripción | Ejemplo |
|-------|-------------|---------|
| `.fade-in` | Aparece con opacidad | Modales, tooltips |
| `.fade-in-up` | Aparece desde abajo | **Pasos de wizard**, tarjetas |
| `.fade-in-down` | Aparece desde arriba | Notificaciones, dropdowns |

**Uso:**
```jsx
<div className="fade-in-up">
  <h1>Bienvenido</h1>
</div>
```

---

### **Slide Animations** (Deslizar)

| Clase | Descripción | Ejemplo |
|-------|-------------|---------|
| `.slide-in-right` | Desliza desde derecha | Avanzar en wizard, menús |
| `.slide-in-left` | Desliza desde izquierda | Retroceder, paneles laterales |

**Uso:**
```jsx
<div className="slide-in-right">
  <p>Contenido que entra desde la derecha</p>
</div>
```

---

### **Scale Animations** (Crecer/Encoger)

| Clase | Descripción | Ejemplo |
|-------|-------------|---------|
| `.scale-in` | Crece desde el centro | Botones, íconos, modales |
| `.pulse` | Pulso de atención | Badges, notificaciones |
| `.bounce-in` | Rebote al aparecer | Alertas exitosas, celebraciones |

**Uso:**
```jsx
<button className="scale-in">
  Clic aquí
</button>

<span className="pulse">🔔</span>
```

---

### **Utilidades Especiales**

| Clase | Descripción |
|-------|-------------|
| `.shake` | Sacudida (para errores) |
| `.rotate` | Rotación continua (loaders) |
| `.skeleton-loading` | Efecto shimmer (carga) |

**Ejemplos:**

```jsx
// Error en input
<input className={error ? "shake" : ""} />

// Ícono de carga
<div className="rotate">⟳</div>

// Skeleton loader
<div className="skeleton-loading" style={{height: 50, borderRadius: 8}} />
```

---

## ⚡ Modificadores de Velocidad

Cambia la duración de cualquier animación:

```jsx
// Más rápida (0.2s)
<div className="fade-in-up animate-fast">Rápido</div>

// Más lenta (0.6s)
<div className="fade-in-up animate-slow">Lento</div>

// Con delay
<div className="fade-in-up animate-delay-200">Con retraso</div>
```

---

## 🔄 Animaciones Secuenciales (Stagger)

Para elementos de una lista que aparecen uno tras otro:

```jsx
{items.map((item, index) => (
  <div 
    key={item.id} 
    className={`fade-in-up stagger-${index + 1}`}
  >
    {item.nombre}
  </div>
))}
```

O con estilos inline:

```jsx
{items.map((item, index) => (
  <div 
    key={item.id} 
    className="fade-in-up"
    style={{ animationDelay: `${index * 0.1}s` }}
  >
    {item.nombre}
  </div>
))}
```

---

## 🎯 Ejemplos Prácticos

### **Ejemplo 1: Wizard con FadeInUp**

```jsx
function MiWizard() {
  const [paso, setPaso] = useState(0);
  
  return (
    <div className="wizard-container">
      <div className="fade-in-up" key={paso}>
        {paso === 0 && <SeleccionCategoria />}
        {paso === 1 && <SeleccionMarca />}
        {paso === 2 && <FormularioDetalles />}
      </div>
    </div>
  );
}
```

En tu CSS:
```css
.wizard-container {
  animation: fadeInUp 0.4s ease-out;
}
```

---

### **Ejemplo 2: Lista de Tarjetas Animadas**

```jsx
function ListaVehiculos({ vehiculos }) {
  return (
    <div className="grid">
      {vehiculos.map((vehiculo, index) => (
        <div 
          key={vehiculo.id}
          className="fade-in-up"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <TarjetaVehiculo data={vehiculo} />
        </div>
      ))}
    </div>
  );
}
```

---

### **Ejemplo 3: Modal con ScaleIn**

```jsx
function Modal({ isOpen, children }) {
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay fade-in">
      <div className="modal-content scale-in">
        {children}
      </div>
    </div>
  );
}
```

---

### **Ejemplo 4: Botón con Hover Interactivo**

```jsx
<button className="hover-lift active-scale">
  Presiona aquí
</button>
```

En tu CSS:
```css
button {
  padding: 12px 24px;
  border-radius: 8px;
  background: #4F46E5;
  color: white;
}
```

---

### **Ejemplo 5: Input con Error Shake**

```jsx
function InputConValidacion() {
  const [error, setError] = useState(false);
  
  return (
    <input
      className={error ? "shake" : ""}
      onAnimationEnd={() => setError(false)}
    />
  );
}
```

---

## 🎨 Transiciones Suaves (sin animación)

Para interacciones que NO requieren animación de entrada, pero sí transiciones:

```css
.mi-boton {
  /* Ya incluido en animations.css */
}
```

Usa estas clases:
- `.transition-all` - Transición suave en todas las propiedades
- `.transition-fast` - Transición rápida (0.15s)
- `.transition-opacity` - Solo opacidad
- `.transition-transform` - Solo transformaciones

```jsx
<div className="transition-all hover-lift">
  Pasa el mouse
</div>
```

---

## 📱 Consideraciones Mobile

Las animaciones ya están optimizadas para mobile, pero puedes desactivarlas en dispositivos de bajo rendimiento:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

---

## 🚀 Tips de Rendimiento

1. **Usa `transform` y `opacity`** - Son las propiedades más eficientes
2. **Evita animar `width`, `height`, `top`, `left`** - Causan reflow
3. **Usa `will-change` solo cuando sea necesario**:
   ```css
   .elemento-animado {
     will-change: transform, opacity;
   }
   ```
4. **No animes más de 5-7 elementos simultáneamente**

---

## 🎯 Cuándo Usar Cada Animación

| Situación | Animación Recomendada |
|-----------|----------------------|
| Cambio de paso en wizard | `fadeInUp` |
| Abrir modal | `scaleIn` |
| Notificación de éxito | `bounceIn` |
| Dropdown que abre | `fadeInDown` |
| Error en formulario | `shake` |
| Carga de contenido | `skeleton-loading` |
| Spinner de carga | `rotate` |
| Hover en botón | `hover-lift` |
| Lista de elementos | `fadeInUp` + `stagger` |

---

## 📚 Resumen Rápido

```jsx
// 1. Importar (una sola vez en tu app)
import '../../shared/styles/animations.css';

// 2. Usar con clases
<div className="fade-in-up">Contenido</div>

// 3. O con key para re-animar
<div className="fade-in-up" key={paso}>Paso {paso}</div>

// 4. Combinar con modificadores
<div className="fade-in-up animate-slow stagger-2">
  Contenido con delay
</div>
```

---

¡Listo! Ahora puedes usar animaciones profesionales en cualquier parte de tu proyecto. 🎉

