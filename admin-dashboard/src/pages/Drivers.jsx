import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonSpinner, IonButton } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { driversAPI } from '../services/adminAPI';
import { SearchNormal1, Filter } from 'iconsax-react';
import './Drivers.css';

const Drivers = () => {
  const history = useHistory();
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDrivers();
  }, [statusFilter]);

  const loadDrivers = async () => {
    try {
      setIsLoading(true);
      const response = await driversAPI.getAll({ 
        status: statusFilter,
        search: searchTerm,
        limit: 50
      });
      setDrivers(response.data.drivers || []);
    } catch (error) {
      console.error('❌ Error cargando conductores:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending_documents: { label: 'Pendiente Docs', class: 'warning' },
      pending_review: { label: 'En Revisión', class: 'warning' },
      approved: { label: 'Aprobado', class: 'success' },
      rejected: { label: 'Rechazado', class: 'danger' },
      suspended: { label: 'Suspendido', class: 'danger' }
    };
    
    const statusInfo = statusMap[status] || { label: status, class: 'default' };
    return (
      <span className={`driver-status-badge ${statusInfo.class}`}>
        {statusInfo.label}
      </span>
    );
  };

  const handleSearch = () => {
    loadDrivers();
  };

  if (isLoading) {
    return (
      <IonPage>
        <Sidebar />
        <IonContent className="admin-content">
          <Header title="Conductores" />
          <div className="admin-loading">
            <IonSpinner name="crescent" color="primary" />
            <p>Cargando conductores...</p>
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
          <Header title="Conductores" />

        {/* Filters */}
        <div className="drivers-filters">
          <div className="search-box">
            <SearchNormal1 size="20" color="#9CA3AF" />
            <input
              type="text"
              placeholder="Buscar por nombre o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch}>Buscar</button>
          </div>

          <div className="status-filters">
            <button
              className={`status-filter ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              Todos
            </button>
            <button
              className={`status-filter ${statusFilter === 'pending_review' ? 'active' : ''}`}
              onClick={() => setStatusFilter('pending_review')}
            >
              🟡 Pendientes
            </button>
            <button
              className={`status-filter ${statusFilter === 'approved' ? 'active' : ''}`}
              onClick={() => setStatusFilter('approved')}
            >
              🟢 Aprobados
            </button>
            <button
              className={`status-filter ${statusFilter === 'rejected' ? 'active' : ''}`}
              onClick={() => setStatusFilter('rejected')}
            >
              🔴 Rechazados
            </button>
          </div>
        </div>

        {/* Drivers List */}
        <div className="drivers-list">
          {drivers.length === 0 ? (
            <div className="empty-state">
              <p>No se encontraron conductores con los filtros aplicados</p>
            </div>
          ) : (
            drivers.map((driver) => (
              <div 
                key={driver._id} 
                className="driver-card"
                onClick={() => history.push(`/drivers/${driver._id}`)}
              >
                <div className="driver-card-header">
                  <div className="driver-info">
                    <h3 className="driver-name">{driver.name}</h3>
                    <p className="driver-contact">
                      📱 {driver.phone} | 📧 {driver.email || 'Sin email'}
                    </p>
                  </div>
                  {getStatusBadge(driver.driverProfile?.status)}
                </div>

                <div className="driver-card-body">
                  <div className="driver-detail">
                    <span className="detail-label">Ciudad:</span>
                    <span className="detail-value">{driver.driverProfile?.city || 'N/A'}</span>
                  </div>
                  <div className="driver-detail">
                    <span className="detail-label">Tipo:</span>
                    <span className="detail-value">
                      {driver.driverProfile?.entityType === 'natural' ? 'Persona Natural' : 'Persona Jurídica'}
                    </span>
                  </div>
                  <div className="driver-detail">
                    <span className="detail-label">Rating:</span>
                    <span className="detail-value">
                      ⭐ {driver.driverProfile?.rating || 5}
                    </span>
                  </div>
                  <div className="driver-detail">
                    <span className="detail-label">Servicios:</span>
                    <span className="detail-value">
                      {driver.driverProfile?.totalServices || 0}
                    </span>
                  </div>
                </div>

                <div className="driver-card-footer">
                  <span className="driver-registered">
                    Registrado: {new Date(driver.createdAt).toLocaleDateString('es-CO')}
                  </span>
                  {driver.driverProfile?.isOnline && (
                    <span className="driver-online">🟢 Online</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Drivers;

