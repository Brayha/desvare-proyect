import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonSpinner } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { clientsAPI } from '../services/adminAPI';
import { SearchNormal1, CloseCircle } from 'iconsax-react';
import './Clients.css';

const Clients = () => {
  const history = useHistory();
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadClients();
  }, [statusFilter]);

  const loadClients = async () => {
    try {
      setIsLoading(true);
      const response = await clientsAPI.getAll({ 
        status: statusFilter,
        search: searchTerm,
        limit: 50
      });
      setClients(response.data.clients || []);
    } catch (error) {
      console.error('❌ Error cargando clientes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (isActive) => {
    return (
      <span className={`client-status-badge ${isActive ? 'active' : 'suspended'}`}>
        {isActive ? '🟢 Activo' : '🔴 Suspendido'}
      </span>
    );
  };

  const handleSearch = () => {
    loadClients();
  };

  if (isLoading) {
    return (
      <IonPage>
        <Sidebar />
        <IonContent>
          <div className="admin-content-wrapper">
            <Header title="Clientes" />
            <div className="admin-loading">
              <IonSpinner name="crescent" color="primary" />
              <p>Cargando clientes...</p>
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
          <Header title="Clientes" />

          {/* Filters */}
          <div className="clients-filters">
            <div className="search-box">
              <SearchNormal1 size="20" color="#9CA3AF" />
              <input
                type="text"
                placeholder="Buscar por nombre, teléfono o email..."
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
                className={`status-filter ${statusFilter === 'active' ? 'active' : ''}`}
                onClick={() => setStatusFilter('active')}
              >
                🟢 Activos
              </button>
              <button
                className={`status-filter ${statusFilter === 'suspended' ? 'active' : ''}`}
                onClick={() => setStatusFilter('suspended')}
              >
                🔴 Suspendidos
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="clients-stats">
            <div className="stat-card">
              <span className="stat-value">{clients.length}</span>
              <span className="stat-label">Total Clientes</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{clients.filter(c => c.isActive).length}</span>
              <span className="stat-label">Activos</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{clients.filter(c => !c.isActive).length}</span>
              <span className="stat-label">Suspendidos</span>
            </div>
          </div>

          {/* Clients List */}
          <div className="clients-list">
            {clients.length === 0 ? (
              <div className="empty-state">
                <p>No se encontraron clientes con los filtros aplicados</p>
              </div>
            ) : (
              clients.map((client) => (
                <div 
                  key={client._id} 
                  className="client-card"
                  onClick={() => history.push(`/clients/${client._id}`)}
                >
                  <div className="client-card-header">
                    <div className="client-info">
                      <h3 className="client-name">{client.name}</h3>
                      <p className="client-contact">
                        📱 {client.phone} {client.email && `| 📧 ${client.email}`}
                      </p>
                    </div>
                    {getStatusBadge(client.isActive)}
                  </div>

                  <div className="client-card-body">
                    <div className="client-detail">
                      <span className="detail-label">Servicios Solicitados:</span>
                      <span className="detail-value">{client.totalRequests || 0}</span>
                    </div>
                    <div className="client-detail">
                      <span className="detail-label">Servicios Completados:</span>
                      <span className="detail-value">{client.completedRequests || 0}</span>
                    </div>
                    <div className="client-detail">
                      <span className="detail-label">Vehículos Registrados:</span>
                      <span className="detail-value">{client.vehicleCount || 0}</span>
                    </div>
                    <div className="client-detail">
                      <span className="detail-label">Registrado:</span>
                      <span className="detail-value">
                        {new Date(client.createdAt).toLocaleDateString('es-CO')}
                      </span>
                    </div>
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

export default Clients;

