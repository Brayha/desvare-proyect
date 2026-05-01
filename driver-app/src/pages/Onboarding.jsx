import { useState, useEffect, useRef, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonContent } from '@ionic/react';

import isotipoSvg from '../assets/img/onboarding/isotipo.svg';
import slide1 from '../assets/img/onboarding/slide-1.png';
import slide2 from '../assets/img/onboarding/slide-2.png';
import slide3 from '../assets/img/onboarding/slide-3.png';
import slide4 from '../assets/img/onboarding/slide-4.png';

import './Onboarding.css';

const SLIDE_DURATION = 5000;

const SLIDES = [
  {
    image: slide1,
    title: 'Recibe servicios de grúa en tu zona',
    subtitle: 'Recibe solicitudes en tiempo real y decide a cuáles quieres cotizar.',
  },
  {
    image: slide2,
    title: 'Tú pones el precio',
    subtitle: 'Revisa los detalles del servicio y envía tu cotización del rescate.',
  },
  {
    image: slide3,
    title: 'Servicio confirmado, cliente asignado',
    subtitle: 'Cuando el cliente acepta tu cotización, te mostramos la ubicación exacta y los datos de contacto.',
  },
  {
    image: slide4,
    title: 'Construye tu reputación',
    subtitle: 'Al finalizar el servicio, el cliente te califica. Un buen puntaje te da más visibilidad y más solicitudes.',
  },
];

const Onboarding = () => {
  const history = useHistory();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imgKey, setImgKey] = useState(0);
  const timerRef = useRef(null);
  const isLast = currentIndex === SLIDES.length - 1;

  const finishOnboarding = useCallback(() => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    history.replace('/login');
  }, [history]);

  const advanceTo = useCallback((nextIndex) => {
    if (nextIndex >= SLIDES.length) {
      finishOnboarding();
      return;
    }
    if (nextIndex < 0) return;
    clearTimeout(timerRef.current);
    setCurrentIndex(nextIndex);
    setImgKey((k) => k + 1);
  }, [finishOnboarding]);

  // Auto-avance (se pausa en el último slide para que el usuario vea el botón)
  useEffect(() => {
    if (isLast) return;
    timerRef.current = setTimeout(() => advanceTo(currentIndex + 1), SLIDE_DURATION);
    return () => clearTimeout(timerRef.current);
  }, [currentIndex, isLast, advanceTo]);

  const handleTap = (e) => {
    const x = e.clientX;
    const half = window.innerWidth / 2;
    if (x < half) {
      advanceTo(currentIndex - 1);
    } else {
      advanceTo(currentIndex + 1);
    }
  };

  const handleIngresar = (e) => {
    e.stopPropagation();
    finishOnboarding();
  };

  const slide = SLIDES[currentIndex];

  return (
    <IonPage>
      <IonContent className="stories-content" scrollY={false}>
        <div className="stories-container" onClick={handleTap}>

          {/* Imagen de fondo con fade al cambiar */}
          <img
            key={imgKey}
            src={slide.image}
            alt={slide.title}
            className="stories-bg"
          />

          {/* Degradado oscuro */}
          <div className="stories-overlay" />

          {/* Parte superior: barras + isotipo */}
          <div className="stories-top">
            <div className="stories-bars">
              {SLIDES.map((_, i) => (
                <div key={i} className="stories-bar-track">
                  <div
                    className={`stories-bar-fill ${
                      i < currentIndex
                        ? 'stories-bar-done'
                        : i === currentIndex
                        ? 'stories-bar-active'
                        : ''
                    }`}
                    style={
                      i === currentIndex
                        ? { animationDuration: `${SLIDE_DURATION}ms` }
                        : {}
                    }
                  />
                </div>
              ))}
            </div>
            <img src={isotipoSvg} alt="Desvare" className="stories-isotipo" />
          </div>

          {/* Parte inferior: texto + botón */}
          <div className="stories-bottom">
            <h1 className="stories-title">{slide.title}</h1>
            <p className="stories-subtitle">{slide.subtitle}</p>
            {isLast && (
              <button className="stories-cta" onClick={handleIngresar}>
                Ingresar
              </button>
            )}
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default Onboarding;
