import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonSpinner } from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { servicesAPI } from '../services/adminAPI';
import { ArrowLeft2, Call, Sms, Location, Clock, DollarCircle, Star1 } from 'iconsax-react';
import './ServiceDetail.css';

const ServiceDetail = () => {
  const { id } = useParams();
  const history = useHistory();
  const [service, setService] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadServiceDetail();
  }, [id]);

  const loadServiceDetail = async () => {
    try {
      setIsLoading(true);
      const response = await servicesAPI.getById(id);
      setService(response.data.service);
    } catch (error) {
      console.error('❌ Error cargando detalle:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'Pendiente', class: 'warning', emoji: '⏳' },
      quoted: { label: 'Cotizado', class: 'info', emoji: '💰' },
      accepted: { label: 'Aceptado', class: 'info', emoji: '✅' },
      in_progress: { label: 'En Curso', class: 'success', emoji: '🚛' },
      completed: { label: 'Completado', class: 'success', emoji: '✅' },
      cancelled: { label: 'Cancelado', class: 'danger', emoji: '❌' }
    };
    
    const statusInfo = statusMap[status] || { label: status, class: 'default', emoji: '📋' };
    return (
      <span className={`detail-status-badge ${statusInfo.class}`}>
        {statusInfo.emoji} {statusInfo.label}
      </span>
    );
  };

  const getVehicleIcon = (category) => {
    const icons = {
      'moto': '🏍️',
      'auto': '🚗',
      'camioneta': '🚙',
      'camion': '🚚',
      'bus': '🚌'
    };
    return icons[category?.toLowerCase()] || '🚗';
  };

  if (isLoading) {
    return (
      <IonPage>
        <Sidebar />
        <IonContent>
          <div className="admin-content-wrapper">
            <Header title="Detalle de Servicio" />
            <div className="admin-loading">
              <IonSpinner name="crescent" color="primary" />
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!service) {
    return (
      <IonPage>
        <Sidebar />
        <IonContent>
          <div className="admin-content-wrapper">
            <Header title="Detalle de Servicio" />
            <div className="empty-state">
              <p>Servicio no encontrado</p>
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <Sidebar />
      <IonContent>
        <div className="admin-content-wrapper">
          <div className="detail-header">
            <button className="back-button" onClick={() => history.goBack()}>
              <ArrowLeft2 size="20" />
              Volver
            </button>
          </div>

          <div className="service-detail-header">
            <div>
              <Header title={`Servicio #${service._id.slice(-6)}`} />
              <p className="service-detail-subtitle">
                Creado el {formatDate(service.createdAt)}
              </p>
            </div>
            {getStatusBadge(service.status)}
          </div>

          {/* Cliente y Conductor */}
          <div className="detail-grid">
            {/* Cliente */}
            <div className="detail-section">
              <h3>👤 Información del Cliente</h3>
              <div className="contact-card">
                <div className="contact-header">
                  <h4>{service.clientId?.name || 'N/A'}</h4>
                  <span className="contact-type">Cliente</span>
                </div>
                <div className="contact-details">
                  <div className="contact-item">
                    <Call size="18" color="#6B7280" />
                    <a href={`tel:${service.clientId?.phone}`}>{service.clientId?.phone || 'N/A'}</a>
                  </div>
                  {service.clientId?.email && (
                    <div className="contact-item">
                      <Sms size="18" color="#6B7280" />
                      <a href={`mailto:${service.clientId.email}`}>{service.clientId.email}</a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Conductor */}
            <div className="detail-section">
              <h3>🚛 Información del Conductor</h3>
              {service.assignedDriverId ? (
                <div className="contact-card">
                  <div className="contact-header">
                    <h4>{service.assignedDriverId.name}</h4>
                    <span className="contact-type">Conductor</span>
                  </div>
                  <div className="contact-details">
                    <div className="contact-item">
                      <Call size="18" color="#6B7280" />
                      <a href={`tel:${service.assignedDriverId.phone}`}>{service.assignedDriverId.phone}</a>
                    </div>
                    {service.assignedDriverId.driverProfile?.rating && (
                      <div className="contact-item">
                        <Star1 size="18" color="#F59E0B" variant="Bold" />
                        <span>{service.assignedDriverId.driverProfile.rating.toFixed(1)} ⭐</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="empty-card">
                  <p>Sin conductor asignado</p>
                </div>
              )}
            </div>
          </div>

          {/* Ruta */}
          <div className="detail-section">
            <h3>📍 Ruta del Servicio</h3>
            <div className="route-card">
              <div className="route-point origin">
                <div className="route-marker">📍</div>
                <div className="route-info">
                  <span className="route-label">Origen</span>
                  <span className="route-address">{service.origin?.address || 'N/A'}</span>
                </div>
              </div>
              <div className="route-line"></div>
              {service.destination?.address && (
                <div className="route-point destination">
                  <div className="route-marker">🏁</div>
                  <div className="route-info">
                    <span className="route-label">Destino</span>
                    <span className="route-address">{service.destination.address}</span>
                  </div>
                </div>
              )}
              {service.distance && (
                <div className="route-stats">
                  <div className="route-stat">
                    <Location size="18" color="#6B7280" />
                    <span>{(service.distance / 1000).toFixed(1)} km</span>
                  </div>
                  {service.duration && (
                    <div className="route-stat">
                      <Clock size="18" color="#6B7280" />
                      <span>{Math.floor(service.duration / 60)} min</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Vehículo */}
          <div className="detail-section">
            <h3>🚗 Información del Vehículo</h3>
            {service.vehicleSnapshot ? (
              <div className="vehicle-card">
                <div className="vehicle-icon-large">
                  {getVehicleIcon(service.vehicleSnapshot.category?.name)}
                </div>
                <div className="vehicle-details">
                  <div className="vehicle-row">
                    <span className="vehicle-label">Categoría:</span>
                    <span className="vehicle-value">{service.vehicleSnapshot.category?.name || 'N/A'}</span>
                  </div>
                  <div className="vehicle-row">
                    <span className="vehicle-label">Marca:</span>
                    <span className="vehicle-value">{service.vehicleSnapshot.brand?.name || 'N/A'}</span>
                  </div>
                  <div className="vehicle-row">
                    <span className="vehicle-label">Modelo:</span>
                    <span className="vehicle-value">{service.vehicleSnapshot.model?.name || 'N/A'}</span>
                  </div>
                  {service.vehicleSnapshot.licensePlate && (
                    <div className="vehicle-row">
                      <span className="vehicle-label">Placa:</span>
                      <span className="vehicle-value license-plate">{service.vehicleSnapshot.licensePlate}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="empty-card">
                <p>Información del vehículo no disponible</p>
              </div>
            )}
          </div>

          {/* Problema/Detalles */}
          {service.serviceDetails?.problem && (
            <div className="detail-section">
              <h3>📋 Detalles del Servicio</h3>
              <div className="problem-card">
                <p className="problem-text">{service.serviceDetails.problem}</p>
              </div>
            </div>
          )}

          {/* Montos y Tiempos */}
          <div className="detail-grid">
            <div className="detail-section">
              <h3>💰 Información Financiera</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Monto Total</span>
                  <span className="info-value highlight">
                    {service.totalAmount > 0 ? formatCurrency(service.totalAmount) : 'N/A'}
                  </span>
                </div>
                {service.rating?.tip > 0 && (
                  <div className="info-item">
                    <span className="info-label">Propina</span>
                    <span className="info-value">{formatCurrency(service.rating.tip)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="detail-section">
              <h3>⏱️ Línea de Tiempo</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Creado</span>
                  <span className="info-value">{formatDate(service.createdAt)}</span>
                </div>
                {service.acceptedAt && (
                  <div className="info-item">
                    <span className="info-label">Aceptado</span>
                    <span className="info-value">{formatDate(service.acceptedAt)}</span>
                  </div>
                )}
                {service.completedAt && (
                  <div className="info-item">
                    <span className="info-label">Completado</span>
                    <span className="info-value">{formatDate(service.completedAt)}</span>
                  </div>
                )}
                {service.serviceDuration && (
                  <div className="info-item">
                    <span className="info-label">Duración</span>
                    <span className="info-value">{service.serviceDuration} min</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Calificación */}
          {service.status === 'completed' && service.rating?.stars && (
            <div className="detail-section">
              <h3>⭐ Calificación del Servicio</h3>
              <div className="rating-card">
                <div className="rating-stars-large">
                  {[1,2,3,4,5].map(i => (
                    <span key={i} className={i <= service.rating.stars ? 'star filled' : 'star'}>★</span>
                  ))}
                  <span className="rating-number">{service.rating.stars.toFixed(1)}</span>
                </div>
                {service.rating.comment && (
                  <p className="rating-comment-large">"{service.rating.comment}"</p>
                )}
              </div>
            </div>
          )}

          {/* Cotizaciones */}
          {service.quotes && service.quotes.length > 0 && (
            <div className="detail-section">
              <h3>💰 Cotizaciones Recibidas ({service.quotes.length})</h3>
              <div className="quotes-list">
                {service.quotes.map((quote, index) => (
                  <div key={index} className="quote-card">
                    <div className="quote-header">
                      <span className="quote-driver">{quote.driverName || 'Conductor'}</span>
                      <span className={`quote-status ${quote.status}`}>{quote.status}</span>
                    </div>
                    <div className="quote-body">
                      <span className="quote-amount">{formatCurrency(quote.amount)}</span>
                      <span className="quote-date">{formatDate(quote.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ServiceDetail;
