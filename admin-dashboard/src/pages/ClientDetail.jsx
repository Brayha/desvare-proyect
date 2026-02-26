import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonSpinner, IonButton } from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { clientsAPI } from '../services/adminAPI';
import { ArrowLeft2, Trash, Lock, LockSlash } from 'iconsax-react';
import './ClientDetail.css';

const ClientDetail = () => {
  const { id } = useParams();
  const history = useHistory();
  const [client, setClient] = useState(null);
  const [services, setServices] = useState([]);
  const [serviceStats, setServiceStats] = useState({ total: 0, completed: 0, cancelled: 0, active: 0 });
  const [serviceFilter, setServiceFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadClientDetail();
  }, [id]);

  const loadClientDetail = async () => {
    try {
      setIsLoading(true);
      const response = await clientsAPI.getById(id);
      setClient(response.data.client);
      setServices(response.data.services?.list || []);
      setServiceStats({
        total: response.data.services?.total || 0,
        completed: response.data.services?.completed || 0,
        cancelled: response.data.services?.cancelled || 0,
        active: response.data.services?.active || 0,
      });
    } catch (error) {
      console.error('❌ Error cargando detalle:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspend = async () => {
    const reason = prompt('Ingresa la razón de la suspensión:');
    if (!reason) return;
    
    try {
      setIsProcessing(true);
      await clientsAPI.suspend(id, reason);
      alert('✅ Cliente suspendido exitosamente');
      loadClientDetail();
    } catch (error) {
      alert('❌ Error al suspender: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleActivate = async () => {
    if (!confirm('¿Estás seguro de activar este cliente?')) return;
    
    try {
      setIsProcessing(true);
      await clientsAPI.activate(id);
      alert('✅ Cliente activado exitosamente');
      loadClientDetail();
    } catch (error) {
      alert('❌ Error al activar: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('⚠️ ¿Estás seguro de ELIMINAR permanentemente este cliente?\n\nEsta acción NO se puede deshacer.\n\nSe eliminarán:\n- El cliente\n- Sus vehículos\n- Su historial de servicios')) {
      return;
    }

    const confirmText = prompt('Escribe "ELIMINAR" para confirmar:');
    if (confirmText !== 'ELIMINAR') {
      alert('❌ Eliminación cancelada');
      return;
    }
    
    try {
      setIsProcessing(true);
      await clientsAPI.delete(id);
      alert('✅ Cliente eliminado exitosamente');
      history.replace('/clients');
    } catch (error) {
      alert('❌ Error al eliminar: ' + (error.response?.data?.error || error.message));
      setIsProcessing(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getServiceStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'Pendiente', class: 'warning' },
      quoted: { label: 'Cotizado', class: 'info' },
      in_progress: { label: 'En Curso', class: 'success' },
      completed: { label: 'Completado', class: 'success' },
      cancelled: { label: 'Cancelado', class: 'danger' }
    };
    
    const statusInfo = statusMap[status] || { label: status, class: 'default' };
    return (
      <span className={`service-status-badge ${statusInfo.class}`}>
        {statusInfo.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <IonPage>
        <Sidebar />
        <IonContent>
          <div className="admin-content-wrapper">
            <Header title="Detalle de Cliente" />
            <div className="admin-loading">
              <IonSpinner name="crescent" color="primary" />
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!client) {
    return (
      <IonPage>
        <Sidebar />
        <IonContent>
          <div className="admin-content-wrapper">
            <Header title="Detalle de Cliente" />
            <div className="empty-state">
              <p>Cliente no encontrado</p>
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

          <Header title={client.name} />

          {/* Actions */}
          <div className="client-actions">
            {client.isActive ? (
              <IonButton 
                color="warning" 
                onClick={handleSuspend}
                disabled={isProcessing}
              >
                <Lock size="20" style={{ marginRight: '8px' }} />
                Suspender Cliente
              </IonButton>
            ) : (
              <IonButton 
                color="success" 
                onClick={handleActivate}
                disabled={isProcessing}
              >
                <LockSlash size="20" style={{ marginRight: '8px' }} />
                Activar Cliente
              </IonButton>
            )}
            
            <IonButton 
              color="danger" 
              onClick={handleDelete}
              disabled={isProcessing}
            >
              <Trash size="20" style={{ marginRight: '8px' }} />
              Eliminar Cliente
            </IonButton>
          </div>

          {/* Client Info */}
          <div className="detail-section">
            <h3>Información del Cliente</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Teléfono</span>
                <span className="info-value">{client.phone}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email</span>
                <span className="info-value">{client.email || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Estado</span>
                <span className={`info-value ${client.isActive ? 'success' : 'danger'}`}>
                  {client.isActive ? '🟢 Activo' : '🔴 Suspendido'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Registrado</span>
                <span className="info-value">
                  {new Date(client.createdAt).toLocaleDateString('es-CO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="detail-section">
            <h3>Estadísticas</h3>
            <div className="stats-grid">
              <div className="stat-box">
                <span className="stat-box-value">{serviceStats.total}</span>
                <span className="stat-box-label">Servicios Totales</span>
              </div>
              <div className="stat-box" style={{ background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)' }}>
                <span className="stat-box-value" style={{ color: '#10B981' }}>{serviceStats.completed}</span>
                <span className="stat-box-label">Completados</span>
              </div>
              <div className="stat-box" style={{ background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)' }}>
                <span className="stat-box-value" style={{ color: '#F59E0B' }}>{serviceStats.active}</span>
                <span className="stat-box-label">En Curso</span>
              </div>
              <div className="stat-box" style={{ background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)' }}>
                <span className="stat-box-value" style={{ color: '#EF4444' }}>{serviceStats.cancelled}</span>
                <span className="stat-box-label">Cancelados</span>
              </div>
              <div className="stat-box">
                <span className="stat-box-value">{client.vehicles?.length || 0}</span>
                <span className="stat-box-label">Vehículos</span>
              </div>
            </div>
          </div>

          {/* Vehicles */}
          {client.vehicles && client.vehicles.length > 0 && (
            <div className="detail-section">
              <h3>Vehículos Registrados</h3>
              <div className="vehicles-grid">
                {client.vehicles.map((vehicle, index) => (
                  <div key={index} className="vehicle-item">
                    <div className="vehicle-icon">🚗</div>
                    <div className="vehicle-info">
                      <p className="vehicle-brand">{vehicle.brand?.name || 'N/A'}</p>
                      <p className="vehicle-model">{vehicle.model?.name || 'N/A'}</p>
                      <p className="vehicle-plate">{vehicle.plate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Services History */}
          <div className="detail-section">
            <div className="section-title-row">
              <h3>Historial de Servicios</h3>
              <div className="service-history-filters">
                {['all', 'completed', 'in_progress', 'cancelled'].map((f) => (
                  <button
                    key={f}
                    className={`history-filter-btn ${serviceFilter === f ? 'active' : ''}`}
                    onClick={() => setServiceFilter(f)}
                  >
                    {f === 'all' && 'Todos'}
                    {f === 'completed' && '✅ Completados'}
                    {f === 'in_progress' && '🔄 En curso'}
                    {f === 'cancelled' && '❌ Cancelados'}
                  </button>
                ))}
              </div>
            </div>

            {services.filter(s => serviceFilter === 'all' || s.status === serviceFilter).length === 0 ? (
              <p className="no-services">
                {serviceFilter === 'all'
                  ? 'Este cliente no ha solicitado servicios aún'
                  : 'No hay servicios con este filtro'}
              </p>
            ) : (
              <div className="services-table">
                {services
                  .filter(s => serviceFilter === 'all' || s.status === serviceFilter)
                  .map((service) => (
                  <div key={service._id} className="service-row">
                    <div className="service-info-col">
                      <span className="service-id">#{service._id.slice(-6)}</span>
                      <span className="service-date">
                        {new Date(service.createdAt).toLocaleDateString('es-CO', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      </span>
                      {service.vehicleSnapshot?.brand?.name && (
                        <span className="service-vehicle">
                          🚗 {service.vehicleSnapshot.brand.name} {service.vehicleSnapshot.model?.name || ''}
                        </span>
                      )}
                    </div>
                    <div className="service-details-col">
                      <p className="service-route">
                        📍 {service.origin?.address?.substring(0, 45)}{service.origin?.address?.length > 45 ? '...' : ''}
                      </p>
                      {service.destination?.address && (
                        <p className="service-route" style={{ color: '#10B981' }}>
                          🏁 {service.destination.address.substring(0, 45)}{service.destination.address.length > 45 ? '...' : ''}
                        </p>
                      )}
                      <p className="service-driver">
                        🚛 {service.driverId?.name || 'Sin conductor asignado'}
                      </p>
                      {service.status === 'completed' && (
                        <div className="service-rating">
                          {service.rating?.stars ? (
                            <>
                              <span className="rating-stars">
                                {[1,2,3,4,5].map(i => (
                                  <span key={i} className={i <= service.rating.stars ? 'star filled' : 'star'}>★</span>
                                ))}
                              </span>
                              {service.rating.comment && (
                                <span className="rating-comment">"{service.rating.comment}"</span>
                              )}
                            </>
                          ) : (
                            <span className="no-rating">Sin calificación</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="service-status-col">
                      {getServiceStatusBadge(service.status)}
                    </div>
                    <div className="service-amount-col">
                      {service.totalAmount > 0 ? formatCurrency(service.totalAmount) : '-'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ClientDetail;

