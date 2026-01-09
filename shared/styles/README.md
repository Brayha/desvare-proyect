# 🎨 Guía de Tipografía Desvare - Gilroy

## 📖 Introducción

Todos los proyectos de Desvare (client-pwa, driver-app, admin-dashboard) ahora usan **Gilroy** como fuente principal. Esta guía te muestra cómo usarla correctamente.

---

## 🎯 Pesos Disponibles

Gilroy tiene 5 pesos disponibles:

| Peso | Valor | Uso Recomendado |
|------|-------|-----------------|
| **Light** | `300` | Textos secundarios, descripciones largas |
| **Regular** | `400` | Texto normal, párrafos, contenido general |
| **Medium** | `500` | Subtítulos, énfasis moderado |
| **Bold** | `700` | Títulos, botones, elementos importantes |
| **Heavy** | `900` | Títulos principales, logos, elementos destacados |

---

## 💻 Cómo Usar

### Opción 1: Usando Variables CSS (Recomendado)

```css
/* Ejemplo en tu componente CSS */
.titulo-principal {
  font-family: var(--font-family); /* Gilroy */
  font-weight: var(--font-weight-bold); /* 700 */
  font-size: var(--font-size-xxl); /* 32px */
}

.subtitulo {
  font-family: var(--font-family);
  font-weight: var(--font-weight-medium); /* 500 */
  font-size: var(--font-size-lg); /* 18px */
}

.texto-normal {
  font-family: var(--font-family);
  font-weight: var(--font-weight-regular); /* 400 */
  font-size: var(--font-size-md); /* 16px */
}

.texto-ligero {
  font-family: var(--font-family);
  font-weight: var(--font-weight-light); /* 300 */
  font-size: var(--font-size-sm); /* 14px */
}
```

### Opción 2: Directamente

```css
.mi-elemento {
  font-family: 'Gilroy', sans-serif;
  font-weight: 700; /* Bold */
}
```

---

## 📱 Ejemplos por Componente

### Botones

```css
.boton-primario {
  font-family: var(--font-family);
  font-weight: var(--font-weight-bold); /* 700 */
  font-size: var(--font-size-md);
}
```

### Títulos de Página

```css
.page-title {
  font-family: var(--font-family);
  font-weight: var(--font-weight-heavy); /* 900 */
  font-size: var(--font-size-xxl);
}
```

### Cards

```css
.card-title {
  font-family: var(--font-family);
  font-weight: var(--font-weight-bold); /* 700 */
  font-size: var(--font-size-lg);
}

.card-description {
  font-family: var(--font-family);
  font-weight: var(--font-weight-regular); /* 400 */
  font-size: var(--font-size-sm);
}
```

### Formularios

```css
.form-label {
  font-family: var(--font-family);
  font-weight: var(--font-weight-medium); /* 500 */
  font-size: var(--font-size-sm);
}

.form-input {
  font-family: var(--font-family);
  font-weight: var(--font-weight-regular); /* 400 */
  font-size: var(--font-size-md);
}
```

---

## 🚀 Variables Disponibles

### Font Family
```css
--font-family: 'Gilroy', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
```

### Font Weights
```css
--font-weight-light: 300;
--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-bold: 700;
--font-weight-heavy: 900;
```

### Font Sizes
```css
--font-size-xs: 12px;
--font-size-sm: 14px;
--font-size-md: 16px;
--font-size-lg: 18px;
--font-size-xl: 24px;
--font-size-xxl: 32px;
```

---

## ✅ Buenas Prácticas

1. **Siempre usa variables CSS** en lugar de valores hardcodeados
2. **No uses pesos que no existen** (ej: 600, 800) - solo 300, 400, 500, 700, 900
3. **Usa Heavy (900) con moderación** - solo para elementos muy destacados
4. **Regular (400) es tu default** - para la mayoría del contenido
5. **Bold (700) para énfasis** - títulos, botones, elementos importantes

---

## 🎨 Jerarquía Visual Recomendada

```
┌─────────────────────────────────────┐
│ Título Principal (Heavy 900, 32px)  │ ← Máximo impacto
├─────────────────────────────────────┤
│ Título Sección (Bold 700, 24px)     │
├─────────────────────────────────────┤
│ Subtítulo (Medium 500, 18px)        │
├─────────────────────────────────────┤
│ Texto Normal (Regular 400, 16px)    │ ← Contenido principal
├─────────────────────────────────────┤
│ Texto Secundario (Light 300, 14px)  │ ← Menor énfasis
└─────────────────────────────────────┘
```

---

## 🔧 Troubleshooting

### ¿La fuente no se ve?

1. Verifica que el archivo `fonts.css` esté importado en `theme.css`
2. Verifica que `theme.css` esté importado en el `index.css` de tu proyecto
3. Limpia la caché del navegador (Ctrl+Shift+R o Cmd+Shift+R)
4. Verifica que los archivos `.woff` existan en `shared/src/gilroy-bold-webfont/`

### ¿Veo otra fuente?

Si ves la fuente del sistema (Arial, Helvetica), significa que Gilroy no se cargó. Revisa la consola del navegador para errores 404.

---

## 📂 Estructura de Archivos

```
shared/
├── src/
│   └── gilroy-bold-webfont/
│       ├── Gilroy-Light.woff
│       ├── Gilroy-Regular.woff
│       ├── Gilroy-Medium.woff
│       ├── Gilroy-Bold.woff
│       └── Gilroy-Heavy.woff
└── styles/
    ├── fonts.css          ← Define @font-face
    ├── variables.css      ← Define variables CSS
    ├── theme.css          ← Importa fonts.css y variables.css
    └── README.md          ← Este archivo
```

---

## 🎉 ¡Listo!

Ahora todos tus proyectos usan Gilroy de forma consistente y profesional. Disfruta de tu nueva tipografía! ✨
