import React, { useState, useEffect, useRef } from 'react';
import { IonPage, IonContent, IonSpinner } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { io } from 'socket.io-client';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { dashboardAPI } from '../services/adminAPI';
import { People, Truck, DocumentText, DollarCircle } from 'iconsax-react';
import './Dashboard.css';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';
const REFRESH_INTERVAL = 30000; // 30 segundos

const Dashboard = () => {
  const history = useHistory();
  const [stats, setStats] = useState(null);
  const [activeServices, setActiveServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [liveEvents, setLiveEvents] = useState([]); // Eventos en tiempo real
  const socketRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    loadDashboardData();

    // Auto-refresh cada 30 segundos (silencioso, sin spinner)
    intervalRef.current = setInterval(() => {
      loadDashboardData(true);
    }, REFRESH_INTERVAL);

    // Socket.IO — escuchar eventos relevantes del backend
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Admin conectado al Socket.IO');
    });

    // Cuando se acepta una cotización → nuevo servicio activo
    socket.on('quote:accepted', (data) => {
      addLiveEvent('nuevo_servicio', `Nuevo servicio iniciado`);
      loadDashboardData(true);
    });

    // Cuando un servicio se completa
    socket.on('service:completed', (data) => {
      addLiveEvent('servicio_completado', `Servicio completado`);
      loadDashboardData(true);
    });

    // Cuando se cancela una solicitud
    socket.on('request:cancelled', (data) => {
      addLiveEvent('cancelado', `Solicitud cancelada`);
      loadDashboardData(true);
    });

    return () => {
      clearInterval(intervalRef.current);
      socket.disconnect();
    };
  }, []);

  const addLiveEvent = (type, message) => {
    const event = {
      id: Date.now(),
      type,
      message,
      time: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    };
    setLiveEvents(prev => [event, ...prev].slice(0, 5)); // Máximo 5 eventos visibles
  };

  const loadDashboardData = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);

      const [statsRes, servicesRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getActiveServices()
      ]);

      setStats(statsRes.data);
      setActiveServices(servicesRes.data.active || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('❌ Error cargando dashboard:', error);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    return lastUpdated.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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

          {/* Barra de estado en tiempo real */}
          <div className="dashboard-live-bar">
            <div className="live-indicator">
              <span className="live-dot" />
              <span>En vivo</span>
            </div>
            <span className="last-updated">
              Actualizado: {formatLastUpdated()} · se refresca cada 30s
            </span>
            <button className="refresh-btn" onClick={() => loadDashboardData(true)}>
              ↻ Actualizar
            </button>
          </div>

          {/* Eventos en tiempo real (Socket.IO) */}
          {liveEvents.length > 0 && (
            <div className="live-events-bar">
              {liveEvents.map(event => (
                <div key={event.id} className={`live-event live-event--${event.type}`}>
                  <span className="live-event-time">{event.time}</span>
                  <span className="live-event-msg">{event.message}</span>
                </div>
              ))}
            </div>
          )}

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
                <h3 className="kpi-value">{stats?.services?.active || 0}</h3>
                <p className="kpi-label">Servicios en Curso</p>
                <span className="kpi-badge success">{stats?.services?.completed || 0} completados</span>
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
              <div className="kpi-icon" style={{ background: '#F0FDF4' }}>
                <DollarCircle size="32" color="#10B981" variant="Bold" />
              </div>
              <div className="kpi-content">
                <h3 className="kpi-value">{formatCurrency(stats?.revenue?.platformEarnings || 0)}</h3>
                <p className="kpi-label">Ganancias (10%)</p>
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
                  <div
                    key={service._id}
                    className="service-card clickable"
                    onClick={() => history.push(`/services/${service._id}`)}
                  >
                    <div className="service-header">
                      <span className="service-id">#{service._id.slice(-6)}</span>
                      <span className="service-status active">En curso</span>
                    </div>
                    <div className="service-body">
                      <p className="service-client">
                        👤 {service.clientId?.name || 'Cliente'}
                      </p>
                      <p className="service-driver">
                        🚛 {service.assignedDriverId?.name || 'Conductor asignado'}
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
