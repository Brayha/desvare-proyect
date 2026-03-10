import { useState, useEffect, useRef } from 'react';
import './InstallBanner.css';

const APP_ICON = '/icons/icon-192x192.png';
const DISMISS_KEY = 'pwaInstallDismissedUntil';
const DISMISS_DAYS = 3; // vuelve a aparecer después de 3 días

/**
 * Banner de instalación PWA.
 * - Siempre visible en móvil si la app no está instalada y no fue descartada recientemente.
 * - Android: usa beforeinstallprompt si está disponible; si no, muestra instrucciones manuales.
 * - iOS: muestra instrucciones (Safari → Compartir → Añadir a pantalla de inicio).
 * - variant 'home': flotante superior con animación desde arriba.
 * - variant 'waiting': flotante superior dentro del mapa.
 */
const InstallBanner = ({ variant = 'home' }) => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const deferredPromptRef = useRef(null);

  useEffect(() => {
    // No mostrar si ya fue descartado recientemente
    const dismissedUntil = localStorage.getItem(DISMISS_KEY);
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) return;

    // No mostrar si ya está instalada como PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (isStandalone) return;

    // Solo mostrar en móvil
    const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
    if (!isMobile) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    // Mostrar el banner siempre en móvil (Android o iOS)
    setShowBanner(true);

    // En Android, capturar el evento nativo por si está disponible
    const handlePrompt = (e) => {
      e.preventDefault();
      deferredPromptRef.current = e;
    };
    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', () => setShowBanner(false));

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPromptRef.current) {
      // Android con soporte nativo: abrir el diálogo del sistema
      deferredPromptRef.current.prompt();
      const { outcome } = await deferredPromptRef.current.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
        deferredPromptRef.current = null;
      }
    } else {
      // iOS o Android sin evento: mostrar/ocultar instrucciones
      setShowSteps((prev) => !prev);
    }
  };

  const handleDismiss = () => {
    const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISS_KEY, String(until));
    setShowBanner(false);
    setShowSteps(false);
  };

  if (!showBanner) return null;

  const installLabel = deferredPromptRef.current
    ? 'Instalar'
    : showSteps
    ? 'Ocultar'
    : 'Cómo instalar';

  return (
    <div className={`ib-banner ib-banner--${variant}`}>
      <div className="ib-main">
        <img src={APP_ICON} alt="Desvare" className="ib-icon" />
        <div className="ib-text">
          <p className="ib-title">Instala Desvare</p>
          <p className="ib-sub">
            {variant === 'waiting'
              ? 'Recibe cotizaciones aunque bloquees tu pantalla'
              : 'Recibe cotizaciones al instante · Gratis'}
          </p>
        </div>
        <div className="ib-actions">
          <button className="ib-btn-install" onClick={handleInstall}>
            {installLabel}
          </button>
          <button className="ib-btn-close" onClick={handleDismiss} aria-label="Cerrar">
            ✕
          </button>
        </div>
      </div>

      {/* Instrucciones paso a paso */}
      {showSteps && (
        <div className="ib-steps">
          {isIOS ? (
            <>
              <p>1. Abre esta página en <strong>Safari</strong></p>
              <p>2. Toca el ícono <strong>Compartir</strong> <span className="ib-share-icon">⎙</span></p>
              <p>3. Selecciona <strong>"Añadir a pantalla de inicio"</strong></p>
              <p>4. Toca <strong>"Añadir"</strong> y listo 🎉</p>
            </>
          ) : (
            <>
              <p>1. Toca el menú <strong>⋮</strong> de tu navegador</p>
              <p>2. Selecciona <strong>"Instalar aplicación"</strong> o <strong>"Añadir a pantalla de inicio"</strong></p>
              <p>3. Toca <strong>"Instalar"</strong> y listo 🎉</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default InstallBanner;
