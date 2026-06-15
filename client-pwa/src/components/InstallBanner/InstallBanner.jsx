import { useState, useEffect, useRef } from 'react';
import './InstallBanner.css';

const APP_ICON = '/icons/icon-192x192.png';
const DISMISS_KEY = 'pwaInstallDismissedUntil';
const DISMISS_DAYS = 3; // vuelve a aparecer después de 3 días

/**
 * Banner / card de instalación PWA.
 * - Android: usa beforeinstallprompt si está disponible (instalación con un toque);
 *   si no, muestra instrucciones manuales.
 * - iOS: muestra instrucciones (Safari → Compartir → Añadir a pantalla de inicio).
 * - variant 'home'    → banner compacto flotante superior.
 * - variant 'waiting' → card grande, llamativa e interactiva (vista de espera de cotizaciones).
 */
const InstallBanner = ({ variant = 'home' }) => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [canInstallNative, setCanInstallNative] = useState(false);
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
      setCanInstallNative(true);
    };
    const handleInstalled = () => setShowBanner(false);

    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
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
        setCanInstallNative(false);
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

  // Pasos de instalación (reutilizados en ambas variantes)
  const steps = isIOS
    ? [
        <>Abre esta página en <strong>Safari</strong></>,
        <>Toca el ícono <strong>Compartir</strong> <span className="ib-share-icon">⎙</span></>,
        <>Selecciona <strong>"Añadir a pantalla de inicio"</strong></>,
        <>Toca <strong>"Añadir"</strong> y listo 🎉</>,
      ]
    : [
        <>Toca el menú <strong>⋮</strong> de tu navegador</>,
        <>Elige <strong>"Instalar aplicación"</strong> o <strong>"Añadir a pantalla de inicio"</strong></>,
        <>Toca <strong>"Instalar"</strong> y listo 🎉</>,
      ];

  // ── Variante grande / llamativa para la vista de espera ───────────────────
  if (variant === 'waiting') {
    const ctaLabel = canInstallNative
      ? 'Instalar app gratis'
      : showSteps
      ? 'Ocultar pasos'
      : 'Ver cómo instalar';

    return (
      <div className="ib-banner ib-banner--waiting">
        <div className="ib-card">
          <button
            className="ib-card-close"
            onClick={handleDismiss}
            aria-label="Cerrar"
          >
            ✕
          </button>

          <div className="ib-card-head">
            <div className="ib-card-icon-wrap">
              <img src={APP_ICON} alt="Desvare" className="ib-card-icon" />
            </div>
            <div className="ib-card-headtext">
              <span className="ib-card-pill">Gratis</span>
              <h3 className="ib-card-title">Instala la app de Desvare</h3>
              <p className="ib-card-sub">
                Mientras esperas, instálala y no te pierdas ninguna cotización.
              </p>
            </div>
          </div>

          <ul className="ib-card-benefits">
            <li>
              <span className="ib-card-bullet">🔔</span>
              Aviso al instante cuando un conductor responda
            </li>
            <li>
              <span className="ib-card-bullet">📲</span>
              Acceso directo desde tu pantalla de inicio
            </li>
            <li>
              <span className="ib-card-bullet">⚡</span>
              Más rápida y sin ocupar espacio
            </li>
          </ul>

          <button className="ib-card-cta" onClick={handleInstall}>
            <svg
              className="ib-card-cta-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {ctaLabel}
          </button>

          {showSteps && (
            <ol className="ib-card-steps">
              {steps.map((step, i) => (
                <li key={i}>
                  <span className="ib-card-step-num">{i + 1}</span>
                  <span className="ib-card-step-text">{step}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    );
  }

  // ── Variante compacta (home) ──────────────────────────────────────────────
  const installLabel = canInstallNative
    ? 'Instalar'
    : showSteps
    ? 'Ocultar'
    : 'Cómo instalar';

  return (
    <div className="ib-banner ib-banner--home">
      <div className="ib-main">
        <img src={APP_ICON} alt="Desvare" className="ib-icon" />
        <div className="ib-text">
          <p className="ib-title">Instala Desvare</p>
          <p className="ib-sub">Recibe cotizaciones al instante · Gratis</p>
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

      {showSteps && (
        <div className="ib-steps">
          {steps.map((step, i) => (
            <p key={i}>
              {i + 1}. {step}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default InstallBanner;
