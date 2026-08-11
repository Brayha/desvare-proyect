import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { registerServiceWorker } from './services/serviceWorker';

/* Core CSS required for Ionic components */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Shared styles */
import './styles/global.css';
import './styles/variables.css';

/* App styles */
import './index.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    registerServiceWorker().catch((error) => {
      console.error('No se pudo registrar el Service Worker:', error);
    });
  });
}

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

