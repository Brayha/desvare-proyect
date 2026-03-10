import { useState, useEffect } from 'react';

const appIcon = '/icons/icon-192x192.png';
import './InstallBanner.css';

/**
 * Banner de instalación PWA.
 * - Android: usa beforeinstallprompt para instalar directamente.
 * - iOS: muestra instrucciones (Safari → Compartir → Añadir a pantalla de inicio).
 * - variant 'home': flotante en la parte inferior.
 * - variant 'waiting': flotante en la parte superior (reemplaza card SMS).
 */
const InstallBanner = ({ variant = 'home' }) => {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSSteps, setShowIOSSteps] = useState(false);

  useEffect(() => {
    // No mostrar si ya fue descartado
    if (localStorage.getItem('pwaInstallDismissed')) return;

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

    if (ios) {
      // En iOS no hay evento beforeinstallprompt; mostrar directamente
      setShowBanner(true);
      return;
    }

    // Android: esperar el evento beforeinstallprompt
    const handlePrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handlePrompt);

    // Si la PWA se instala, ocultar el banner
    window.addEventListener('appinstalled', () => setShowBanner(false));

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSSteps((prev) => !prev);
      return;
    }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
        setDeferredPrompt(null);
      }
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwaInstallDismissed', 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className={`ib-banner ib-banner--${variant}`}>
      <div className="ib-main">
        <img src={appIcon} alt="Desvare" className="ib-icon" />
        <div className="ib-text">
          <p className="ib-title">Instala Desvare</p>
          <p className="ib-sub">
            {variant === 'waiting'
              ? 'Recibe las cotizaciones aunque bloquees tu pantalla'
              : 'Recibe cotizaciones al instante · Gratis'}
          </p>
        </div>
        <div className="ib-actions">
          <button className="ib-btn-install" onClick={handleInstall}>
            {isIOS ? 'Cómo instalar' : 'Instalar'}
          </button>
          <button className="ib-btn-close" onClick={handleDismiss} aria-label="Cerrar">
            ✕
          </button>
        </div>
      </div>

      {/* Instrucciones para iOS */}
      {isIOS && showIOSSteps && (
        <div className="ib-ios-steps">
          <p>1. Toca el ícono <strong>Compartir</strong> <span className="ib-share-icon">⎙</span> en Safari</p>
          <p>2. Selecciona <strong>"Añadir a pantalla de inicio"</strong></p>
          <p>3. Toca <strong>"Añadir"</strong> y listo 🎉</p>
        </div>
      )}
    </div>
  );
};

export default InstallBanner;
