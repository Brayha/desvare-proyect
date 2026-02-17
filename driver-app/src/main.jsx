import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Estilos globales (PRIMERO)
import './styles/global.css'

// Estilos locales
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
