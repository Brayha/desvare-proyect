import { useEffect, useState } from 'react';
import './QuoteNotification.css';

const QuoteNotification = ({ quote, onClose, onViewDetail, duration = 5000 }) => {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 50);

    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      if (onClose) onClose();
    }, 300);
  };

  const handleViewDetail = () => {
    handleClose();
    if (onViewDetail) onViewDetail(quote);
  };

  const formatAmount = (amount) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const renderStars = (rating) => {
    if (!rating) return null;
    const rounded = Math.round(rating * 2) / 2;
    return (
      <div className="qn-stars">
        {'★'.repeat(Math.floor(rounded))}
        {rounded % 1 !== 0 ? '½' : ''}
        <span className="qn-rating-value">{Number(rating).toFixed(1)}</span>
      </div>
    );
  };

  const initials = quote.driverName
    ? quote.driverName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <div className={`qn-card ${visible ? 'qn-visible' : ''} ${closing ? 'qn-closing' : ''}`}>
      {/* Acento de color superior */}
      <div className="qn-accent" />

      <div className="qn-body">
        {/* Avatar */}
        <div className="qn-avatar-wrap">
          {quote.driverPhoto ? (
            <img src={quote.driverPhoto} alt={quote.driverName} className="qn-avatar-img" />
          ) : (
            <div className="qn-avatar-placeholder">{initials}</div>
          )}
          <div className="qn-badge">🚗</div>
        </div>

        {/* Info */}
        <div className="qn-info">
          <p className="qn-label">¡Nueva Cotización!</p>
          <p className="qn-driver-name">{quote.driverName}</p>
          {renderStars(quote.driverRating)}
          {quote.driverServiceCount > 0 && (
            <p className="qn-services">{quote.driverServiceCount} servicios completados</p>
          )}
          <p className="qn-amount">{formatAmount(quote.amount)}</p>
        </div>
      </div>

      {/* Acciones */}
      <div className="qn-actions">
        <button className="qn-btn-secondary" onClick={handleClose}>
          Ignorar
        </button>
        <button className="qn-btn-primary" onClick={handleViewDetail}>
          Ver detalle
        </button>
      </div>

      {/* Barra de progreso */}
      <div className="qn-progress" style={{ animationDuration: `${duration}ms` }} />
    </div>
  );
};

export default QuoteNotification;
