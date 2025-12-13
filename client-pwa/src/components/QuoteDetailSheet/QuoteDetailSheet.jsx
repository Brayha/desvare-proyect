import { IonModal, IonContent, IonIcon, IonButton, IonChip, IonText, IonSpinner } from '@ionic/react';
import { close, star, location, call, checkmarkCircle } from 'ionicons/icons';
import './QuoteDetailSheet.css';

/**
 * Sheet Modal para mostrar detalles de una cotización
 * Permite al usuario revisar información del conductor y aceptar la cotización
 */
const QuoteDetailSheet = ({ 
  isOpen, 
  onDismiss, 
  quote, 
  onAccept,
  isAccepting = false 
}) => {
  if (!quote) return null;

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDistance = (distanceKm) => {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m`;
    }
    return `${distanceKm.toFixed(1)} km`;
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  // Calcular distancia aproximada (temporal - se puede mejorar con API)
  const estimatedDistance = quote.location ? '8.5 km' : 'Calculando...';
  const estimatedTime = quote.location ? '15 min' : 'Calculando...';

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
        {/* Header - Visible en todos los breakpoints */}
        <div className="sheet-header">
          <button className="close-button" onClick={onDismiss}>
            <IonIcon icon={close} />
          </button>
        </div>

        {/* Resumen - Visible en breakpoint 0.3 */}
        <div className="quote-summary">
          <div className="driver-header">
            <div className="driver-avatar">
              {quote.driverName?.charAt(0) || 'C'}
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

          <div className="price-highlight">
            <span className="price-label">Cotización</span>
            <span className="price-amount">{formatAmount(quote.amount)}</span>
          </div>

          <div className="quick-info">
            <div className="info-item">
              <IonIcon icon={location} />
              <span>{estimatedTime} • {estimatedDistance}</span>
            </div>
          </div>
        </div>

        {/* Detalles - Visible desde breakpoint 0.6 */}
        <div className="quote-details">
          <div className="section">
            <h4>Información del Conductor</h4>
            <div className="detail-grid">
              <div className="detail-item">
                <IonIcon icon={star} className="detail-icon" />
                <div>
                  <p className="detail-label">Calificación</p>
                  <p className="detail-value">⭐ 4.8 (127 servicios)</p>
                </div>
              </div>
              <div className="detail-item">
                <IonIcon icon={checkmarkCircle} className="detail-icon" />
                <div>
                  <p className="detail-label">Miembro desde</p>
                  <p className="detail-value">2023</p>
                </div>
              </div>
            </div>
          </div>

          <div className="section">
            <h4>Información de la Grúa</h4>
            <div className="truck-info">
              <p><strong>Tipo:</strong> Grúa Mediana</p>
              <p><strong>Placa:</strong> ABC123</p>
              <p><strong>Capacidad:</strong> 3 toneladas</p>
            </div>
          </div>

          <div className="section">
            <h4>Puede Recoger</h4>
            <div className="capabilities">
              <IonChip color="primary">🚗 Autos</IonChip>
              <IonChip color="primary">🚙 Camionetas</IonChip>
              <IonChip color="primary">🛡️ Blindados</IonChip>
              <IonChip color="primary">🏢 Sótanos -3</IonChip>
            </div>
          </div>
        </div>

        {/* Reviews - Visible solo en breakpoint 1.0 */}
        <div className="quote-reviews">
          <div className="section">
            <h4>Reseñas Recientes</h4>
            <div className="review-list">
              <div className="review-item">
                <div className="review-header">
                  <span className="reviewer-name">Juan P.</span>
                  <span className="review-stars">⭐⭐⭐⭐⭐</span>
                </div>
                <p className="review-text">
                  "Excelente servicio, muy profesional y rápido. Llegó en el tiempo estimado."
                </p>
                <p className="review-date">Hace 2 semanas</p>
              </div>

              <div className="review-item">
                <div className="review-header">
                  <span className="reviewer-name">María G.</span>
                  <span className="review-stars">⭐⭐⭐⭐⭐</span>
                </div>
                <p className="review-text">
                  "Muy amable y cuidadoso con mi vehículo. Lo recomiendo 100%."
                </p>
                <p className="review-date">Hace 1 mes</p>
              </div>

              <div className="review-item">
                <div className="review-header">
                  <span className="reviewer-name">Carlos R.</span>
                  <span className="review-stars">⭐⭐⭐⭐</span>
                </div>
                <p className="review-text">
                  "Buen servicio, aunque llegó 10 minutos tarde. Pero muy profesional."
                </p>
                <p className="review-date">Hace 2 meses</p>
              </div>
            </div>
          </div>
        </div>

        {/* Botón de Aceptar - Sticky en la parte inferior */}
        <div className="sheet-actions">
          <IonButton 
            expand="block" 
            size="large"
            onClick={() => onAccept(quote)}
            disabled={isAccepting}
            className="accept-button"
          >
            {isAccepting ? (
              <>
                <IonSpinner name="crescent" />
                <span style={{ marginLeft: '8px' }}>Aceptando...</span>
              </>
            ) : (
              `Aceptar por ${formatAmount(quote.amount)}`
            )}
          </IonButton>
          
          <IonButton 
            expand="block" 
            fill="clear" 
            onClick={onDismiss}
            disabled={isAccepting}
          >
            Cancelar
          </IonButton>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default QuoteDetailSheet;
