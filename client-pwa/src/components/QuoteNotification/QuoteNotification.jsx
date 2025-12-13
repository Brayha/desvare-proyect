import { useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { cash, person, locationOutline, closeCircle } from 'ionicons/icons';
import './QuoteNotification.css';

/**
 * Componente de notificación para cotizaciones recibidas
 * Muestra un banner animado con información de la cotización
 */
const QuoteNotification = ({ quote, onClose, duration = 5000 }) => {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    // Animación de entrada
    setTimeout(() => setVisible(true), 50);

    // Auto-cerrar después del duration
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

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className={`quote-notification ${visible ? 'visible' : ''} ${closing ? 'closing' : ''}`}>
      <div className="notification-content">
        {/* Icono de alerta */}
        <div className="notification-icon">
          💰
        </div>

        {/* Información de la cotización */}
        <div className="notification-body">
          <h3 className="notification-title">¡Nueva Cotización!</h3>
          
          <div className="notification-info">
            <IonIcon icon={person} className="info-icon" />
            <span className="info-text">{quote.driverName}</span>
          </div>

          <div className="notification-info">
            <IonIcon icon={cash} className="info-icon" />
            <span className="info-text bold">{formatAmount(quote.amount)}</span>
          </div>

          {quote.location && (
            <div className="notification-info">
              <IonIcon icon={locationOutline} className="info-icon" />
              <span className="info-text small">Ver en el mapa</span>
            </div>
          )}
        </div>

        {/* Botón de cerrar */}
        <button className="notification-close" onClick={handleClose}>
          <IonIcon icon={closeCircle} />
        </button>
      </div>

      {/* Barra de progreso */}
      <div 
        className="notification-progress" 
        style={{ animationDuration: `${duration}ms` }}
      />
    </div>
  );
};

export default QuoteNotification;
