import React, { useState } from 'react';
import { IonPage, IonContent, IonSpinner, useIonViewWillEnter } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { servicesAPI } from '../services/adminAPI';
import { SearchNormal1 } from 'iconsax-react';
import './Services.css';

const Services = () => {
  const history = useHistory();
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, active: 0, cancelled: 0, pending: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  async function loadServices(filter = statusFilter) {
    try {
      setIsLoading(true);
      const response = await servicesAPI.getAll({ 
        status: filter,
        search: searchTerm,
        limit: 50,
        sortBy: 'createdAt',
        order: 'desc'
      });
      setServices(response.data.services || []);
      setStats(response.data.stats || {});
    } catch (error) {
      console.error('❌ Error cargando servicios:', error);
    } finally {
      setIsLoading(false);
    }
  }

  useIonViewWillEnter(() => {
    loadServices();
  });

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'Pendiente', class: 'pending', emoji: '⏳' },
      quoted: { label: 'Cotizado', class: 'quoted', emoji: '💰' },
      accepted: { label: 'Aceptado', class: 'accepted', emoji: '✅' },
      in_progress: { label: 'En Curso', class: 'in-progress', emoji: '🚛' },
      completed: { label: 'Completado', class: 'completed', emoji: '✅' },
      cancelled: { label: 'Cancelado', class: 'cancelled', emoji: '❌' }
    };
    
    const statusInfo = statusMap[status] || { label: status, class: 'default', emoji: '📋' };
    return (
      <span className={`service-status-badge ${statusInfo.class}`}>
        {statusInfo.emoji} {statusInfo.label}
      </span>
    );
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSearch = () => {
    loadServices();
  };

  const handleStatusFilter = (filter) => {
    setStatusFilter(filter);
    loadServices(filter);
  };

  if (isLoading) {
    return (
      <IonPage>
        <Sidebar />
        <IonContent>
          <div className="admin-content-wrapper">
            <Header title="Servicios" />
            <div className="admin-loading">
              <IonSpinner name="crescent" color="primary" />
              <p>Cargando servicios...</p>
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
          <Header title="Servicios" />

          {/* Filters */}
          <div className="services-filters">
            <div className="search-box">
              <SearchNormal1 size="20" color="#9CA3AF" />
              <input
                type="text"
                placeholder="Buscar por ID, origen o destino..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch}>Buscar</button>
            </div>

            <div className="status-filters">
              <button
                className={`status-filter ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => handleStatusFilter('all')}
              >
                Todos
              </button>
              <button
                className={`status-filter ${statusFilter === 'pending' ? 'active' : ''}`}
                onClick={() => handleStatusFilter('pending')}
              >
                ⏳ Pendientes
              </button>
              <button
                className={`status-filter ${statusFilter === 'quoted' ? 'active' : ''}`}
                onClick={() => handleStatusFilter('quoted')}
              >
                💰 Cotizando
              </button>
              <button
                className={`status-filter ${statusFilter === 'accepted' ? 'active' : ''}`}
                onClick={() => handleStatusFilter('accepted')}
              >
                🚚 Asignados
              </button>
              <button
                className={`status-filter ${statusFilter === 'in_progress' ? 'active' : ''}`}
                onClick={() => handleStatusFilter('in_progress')}
              >
                🚛 En Curso
              </button>
              <button
                className={`status-filter ${statusFilter === 'completed' ? 'active' : ''}`}
                onClick={() => handleStatusFilter('completed')}
              >
                ✅ Completados
              </button>
              <button
                className={`status-filter ${statusFilter === 'cancelled' ? 'active' : ''}`}
                onClick={() => handleStatusFilter('cancelled')}
              >
                ❌ Cancelados
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="services-stats">
            <div className="stat-card">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total Servicios</span>
            </div>
            <div className="stat-card completed">
              <span className="stat-value">{stats.completed}</span>
              <span className="stat-label">Completados</span>
            </div>
            <div className="stat-card active">
              <span className="stat-value">{stats.accepted || 0}</span>
              <span className="stat-label">Asignados</span>
            </div>
            <div className="stat-card active">
              <span className="stat-value">{stats.inProgress || 0}</span>
              <span className="stat-label">En Servicio</span>
            </div>
            <div className="stat-card pending">
              <span className="stat-value">{stats.pending}</span>
              <span className="stat-label">Pendientes</span>
            </div>
            <div className="stat-card cancelled">
              <span className="stat-value">{stats.cancelled}</span>
              <span className="stat-label">Cancelados</span>
            </div>
          </div>

          {/* Services List */}
          <div className="services-list">
            {services.length === 0 ? (
              <div className="empty-state">
                <p>No se encontraron servicios con los filtros aplicados</p>
              </div>
            ) : (
              <div className="services-table">
                <div className="table-header">
                  <div className="th">ID</div>
                  <div className="th">Cliente</div>
                  <div className="th">Conductor</div>
                  <div className="th">Ruta</div>
                  <div className="th">Estado</div>
                  <div className="th">Monto</div>
                  <div className="th">Fecha</div>
                </div>
                {services.map((service) => (
                  <div 
                    key={service._id} 
                    className="table-row"
                    onClick={() => history.push(`/services/${service._id}`)}
                  >
                    <div className="td service-id" data-label="ID">
                      #{service._id.slice(-6)}
                    </div>
                    <div className="td" data-label="Cliente">
                      <div className="user-info">
                        <span className="user-name">{service.clientId?.name || 'N/A'}</span>
                        <span className="user-phone">{service.clientId?.phone || ''}</span>
                      </div>
                    </div>
                    <div className="td" data-label="Conductor">
                      <div className="user-info">
                        <span className="user-name">
                          {service.assignedDriverId?.name || 'Sin asignar'}
                        </span>
                        {service.assignedDriverId?.phone && (
                          <span className="user-phone">{service.assignedDriverId.phone}</span>
                        )}
                      </div>
                    </div>
                    <div className="td" data-label="Ruta">
                      <div className="route-info">
                        <span className="route-origin">
                          📍 {service.origin?.address?.substring(0, 30)}...
                        </span>
                        {service.destination?.address && (
                          <span className="route-destination">
                            🏁 {service.destination.address.substring(0, 30)}...
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="td" data-label="Estado">
                      {getStatusBadge(service.status)}
                    </div>
                    <div className="td service-amount" data-label="Monto">
                      {service.totalAmount > 0 ? formatCurrency(service.totalAmount) : '-'}
                    </div>
                    <div className="td service-date" data-label="Fecha">
                      {formatDate(service.createdAt)}
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

export default Services;
