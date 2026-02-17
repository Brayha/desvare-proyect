import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { IonContent, IonPage } from "@ionic/react";
import socketService from "../services/socket";
import mapBg from "../assets/img/map-home-responsive.png";
import logo from "../assets/img/Desvare.svg";
import "./Home.css";

/* ─── Iconos inline SVG (sin librerías externas = carga instantánea) ─── */
const IconLocation = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#0055ff"/>
    <circle cx="12" cy="9" r="2.5" fill="#fff"/>
  </svg>
);

const IconBolt = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M13 2L4.09 12.11c-.37.42-.09 1.06.46 1.06H11v8.17c0 .68.82.99 1.27.49L21 12.11c.37-.42.09-1.06-.46-1.06H14V2.83C14 2.15 13.18 1.84 12.73 2.34L13 2z" fill="currentColor"/>
  </svg>
);

const IconShield = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5L12 2z" fill="currentColor"/>
    <path d="M10 13l-2-2-1.5 1.5L10 16l6-6-1.5-1.5L10 13z" fill="#fff"/>
  </svg>
);

const IconTag = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58s1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41s-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z" fill="currentColor"/>
  </svg>
);

const IconMap = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" fill="currentColor"/>
  </svg>
);

const IconCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
  </svg>
);

const IconTruck = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zm-.5 1.5l1.96 2.5H17V9.5h2.5zM6 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm11 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" fill="currentColor"/>
  </svg>
);

const IconStar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
  </svg>
);

const IconArrow = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="currentColor"/>
  </svg>
);

/* ─────────────────────────────────────── */

const Home = () => {
  const history = useHistory();
  const [navScrolled, setNavScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  /* Registrar cliente con socket si está autenticado */
  useEffect(() => {
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      socketService.registerClient(parsedUser.id);
    }
  }, []);

  /* Detectar scroll para cambiar navbar */
  const handleScroll = (e) => {
    const scrollTop = e.detail?.scrollTop ?? 0;
    setNavScrolled(scrollTop > 60);
  };

  /* CTA principal: verifica permisos de geolocalización */
  const handleRequestTowTruck = async () => {
    try {
      if (navigator.permissions?.query) {
        const result = await navigator.permissions.query({ name: "geolocation" });
        if (result.state === "granted") {
          localStorage.setItem("locationPermission", "granted");
          history.push("/tabs/desvare");
        } else {
          history.push("/location-permission");
        }
      } else {
        const locationPermission = localStorage.getItem("locationPermission");
        history.push(locationPermission === "granted" ? "/tabs/desvare" : "/location-permission");
      }
    } catch {
      history.push("/location-permission");
    }
  };

  /* Toggle FAQ */
  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  /* ──── Contenido ──── */
  const features = [
    {
      icon: <IconTag />,
      title: "Precios Transparentes",
      desc: "Ves el precio antes de aceptar. Sin sorpresas, sin cobros ocultos.",
    },
    {
      icon: <IconBolt />,
      title: "Respuesta en Minutos",
      desc: "Conductores cercanos reciben tu solicitud al instante y responden rápido.",
    },
    {
      icon: <IconShield />,
      title: "Conductores Verificados",
      desc: "Todos pasan un proceso de verificación de identidad y vehículo.",
    },
    {
      icon: <IconMap />,
      title: "Seguimiento en Vivo",
      desc: "Sigue en el mapa exactamente dónde está tu grúa en tiempo real.",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Comparte tu ubicación",
      desc: "Dinos dónde estás y qué tipo de vehículo tienes.",
    },
    {
      number: "02",
      title: "Recibe cotizaciones",
      desc: "En segundos, conductores cercanos te envían sus precios.",
    },
    {
      number: "03",
      title: "Elige y sigue tu grúa",
      desc: "Acepta la mejor oferta y sigue al conductor en el mapa.",
    },
  ];

  const driverBenefits = [
    "App 100% gratuita para conductores",
    "Recibe solicitudes cerca de ti",
    "Tú decides cuándo y cuánto cobrar",
    "Pagos directos sin intermediarios",
    "Construye tu reputación con calificaciones",
    "Soporte dedicado",
  ];

  const faqs = [
    {
      q: "¿Cuánto tiempo demora en llegar la grúa?",
      a: "El tiempo varía según la disponibilidad de conductores en tu zona. En promedio, recibirás la primera cotización en menos de 5 minutos después de hacer tu solicitud.",
    },
    {
      q: "¿Cómo se calculan los precios?",
      a: "Cada conductor establece su propio precio basado en la distancia, el tipo de vehículo y la hora. Tú comparas todas las cotizaciones y eliges la que más te conviene.",
    },
    {
      q: "¿Puedo cancelar una solicitud?",
      a: "Sí, puedes cancelar tu solicitud mientras estés en la pantalla de espera de cotizaciones, antes de aceptar una oferta. Una vez aceptada una cotización, deberás coordinarlo directamente con el conductor.",
    },
    {
      q: "¿Los conductores están verificados?",
      a: "Sí. Antes de operar en Desvare, cada conductor pasa por un proceso de verificación de identidad, licencia y estado del vehículo. Además, las calificaciones de otros usuarios ayudan a mantener la calidad del servicio.",
    },
    {
      q: "¿En qué ciudades opera Desvare?",
      a: "Actualmente estamos operando en Colombia y expandiéndonos continuamente. Si no encuentras conductores en tu zona, regístrate y te avisaremos cuando lleguemos a tu ciudad.",
    },
  ];

  return (
    <IonPage>
      <IonContent
        fullscreen
        scrollEvents={true}
        onIonScroll={handleScroll}
        className="lp-ion-content"
      >
        {/* ═══════════════════════════════════════════
            NAVBAR
        ═══════════════════════════════════════════ */}
        <nav className={`lp-nav ${navScrolled ? "lp-nav--solid" : ""}`} role="navigation" aria-label="Navegación principal">
          <div className="lp-nav__inner">
            <a href="/home" className="lp-nav__logo" aria-label="Desvare - Inicio">
              <img src={logo} alt="Desvare" width="120" height="36" />
            </a>
            <div className="lp-nav__links" role="list">
              <a href="#como-funciona" className="lp-nav__link" role="listitem">Cómo funciona</a>
              <a href="#conductores" className="lp-nav__link" role="listitem">Para conductores</a>
            </div>
            <div className="lp-nav__actions">
              <button
                className="lp-btn lp-btn--ghost"
                onClick={() => history.push("/login")}
              >
                Iniciar sesión
              </button>
              <button
                className="lp-btn lp-btn--primary"
                onClick={handleRequestTowTruck}
              >
                Pedir grúa
              </button>
            </div>
            {/* Mobile: solo botón CTA */}
            <button
              className="lp-btn lp-btn--primary lp-nav__cta-mobile"
              onClick={handleRequestTowTruck}
            >
              Pedir grúa
            </button>
          </div>
        </nav>

        {/* ═══════════════════════════════════════════
            HERO
        ═══════════════════════════════════════════ */}
        <section className="lp-hero" aria-label="Solicita tu grúa">
          {/* Mapa como fondo */}
          <div className="lp-hero__map" aria-hidden="true">
            <img
              src={mapBg}
              alt=""
              className="lp-hero__map-img"
              fetchpriority="high"
              decoding="async"
            />
            <div className="lp-hero__map-overlay" />
          </div>

          {/* Pin central con pulso */}
          <div className="lp-hero__pin" aria-hidden="true">
            <div className="lp-hero__pin-pulse" />
            <div className="lp-hero__pin-pulse lp-hero__pin-pulse--delay" />
            <IconLocation />
          </div>

          {/* Cotizaciones flotantes */}
          <div className="lp-hero__quotes" aria-hidden="true">
            <div className="lp-quote lp-quote--1">
              <span className="lp-quote__avatar">🚛</span>
              <div>
                <p className="lp-quote__name">Carlos M.</p>
                <p className="lp-quote__price">$80.000</p>
              </div>
              <span className="lp-quote__star"><IconStar /> 4.9</span>
            </div>
            <div className="lp-quote lp-quote--2">
              <span className="lp-quote__avatar">🚛</span>
              <div>
                <p className="lp-quote__name">Andrés R.</p>
                <p className="lp-quote__price">$100.000</p>
              </div>
              <span className="lp-quote__star"><IconStar /> 4.7</span>
            </div>
            <div className="lp-quote lp-quote--3">
              <span className="lp-quote__avatar">🚛</span>
              <div>
                <p className="lp-quote__name">Luis F.</p>
                <p className="lp-quote__price">$120.000</p>
              </div>
              <span className="lp-quote__star"><IconStar /> 4.8</span>
            </div>
          </div>

          {/* Card inferior con CTA */}
          <div className="lp-hero__card">
            <h1 className="lp-hero__title">
              Pide tu grúa<br />
              <span className="lp-hero__title--accent">en minutos</span>
            </h1>
            <p className="lp-hero__desc">
              Cotiza en tiempo real, compara precios y recibe ayuda al instante.
            </p>
            <button
              className="lp-btn lp-btn--primary lp-btn--large lp-btn--full"
              onClick={handleRequestTowTruck}
            >
              Cotizar servicio de grúa
              <IconArrow />
            </button>
            <p className="lp-hero__disclaimer">Gratis · Sin registro previo · Colombia</p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            STATS
        ═══════════════════════════════════════════ */}
        <section className="lp-stats" aria-label="Estadísticas de Desvare">
          <div className="lp-container">
            <div className="lp-stats__grid">
              <div className="lp-stat">
                <p className="lp-stat__number">100+</p>
                <p className="lp-stat__label">Conductores activos</p>
              </div>
              <div className="lp-stat lp-stat--divider">
                <p className="lp-stat__number">4.8 <span className="lp-stat__icon">★</span></p>
                <p className="lp-stat__label">Calificación promedio</p>
              </div>
              <div className="lp-stat lp-stat--divider">
                <p className="lp-stat__number">&lt; 5 min</p>
                <p className="lp-stat__label">Primera cotización</p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            CÓMO FUNCIONA
        ═══════════════════════════════════════════ */}
        <section id="como-funciona" className="lp-how" aria-labelledby="how-title">
          <div className="lp-container">
            <div className="lp-section-header">
              <p className="lp-section-label">Simple y rápido</p>
              <h2 id="how-title" className="lp-section-title">¿Cómo funciona?</h2>
              <p className="lp-section-desc">
                En 3 pasos tienes una grúa camino a donde estás.
              </p>
            </div>
            <div className="lp-how__steps">
              {steps.map((step, i) => (
                <div key={i} className="lp-step">
                  <div className="lp-step__number" aria-hidden="true">{step.number}</div>
                  <div className="lp-step__content">
                    <h3 className="lp-step__title">{step.title}</h3>
                    <p className="lp-step__desc">{step.desc}</p>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="lp-step__connector" aria-hidden="true" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            VENTAJAS
        ═══════════════════════════════════════════ */}
        <section className="lp-features" aria-labelledby="features-title">
          <div className="lp-container">
            <div className="lp-section-header">
              <p className="lp-section-label">Por qué elegirnos</p>
              <h2 id="features-title" className="lp-section-title">Todo lo que necesitas</h2>
            </div>
            <div className="lp-features__grid">
              {features.map((f, i) => (
                <div key={i} className="lp-feature-card">
                  <div className="lp-feature-card__icon" aria-hidden="true">
                    {f.icon}
                  </div>
                  <h3 className="lp-feature-card__title">{f.title}</h3>
                  <p className="lp-feature-card__desc">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            SECCIÓN CONDUCTORES
        ═══════════════════════════════════════════ */}
        <section id="conductores" className="lp-drivers" aria-labelledby="drivers-title">
          <div className="lp-container">
            <div className="lp-drivers__inner">
              <div className="lp-drivers__content">
                <p className="lp-section-label lp-section-label--light">Para conductores</p>
                <h2 id="drivers-title" className="lp-section-title lp-section-title--light">
                  ¿Tienes una grúa?<br />Gana más con Desvare
                </h2>
                <p className="lp-drivers__desc">
                  Aumenta tus ingresos llegando a más clientes en tu ciudad. 
                  Nuestra app es completamente gratuita y los pagos son directos.
                </p>
                <ul className="lp-drivers__benefits" role="list">
                  {driverBenefits.map((b, i) => (
                    <li key={i} className="lp-drivers__benefit" role="listitem">
                      <span className="lp-drivers__benefit-icon" aria-hidden="true">
                        <IconCheck />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
                <a
                  href="https://driver.desvare.app/register"
                  className="lp-btn lp-btn--white lp-btn--large"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <IconTruck />
                  Registrarme como conductor
                </a>
              </div>
              <div className="lp-drivers__visual" aria-hidden="true">
                <div className="lp-drivers__visual-card">
                  <div className="lp-drivers__visual-header">
                    <span className="lp-drivers__visual-dot" />
                    <span className="lp-drivers__visual-dot" />
                    <span className="lp-drivers__visual-dot" />
                  </div>
                  <div className="lp-drivers__mockup">
                    <div className="lp-drivers__mockup-stat">
                      <p className="lp-drivers__mockup-label">Esta semana</p>
                      <p className="lp-drivers__mockup-value">$485.000</p>
                    </div>
                    <div className="lp-drivers__mockup-row">
                      <span>Servicios realizados</span>
                      <strong>7</strong>
                    </div>
                    <div className="lp-drivers__mockup-row">
                      <span>Calificación</span>
                      <strong>⭐ 4.9</strong>
                    </div>
                    <div className="lp-drivers__mockup-row">
                      <span>Estado</span>
                      <span className="lp-badge lp-badge--active">Activo</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            FAQ
        ═══════════════════════════════════════════ */}
        <section className="lp-faq" aria-labelledby="faq-title">
          <div className="lp-container lp-container--narrow">
            <div className="lp-section-header">
              <p className="lp-section-label">Resolvemos tus dudas</p>
              <h2 id="faq-title" className="lp-section-title">Preguntas frecuentes</h2>
            </div>
            <div className="lp-faq__list" role="list">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className={`lp-faq__item ${openFaq === i ? "lp-faq__item--open" : ""}`}
                  role="listitem"
                >
                  <button
                    className="lp-faq__question"
                    onClick={() => toggleFaq(i)}
                    aria-expanded={openFaq === i}
                    aria-controls={`faq-answer-${i}`}
                  >
                    {faq.q}
                    <span className="lp-faq__icon" aria-hidden="true">
                      {openFaq === i ? "−" : "+"}
                    </span>
                  </button>
                  <div
                    id={`faq-answer-${i}`}
                    className="lp-faq__answer"
                    role="region"
                    aria-hidden={openFaq !== i}
                  >
                    <p>{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            CTA FINAL
        ═══════════════════════════════════════════ */}
        <section className="lp-cta-final" aria-labelledby="cta-title">
          <div className="lp-container lp-container--narrow">
            <h2 id="cta-title" className="lp-cta-final__title">
              ¿Necesitas una grúa ahora?
            </h2>
            <p className="lp-cta-final__desc">
              En minutos tendrás cotizaciones reales de conductores cerca de ti.
            </p>
            <button
              className="lp-btn lp-btn--primary lp-btn--large"
              onClick={handleRequestTowTruck}
            >
              Solicitar grúa ahora
              <IconArrow />
            </button>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            FOOTER
        ═══════════════════════════════════════════ */}
        <footer className="lp-footer" role="contentinfo">
          <div className="lp-container">
            <div className="lp-footer__top">
              <div className="lp-footer__brand">
                <img src={logo} alt="Desvare" width="110" height="33" className="lp-footer__logo" />
                <p className="lp-footer__tagline">
                  La forma más fácil de pedir grúa en Colombia.
                </p>
              </div>
              <nav className="lp-footer__links" aria-label="Links del footer">
                <div className="lp-footer__col">
                  <p className="lp-footer__col-title">Producto</p>
                  <a href="#como-funciona" className="lp-footer__link">Cómo funciona</a>
                  <a href="#conductores" className="lp-footer__link">Para conductores</a>
                  <a href="https://driver.desvare.app" className="lp-footer__link" target="_blank" rel="noopener noreferrer">App conductores</a>
                </div>
                <div className="lp-footer__col">
                  <p className="lp-footer__col-title">Cuenta</p>
                  <button className="lp-footer__link" onClick={() => history.push("/login")}>Iniciar sesión</button>
                  <button className="lp-footer__link" onClick={() => history.push("/register")}>Registrarse</button>
                </div>
              </nav>
            </div>
            <div className="lp-footer__bottom">
              <p className="lp-footer__copy">
                © {new Date().getFullYear()} Desvare. Todos los derechos reservados.
              </p>
              <div className="lp-footer__legal">
                <a href="#" className="lp-footer__link">Términos y condiciones</a>
                <a href="#" className="lp-footer__link">Política de privacidad</a>
              </div>
            </div>
          </div>
        </footer>

      </IonContent>
    </IonPage>
  );
};

export default Home;
