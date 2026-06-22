import { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonContent } from '@ionic/react';
import { Geolocation } from '@capacitor/geolocation';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import './PermissionsSetup.css';

const LocationTracking = registerPlugin('LocationTracking');

// ============================================
// Slide data
// ============================================
const SLIDE_LOCATION = {
  id: 'location',
  color: '#0066FF',
  colorLight: '#EBF2FF',
  icon: (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="perm-icon-svg">
      <circle cx="40" cy="40" r="40" fill="#EBF2FF" />
      <path d="M40 14C30.06 14 22 22.06 22 32C22 45.5 40 66 40 66C40 66 58 45.5 58 32C58 22.06 49.94 14 40 14ZM40 39C36.13 39 33 35.87 33 32C33 28.13 36.13 25 40 25C43.87 25 47 28.13 47 32C47 35.87 43.87 39 40 39Z" fill="#0066FF" />
    </svg>
  ),
  title: 'Activa tu ubicación',
  subtitle: 'Sin GPS no puedes recibir solicitudes ni ser rastreado por tus clientes durante el servicio.',
  benefits: [
    { emoji: '🎯', text: 'Recibe solicitudes cercanas a tu posición actual' },
    { emoji: '🗺️', text: 'Los clientes siguen tu ruta en tiempo real' },
    { emoji: '⚡', text: 'Más solicitudes gracias a la proximidad' },
  ],
  buttonText: 'Activar ubicación',
};

const SLIDE_NOTIFICATIONS = {
  id: 'notifications',
  color: '#FF6B00',
  colorLight: '#FFF3EB',
  icon: (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="perm-icon-svg">
      <circle cx="40" cy="40" r="40" fill="#FFF3EB" />
      <path d="M40 68C42.21 68 44 66.21 44 64H36C36 66.21 37.79 68 40 68ZM60 48V32C60 21.5 54.37 12.72 44 10.36V8C44 5.79 42.21 4 40 4C37.79 4 36 5.79 36 8V10.36C25.64 12.72 20 21.48 20 32V48L14 54V57H66V54L60 48Z" fill="#FF6B00" />
      <circle cx="56" cy="18" r="8" fill="#FF3B30" stroke="white" strokeWidth="2" />
    </svg>
  ),
  title: 'Activa las notificaciones',
  subtitle: 'Recibe alertas instantáneas de nuevas solicitudes incluso cuando la app está cerrada.',
  benefits: [
    { emoji: '📲', text: 'Alertas al instante aunque no uses el celular' },
    { emoji: '🌙', text: 'Funciona con la app en segundo plano o cerrada' },
    { emoji: '💰', text: 'No pierdas servicios por no ver la pantalla' },
  ],
  buttonText: 'Activar notificaciones',
};

const SLIDE_BATTERY = {
  id: 'battery',
  color: '#F59E0B',
  colorLight: '#FFFBEB',
  icon: (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="perm-icon-svg">
      <circle cx="40" cy="40" r="40" fill="#FFFBEB" />
      <path d="M52 26H50V22H30V26H28C25.79 26 24 27.79 24 30V54C24 56.21 25.79 58 28 58H52C54.21 58 56 56.21 56 54V30C56 27.79 54.21 26 52 26ZM42 50H38V44H32L40 30V36H46L42 50Z" fill="#F59E0B" />
    </svg>
  ),
  title: 'Rendimiento en segundo plano',
  subtitle: 'Permite que Desvare funcione aunque el teléfono esté bloqueado y sigas recibiendo solicitudes.',
  benefits: [
    { emoji: '🔋', text: 'GPS activo aunque el teléfono esté bloqueado' },
    { emoji: '📡', text: 'Los clientes siempre ven tu posición en ruta' },
    { emoji: '🚫', text: 'La app no se cierra al cambiar de aplicación' },
  ],
  buttonText: 'Activar rendimiento',
};

// ============================================
// Helpers para verificar permisos reales
// ============================================
const checkBasePermissions = async () => {
  try {
    const [locPerm, notifPerm] = await Promise.all([
      Geolocation.checkPermissions(),
      PushNotifications.checkPermissions(),
    ]);
    return {
      location: locPerm.location === 'granted',
      notifications: notifPerm.receive === 'granted',
    };
  } catch {
    return { location: false, notifications: false };
  }
};

// ============================================
// Componente principal
// ============================================
const PermissionsSetup = () => {
  const history = useHistory();
  const swiperRef = useRef(null);

  // El slide de batería solo aplica en Android nativo
  const isAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  const SLIDES = isAndroid
    ? [SLIDE_LOCATION, SLIDE_NOTIFICATIONS, SLIDE_BATTERY]
    : [SLIDE_LOCATION, SLIDE_NOTIFICATIONS];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deniedMap, setDeniedMap] = useState({ location: false, notifications: false, battery: false });

  // Al montar, verificar si ya están todos los permisos concedidos
  useEffect(() => {
    const init = async () => {
      const perms = await checkBasePermissions();

      if (perms.location && perms.notifications) {
        // Si es Android, verificar también si la batería ya está exenta
        if (isAndroid) {
          try {
            const { isIgnoring } = await LocationTracking.checkBatteryOptimization();
            if (!isIgnoring) {
              // Loc + notif OK pero batería pendiente → dejar que muestre los slides
              // (el usuario llega al slide de batería al avanzar normalmente)
              return;
            }
          } catch {
            // Si no se puede verificar la batería, NO saltar a Home: dejar que el
            // usuario vea el slide de batería para no perder el permiso de GPS en
            // segundo plano. (Antes esto saltaba a Home y se brincaba el slide.)
            return;
          }
        }
        // Todos los permisos necesarios están concedidos → ir a Home directamente
        localStorage.setItem('permissionsConfigured', 'true');
        history.replace('/home');
      }
    };
    init();
  }, [history, isAndroid]);

  const goToNextSlide = () => {
    if (swiperRef.current) {
      swiperRef.current.slideNext();
    }
  };

  const goToHome = () => {
    localStorage.setItem('permissionsConfigured', 'true');
    history.replace('/home');
  };

  const handleLocationPermission = async () => {
    setLoading(true);
    try {
      const check = await Geolocation.checkPermissions();
      let granted = check.location === 'granted';

      if (!granted && check.location !== 'denied') {
        const result = await Geolocation.requestPermissions({ permissions: ['location', 'coarseLocation'] });
        granted = result.location === 'granted' || result.coarseLocation === 'granted';
      }

      if (granted) {
        try {
          await Geolocation.requestPermissions({ permissions: ['location'] });
        } catch {
          // Background location no crítico
        }
      }

      setDeniedMap((prev) => ({ ...prev, location: !granted }));
      setTimeout(() => goToNextSlide(), 400);
    } catch {
      setDeniedMap((prev) => ({ ...prev, location: true }));
      setTimeout(() => goToNextSlide(), 400);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationsPermission = async () => {
    // En modo DEV (navegador) FCM no está disponible — avanzar directo sin llamada nativa
    if (import.meta.env.VITE_DEV_MODE === 'true') {
      console.log('🔧 [DEV_MODE] Permiso de notificaciones omitido — no disponible en navegador web');
      setTimeout(() => goToHome(), 400);
      return;
    }

    setLoading(true);
    try {
      const check = await PushNotifications.checkPermissions();
      let granted = check.receive === 'granted';

      if (!granted && check.receive !== 'denied') {
        const result = await PushNotifications.requestPermissions();
        granted = result.receive === 'granted';
      }

      setDeniedMap((prev) => ({ ...prev, notifications: !granted }));

      // Si hay slide de batería a continuación, ir a él; si no, ir a Home
      setTimeout(() => {
        if (isAndroid) goToNextSlide();
        else goToHome();
      }, 400);
    } catch {
      setDeniedMap((prev) => ({ ...prev, notifications: true }));
      setTimeout(() => {
        if (isAndroid) goToNextSlide();
        else goToHome();
      }, 400);
    } finally {
      setLoading(false);
    }
  };

  const handleBatteryPermission = async () => {
    setLoading(true);
    try {
      await LocationTracking.requestBatteryOptimization();
    } catch (err) {
      console.warn('⚠️ requestBatteryOptimization no disponible:', err?.message);
    } finally {
      setLoading(false);
    }
    // Después del diálogo nativo (o si falla), ir a Home
    setTimeout(() => goToHome(), 400);
  };

  const handleAction = (slideId) => {
    if (slideId === 'location') return handleLocationPermission();
    if (slideId === 'notifications') return handleNotificationsPermission();
    if (slideId === 'battery') return handleBatteryPermission();
  };

  const handleSkip = () => {
    const isLastSlide = currentSlide === SLIDES.length - 1;
    if (isLastSlide) {
      // Guardar que el conductor pospuso el permiso de batería para no molestar en 24h
      if (SLIDES[currentSlide].id === 'battery') {
        localStorage.setItem('batteryModalDismissedAt', Date.now().toString());
      }
      goToHome();
    } else {
      goToNextSlide();
    }
  };

  const slide = SLIDES[currentSlide];

  return (
    <IonPage>
      <IonContent className="perm-content" scrollY={false}>
        {/* Progress bar */}
        <div className="perm-progress-bar">
          <div
            className="perm-progress-fill"
            style={{ width: `${((currentSlide + 1) / SLIDES.length) * 100}%` }}
          />
        </div>

        {/* Step label */}
        <div className="perm-step-label">
          Paso {currentSlide + 1} de {SLIDES.length}
        </div>

        {/* Swiper (no touch, controlado por botones) */}
        <Swiper
          onSwiper={(swiper) => (swiperRef.current = swiper)}
          onSlideChange={(swiper) => setCurrentSlide(swiper.activeIndex)}
          allowTouchMove={false}
          className="perm-swiper"
        >
          {SLIDES.map((s) => {
            const isDenied = deniedMap[s.id];
            return (
              <SwiperSlide key={s.id}>
                <div className="perm-slide">
                  {/* Icono grande */}
                  <div className="perm-icon-wrapper" style={{ background: s.colorLight }}>
                    {s.icon}
                  </div>

                  {/* Texto */}
                  <div className="perm-text-block">
                    <h1 className="perm-title">{s.title}</h1>
                    <p className="perm-subtitle">{s.subtitle}</p>
                  </div>

                  {/* Beneficios */}
                  <div className="perm-benefits">
                    {s.benefits.map((b, i) => (
                      <div key={i} className="perm-benefit-row">
                        <span className="perm-benefit-emoji">{b.emoji}</span>
                        <span className="perm-benefit-text">{b.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Mensaje si fue denegado */}
                  {isDenied && (
                    <div className="perm-denied-notice">
                      <span>⚠️</span>
                      <p>
                        Permiso denegado. Puedes activarlo manualmente en{' '}
                        <strong>Configuración → Aplicaciones → Desvare</strong>.
                      </p>
                    </div>
                  )}
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>

        {/* Footer con botones */}
        <div className="perm-footer">
          <button
            className="perm-btn-primary"
            style={{ background: slide.color }}
            onClick={() => handleAction(slide.id)}
            disabled={loading}
          >
            {loading ? (
              <span className="perm-btn-spinner" />
            ) : (
              slide.buttonText
            )}
          </button>

          <button
            className="perm-btn-skip"
            onClick={handleSkip}
            disabled={loading}
          >
            Ahora no
          </button>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PermissionsSetup;
