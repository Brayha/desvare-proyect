import {
  IonModal,
  IonContent,
  IonIcon,
  IonButton,
  IonChip,
  IonText,
  IonSpinner,
} from "@ionic/react";
import { close, star } from "ionicons/icons";
import { Moneys, Refresh2 } from "iconsax-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";

// Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/autoplay";
import "./QuoteDetailSheet.css";

/**
 * Sheet Modal para mostrar detalles de una cotización
 * Permite al usuario revisar información del conductor y aceptar la cotización
 */
const QuoteDetailSheet = ({
  isOpen,
  onDismiss,
  quote,
  onAccept,
  isAccepting = false,
}) => {
  // ✅ Early return (sin hooks innecesarios)
  if (!quote) return null;

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDistance = (distanceKm) => {
    // ✅ Validar que distanceKm existe y es un número
    if (!distanceKm || typeof distanceKm !== "number") {
      return "Calculando...";
    }

    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m`;
    }
    return `${distanceKm.toFixed(1)} km`;
  };

  const formatDuration = (minutes) => {
    // ✅ Validar que minutes existe y es un número
    if (!minutes || typeof minutes !== "number") {
      return "Calculando...";
    }

    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  // Calcular distancia aproximada (temporal - se puede mejorar con API)
  const estimatedDistance = quote.location ? "8.5 km" : "Calculando...";
  const estimatedTime = quote.location ? "15 min" : "Calculando...";

  // ✅ Array de reseñas (en el futuro vendrá del backend: quote.reviews)
  const reviews = [
    {
      id: 1,
      name: "Juan P.",
      rating: "⭐⭐⭐⭐⭐",
      text: "Excelente servicio, muy profesional y rápido. Llegó en el tiempo estimado.",
      date: "Hace 2 semanas",
    },
    {
      id: 2,
      name: "María G.",
      rating: "⭐⭐⭐⭐⭐",
      text: "Muy amable y cuidadoso con mi vehículo. Lo recomiendo 100%.",
      date: "Hace 1 mes",
    },
    {
      id: 3,
      name: "Carlos R.",
      rating: "⭐⭐⭐⭐",
      text: "Buen servicio, aunque llegó 10 minutos tarde. Pero muy profesional.",
      date: "Hace 2 meses",
    },
    {
      id: 4,
      name: "Carlos R.",
      rating: "⭐⭐⭐⭐",
      text: "Buen servicio, aunque llegó 10 minutos tarde. Pero muy profesional.",
      date: "Hace 2 meses",
    },
    {
      id: 5,
      name: "Carlos R.",
      rating: "⭐⭐⭐⭐",
      text: "Buen servicio, aunque llegó 10 minutos tarde. Pero muy profesional.",
      date: "Hace 2 meses",
    },
    {
      id: 6,
      name: "Carlos R.",
      rating: "⭐⭐⭐⭐",
      text: "Buen servicio, aunque llegó 10 minutos tarde. Pero muy profesional.",
      date: "Hace 2 meses",
    },
  ];

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onDismiss}
      breakpoints={[0, 0.3, 0.6, 1]}
      initialBreakpoint={0.3}
      backdropBreakpoint={0.6}
      handle={true}
      handleBehavior="cycle"
      className="quote-detail-sheet"
    >
      <IonContent className="quote-detail-content">
        {/* Resumen - Visible en breakpoint 0.3 */}
        <div className="quote-summary">
          <div className="quote-summary-header">
            <div className="driver-header">
              <div className="driver-avatar">
                {quote.driverName?.charAt(0) || "C"}
              </div>
              <div className="driver-info-compact">
                <h3>{quote.driverName}</h3>
                <div className="rating-compact">
                  <IonIcon icon={star} className="star-icon" />
                  <span>4.8</span>
                  <span className="service-count">(127 servicios)</span>
                </div>
              </div>
            </div>
            <button className="close-button" onClick={onDismiss}>
              <IonIcon icon={close} />
            </button>
          </div>

          <div className="quote-summary-container">
            <div className="box-items">
              <div className="info-items">
                <div className="info-item">
                  <p>Valor</p>
                  <h4>{formatAmount(quote.amount)}</h4>
                </div>
              </div>
              <div className="info-items">
                <div className="info-item">
                  <p>Distancia</p>
                  <h4>
                    {quote.distanceKm
                      ? formatDistance(quote.distanceKm)
                      : estimatedDistance}
                  </h4>
                </div>
              </div>
              <div className="info-items">
                <div className="info-item">
                  <p>Tiempo est.</p>
                  <h4>
                    {quote.durationMin
                      ? formatDuration(quote.durationMin)
                      : estimatedTime}
                  </h4>
                </div>
              </div>
            </div>
            <div className="type-payment-method">
              <Moneys size="24" variant="Bold" color="#22C55E" />
              <div className="payment-info">
                <p>Método de pago</p>
                <h4>Efectivo</h4>
              </div>
              {/* <Refresh2 size="20" variant="Outline" color="#667eea" /> */}
            </div>
          </div>
        </div>

        {/* Reviews Slider con Swiper */}
        <div className="quote-reviews">
          <div className="section">
            <h4>Reseñas Recientes</h4>

            <Swiper
              modules={[Pagination, Autoplay]}
              autoplay={{
                delay: 2000, // 2 segundos
                disableOnInteraction: false, // Continúa después de interacción
              }}
              slidesPerView={1.2} // Muestra 1 completa + 0.2 de la siguiente
              spaceBetween={10}
              centeredSlides={true}
              className="reviews-swiper"
              loop={true}
            >
              {reviews.map((review) => (
                <SwiperSlide key={review.id}>
                  <div className="review-item-slider">
                    <div className="review-header">
                      <span className="reviewer-name">{review.name}</span>
                      <span className="review-stars">{review.rating}</span>
                    </div>
                    <p className="review-text">{review.text}</p>
                    <p className="review-date">{review.date}</p>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          <div className="button-actions">
            <button
              expand="block"
              size="large"
              onClick={() => onAccept(quote)}
              disabled={isAccepting}
              className="accept-button"
            >
              {isAccepting ? (
                <>
                  <IonSpinner name="crescent" />
                  <span style={{ marginLeft: "8px" }}>Aceptando...</span>
                </>
              ) : (
                `Aceptar por ${formatAmount(quote.amount)}`
              )}
            </button>

            <button
              expand="block"
              fill="clear"
              onClick={onDismiss}
              disabled={isAccepting}
              className="cancel-button"
            >
              Cancelar
            </button>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default QuoteDetailSheet;
