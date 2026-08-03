# desvare.co — Landing marketing

Sitio estático para [desvare.co](https://www.desvare.co). Convierte visitantes en solicitudes de cotización en [desvare.app/pedir](https://desvare.app/pedir).

## Desarrollo

```bash
cd desvare-co
npm install
npm run dev
```

Abre [http://localhost:4321](http://localhost:4321).

## Build

```bash
npm run build
```

El output queda en `dist/` — listo para subir a tu hosting.

## Deploy

### Opción A — Hosting Colombia (FTP/cPanel)

1. `npm run build`
2. Sube **todo el contenido** de `dist/` a `public_html/` (o la carpeta raíz de tu dominio).

### Opción B — Vercel

1. Nuevo proyecto en Vercel apuntando a la carpeta `desvare-co/`
2. Build command: `npm run build`
3. Output directory: `dist`
4. Dominio custom: `desvare.co`

## Google Analytics

Copia `.env.example` a `.env` y agrega tu ID:

```
PUBLIC_GA4_ID=G-XXXXXXXXXX
```

Los clics en "Cotizar" disparan el evento `click_cotizar`.

## Estructura

```
src/
├── components/   # Nav, Hero, MapQuotes, secciones
├── data/site.ts  # URLs, copy, cotizaciones del mapa
├── layouts/      # Layout base + SEO
└── pages/        # index.astro
public/           # Fuentes, imágenes, logo
```
