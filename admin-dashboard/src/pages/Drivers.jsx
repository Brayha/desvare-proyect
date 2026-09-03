import React, { useState } from 'react';
import { IonPage, IonContent, IonSpinner, useIonViewWillEnter } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { driversAPI } from '../services/adminAPI';
import { SearchNormal1 } from 'iconsax-react';
import './Drivers.css';

const DEFAULT_STATS = {
  total: 0,
  approved: 0,
  pendingReview: 0,
  pendingDocuments: 0,
  rejected: 0,
  suspended: 0,
};

const STATUS_TABS = [
  { id: 'all', label: 'Todos', statKey: 'total' },
  { id: 'approved', label: 'Aprobados', statKey: 'approved' },
  { id: 'pending_review', label: 'Pendientes', statKey: 'pendingReview' },
  { id: 'pending_documents', label: 'Pendiente Docs', statKey: 'pendingDocuments' },
  { id: 'rejected', label: 'Rechazados', statKey: 'rejected' },
  { id: 'suspended', label: 'Suspendidos', statKey: 'suspended' },
];

const Drivers = () => {
  const history = useHistory();
  const [drivers, setDrivers] = useState([]);
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  async function loadDrivers(filter = statusFilter) {
    try {
      setIsLoading(true);
      const response = await driversAPI.getAll({
        status: filter,
        search: searchTerm,
        limit: 50,
      });
      setDrivers(response.data.drivers || []);
      setStats(response.data.stats || DEFAULT_STATS);
    } catch (error) {
      console.error('❌ Error cargando conductores:', error);
    } finally {
      setIsLoading(false);
    }
  }

  useIonViewWillEnter(() => {
    loadDrivers();
  });

  const getStatusBadge = (status) => {
    const statusMap = {
      pending_documents: { label: 'Pendiente Docs', class: 'warning' },
      pending_review: { label: 'En Revisión', class: 'warning' },
      approved: { label: 'Aprobado', class: 'success' },
      rejected: { label: 'Rechazado', class: 'danger' },
      suspended: { label: 'Suspendido', class: 'danger' },
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

  const handleStatusFilter = (filter) => {
    setStatusFilter(filter);
    loadDrivers(filter);
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

          <div className="drivers-stats">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`drivers-stat-card ${statusFilter === tab.id ? 'active' : ''}`}
                onClick={() => handleStatusFilter(tab.id)}
              >
                <span className="drivers-stat-value">{stats[tab.statKey] ?? 0}</span>
                <span className="drivers-stat-label">{tab.label}</span>
              </button>
            ))}
          </div>

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
              <button type="button" onClick={handleSearch}>Buscar</button>
            </div>
          </div>

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
