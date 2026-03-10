import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import './QuoteSlider.css';

const QuoteSlider = ({ quotes, onQuoteClick, onSlideChange, onCancel }) => {
  const formatAmount = (amount) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const renderStars = (rating) => {
    if (!rating) return '⭐⭐⭐⭐⭐';
    const full = Math.floor(rating);
    const empty = 5 - Math.ceil(rating);
    return '⭐'.repeat(full) + '☆'.repeat(empty);
  };

  return (
    <div className="qs-container">
      <div className="qs-header">
        <span className="qs-count">
          {quotes.length} cotización{quotes.length !== 1 ? 'es' : ''} recibida{quotes.length !== 1 ? 's' : ''}
        </span>
        <span className="qs-hint">Desliza para ver más →</span>
      </div>

      <Swiper
        slidesPerView={1.12}
        spaceBetween={10}
        centeredSlides={false}
        className="qs-swiper"
        onSlideChange={(swiper) => {
          if (onSlideChange) onSlideChange(swiper.activeIndex);
        }}
      >
        {quotes.map((quote, index) => {
          const initials = quote.driverName
            ? quote.driverName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
            : '?';

          return (
            <SwiperSlide key={quote.driverId || index}>
              <div className="qs-card" onClick={() => onQuoteClick(quote)}>
                <div className="qs-card-body">
                  <div className="qs-avatar-wrap">
                    {quote.driverPhoto ? (
                      <img
                        src={quote.driverPhoto}
                        alt={quote.driverName}
                        className="qs-avatar-img"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.textContent = initials;
                        }}
                      />
                    ) : (
                      <div className="qs-avatar-placeholder">{initials}</div>
                    )}
                  </div>

                  <div className="qs-info">
                    <p className="qs-driver-name">{quote.driverName}</p>
                    <p className="qs-stars">{renderStars(quote.driverRating)}</p>
                    {quote.driverServiceCount > 0 && (
                      <p className="qs-services">{quote.driverServiceCount} servicios</p>
                    )}
                  </div>

                  <div className="qs-price-col">
                    <p className="qs-amount">{formatAmount(quote.amount)}</p>
                    <p className="qs-tap-hint">Ver detalle</p>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      <button className="qs-cancel-button" onClick={onCancel}>
        <p>Cancelar búsqueda</p>
      </button>
    </div>
  );
};

export default QuoteSlider;
