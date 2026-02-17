import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonContent, IonButton } from '@ionic/react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import { ArrowRight2 } from 'iconsax-react';

// Importar imágenes SVG del onboarding
import onboarding1 from '../assets/img/onboarding-1.svg';
import onboarding2 from '../assets/img/onboarding-2.svg';
import onboarding3 from '../assets/img/onboarding-3.svg';
import onboarding4 from '../assets/img/onboarding-4.svg';

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
      title: 'Recibe servicios de grúa en tu zona',
      subtitle: 'Recibe solicitudes en tiempo real y decide a cuáles quieres cotizar.',
      image: onboarding1,
      color: '#0066FF'
    },
    {
      id: 2,
      title: 'Tú pones el precio',
      subtitle: 'Revisa los detalles del servicio y envía tu cotización del rescate.',
      image: onboarding2,
      color: '#00C853'
    },
    {
      id: 3,
      title: 'Servicio confirmado, cliente asignado',
      subtitle: 'Cuando el cliente acepta tu cotización, te mostramos la ubicación exacta y los datos de contacto.',
      image: onboarding3,
      color: '#FF6B00'
    },
    {
      id: 4,
      title: 'Construye tu reputación',
      subtitle: 'Al finalizar el servicio, el cliente te califica, un buen puntaje te da más visibilidad y más solicitudes.',
      image: onboarding4,
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
                {/* Imagen SVG */}
                <div
                  className="slide-image"
                >
                  <img src={slide.image} alt={slide.title} className="slide-svg" />
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
          <button
            expand="block"
            className="onboarding-button"
            onClick={handleNext}
          >
            {isLastSlide ? 'Comenzar' : 'Siguiente'}
          </button>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Onboarding;

