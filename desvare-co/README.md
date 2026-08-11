# desvare.co — Landing marketing (HTML estático)

Sitio estático para [desvare.co](https://www.desvare.co). Convierte visitantes en solicitudes de cotización en [desvare.app/pedir](https://desvare.app/pedir).

Basado en el diseño Figma **Desvare-drive-v2** (desktop + mobile).

## Desarrollo local

```bash
cd desvare-co
npm run dev
```

Abre [http://localhost:4321](http://localhost:4321).

## Deploy

1. Sube **todo el contenido** de la carpeta `public/` a la raíz de tu hosting (`public_html/`).
2. Verifica que `index.html` quede en la raíz del dominio.

### Vercel (opcional)

- Root directory: `desvare-co/public`
- Sin build command (sitio estático)
- Dominio: `desvare.co`

## Google Analytics

Edita `public/js/site.js` y agrega tu ID:

```js
export const GA4_ID = 'G-XXXXXXXXXX';
```

Luego descomenta el bloque de GA4 en `public/index.html` (busca `GA4`).

Los clics en "Cotizar" disparan el evento `click_cotizar`.

## Estructura

```
public/
├── index.html          # Landing completa
├── css/
│   ├── global.css      # Tokens, reset, utilidades
│   └── sections.css    # Estilos por sección
├── js/
│   ├── site.js         # URLs, copy, datos de cotizaciones
│   ├── hero-map.js     # Globos de precio animados
│   └── main.js         # Nav, FAQ, reveal, analytics
├── fonts/              # Gilroy
├── maps/               # Capturas Mapbox (hero + pasos)
├── images/             # Fotos de Figma (features, conductores)
├── Desvare.svg
└── icons/
```

## Animaciones

- **Hero:** mapa estático + 7 globos de precio con fade in/out (CSS)
- **Cómo funciona:** mapas estáticos (Fase 3: SVG animados al scroll)

## Próxima fase

Animaciones en las tarjetas de "Cómo funciona":
- Paso 1: ruta que se dibuja
- Paso 2: cotizaciones que aparecen
- Paso 3: grúa moviéndose por la ruta
