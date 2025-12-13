import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonContent, IonButton } from '@ionic/react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import { ArrowRight2 } from 'iconsax-react';

// Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import './Onboarding.css';

const Onboarding = () => {
  const history = useHistory();
  const [swiper, setSwiper] = useState(null);
  const [isLastSlide, setIsLastSlide] = useState(false);

  const slides = [
    {
      id: 1,
      title: 'Bienvenido a Desvare',
      subtitle: 'La plataforma que conecta conductores de grúa con clientes',
      image: '🚛',
      color: '#0066FF'
    },
    {
      id: 2,
      title: 'Recibe Solicitudes',
      subtitle: 'Obtén notificaciones en tiempo real de clientes cercanos que necesitan tus servicios',
      image: '📱',
      color: '#00C853'
    },
    {
      id: 3,
      title: 'Cotiza y Gana',
      subtitle: 'Envía tu cotización y comienza a generar ingresos de forma inmediata',
      image: '💰',
      color: '#FF6B00'
    },
    {
      id: 4,
      title: 'Trabaja con Seguridad',
      subtitle: 'Todos los servicios están asegurados y verificados para tu tranquilidad',
      image: '🛡️',
      color: '#9C27B0'
    }
  ];

  const handleSlideChange = (swiper) => {
    setIsLastSlide(swiper.isEnd);
  };

  const handleNext = () => {
    if (isLastSlide) {
      // Marcar que ya vio el onboarding
      localStorage.setItem('hasSeenOnboarding', 'true');
      history.replace('/login');
    } else if (swiper) {
      swiper.slideNext();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    history.replace('/login');
  };

  return (
    <IonPage>
      <IonContent className="onboarding-content">
        {/* Botón Skip */}
        {!isLastSlide && (
          <div className="onboarding-skip">
            <button className="skip-button" onClick={handleSkip}>
              Omitir
            </button>
          </div>
        )}

        {/* Swiper */}
        <Swiper
          modules={[Pagination]}
          pagination={{
            clickable: true,
            dynamicBullets: false,
          }}
          onSwiper={setSwiper}
          onSlideChange={handleSlideChange}
          className="onboarding-swiper"
        >
          {slides.map((slide) => (
            <SwiperSlide key={slide.id}>
              <div className="slide-content">
                {/* Emoji como imagen */}
                <div
                  className="slide-image"
                  style={{ background: `${slide.color}15` }}
                >
                  <span className="slide-emoji">{slide.image}</span>
                </div>

                {/* Texto */}
                <div className="slide-text">
                  <h1 className="slide-title">{slide.title}</h1>
                  <p className="slide-subtitle">{slide.subtitle}</p>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Botón de acción */}
        <div className="onboarding-footer">
          <IonButton
            expand="block"
            className="onboarding-button"
            onClick={handleNext}
          >
            {isLastSlide ? 'Comenzar' : 'Siguiente'}
            <ArrowRight2 size="20" style={{ marginLeft: '8px' }} />
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Onboarding;

