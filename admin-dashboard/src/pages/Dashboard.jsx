import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonSpinner } from '@ionic/react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { dashboardAPI } from '../services/adminAPI';
import { People, Truck, DocumentText, DollarCircle, Star } from 'iconsax-react';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [activeServices, setActiveServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, servicesRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getActiveServices()
      ]);
      
      setStats(statsRes.data);
      setActiveServices(servicesRes.data.active || []);
    } catch (error) {
      console.error('❌ Error cargando dashboard:', error);
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

  if (isLoading) {
    return (
      <IonPage>
        <Sidebar />
        <IonContent>
          <div className="admin-content-wrapper">
            <div className="admin-loading">
              <IonSpinner name="crescent" color="primary" />
              <p>Cargando dashboard...</p>
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
          <Header title="Dashboard" />

        {/* KPIs Grid */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon" style={{ background: '#EFF6FF' }}>
              <People size="32" color="#0055FF" variant="Bold" />
            </div>
            <div className="kpi-content">
              <h3 className="kpi-value">{stats?.clients?.total || 0}</h3>
              <p className="kpi-label">Clientes</p>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon" style={{ background: '#ECFDF5' }}>
              <Truck size="32" color="#10B981" variant="Bold" />
            </div>
            <div className="kpi-content">
              <h3 className="kpi-value">{stats?.drivers?.approved || 0}</h3>
              <p className="kpi-label">Conductores</p>
              <span className="kpi-badge success">{stats?.drivers?.active || 0} activos</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon" style={{ background: '#FEF3C7' }}>
              <DocumentText size="32" color="#F59E0B" variant="Bold" />
            </div>
            <div className="kpi-content">
              <h3 className="kpi-value">{stats?.services?.completed || 0}</h3>
              <p className="kpi-label">Servicios</p>
              <span className="kpi-badge warning">{stats?.services?.active || 0} en curso</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon" style={{ background: '#F0FDF4' }}>
              <DollarCircle size="32" color="#10B981" variant="Bold" />
            </div>
            <div className="kpi-content">
              <h3 className="kpi-value">{formatCurrency(stats?.revenue?.total || 0)}</h3>
              <p className="kpi-label">Ingresos Totales</p>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon" style={{ background: '#FEF2F2' }}>
              <Star size="32" color="#F59E0B" variant="Bold" />
            </div>
            <div className="kpi-content">
              <h3 className="kpi-value">{stats?.rating?.average || 0}</h3>
              <p className="kpi-label">Rating Promedio</p>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon" style={{ background: '#FEF3C7' }}>
              <Truck size="32" color="#F59E0B" variant="Bold" />
            </div>
            <div className="kpi-content">
              <h3 className="kpi-value">{stats?.drivers?.pending || 0}</h3>
              <p className="kpi-label">Conductores Pendientes</p>
              {stats?.drivers?.pending > 0 && (
                <span className="kpi-badge warning">Requieren revisión</span>
              )}
            </div>
          </div>
        </div>

        {/* Servicios Activos */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">🔴 Servicios en Curso</h2>
            <span className="section-count">{activeServices.length} activos</span>
          </div>

          {activeServices.length === 0 ? (
            <div className="empty-state">
              <p>No hay servicios activos en este momento</p>
            </div>
          ) : (
            <div className="services-list">
              {activeServices.slice(0, 5).map((service) => (
                <div key={service._id} className="service-card">
                  <div className="service-header">
                    <span className="service-id">#{service._id.slice(-6)}</span>
                    <span className="service-status active">En curso</span>
                  </div>
                  <div className="service-body">
                    <p className="service-client">
                      👤 {service.clientId?.name || 'Cliente'}
                    </p>
                    <p className="service-driver">
                      🚛 {service.driverId?.name || 'Conductor asignado'}
                    </p>
                    <p className="service-route">
                      📍 {service.origin?.address?.substring(0, 40)}...
                    </p>
                  </div>
                  <div className="service-footer">
                    <span className="service-amount">
                      {formatCurrency(service.totalAmount || 0)}
                    </span>
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

export default Dashboard;

