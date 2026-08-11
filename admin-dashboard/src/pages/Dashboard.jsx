import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IonPage, IonContent, IonSpinner } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { io } from 'socket.io-client';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { dashboardAPI } from '../services/adminAPI';
import { DocumentText, DollarCircle, Truck } from 'iconsax-react';
import './Dashboard.css';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';
const REFRESH_INTERVAL = 30000;

const EVENT_CONFIG = {
  'admin:request-created': {
    type: 'request',
    title: 'Nueva solicitud',
    detail: data => `${data.clientName || 'Un cliente'} solicitó servicio${data.origin ? ` desde ${data.origin}` : ''}`,
  },
  'admin:request-quoted': {
    type: 'quote',
    title: 'Cotización recibida',
    detail: data => `${data.driverName || 'Un conductor'} cotizó ${formatCurrency(data.amount)}`,
  },
  'admin:service-assigned': {
    type: 'assigned',
    title: 'Servicio asignado',
    detail: data => `${data.driverName || 'Conductor asignado'} · ${formatCurrency(data.amount)}`,
  },
  'admin:service-started': {
    type: 'progress',
    title: 'Servicio iniciado',
    detail: data => `${data.driverName || 'El conductor'} inició la operación`,
  },
  'admin:service-completed': {
    type: 'completed',
    title: 'Servicio completado',
    detail: data => `Operación cerrada por ${formatCurrency(data.amount)}`,
  },
  'admin:request-cancelled': {
    type: 'cancelled',
    title: 'Solicitud cancelada',
    detail: data => `Cancelada por ${data.cancelledBy === 'driver' ? 'el conductor' : data.cancelledBy === 'client' ? 'el cliente' : 'el usuario'}`,
  },
  'admin:driver-pending-review': {
    type: 'driver',
    title: 'Conductor por revisar',
    detail: data => `${data.name || 'Nuevo conductor'} completó su registro`,
  },
  'admin:driver-status-changed': {
    type: 'driver',
    title: 'Estado de conductor actualizado',
    detail: data => `${data.name || 'Conductor'} ahora está ${data.status || 'actualizado'}`,
  },
};

const STATUS_COPY = {
  accepted: { label: 'Asignado', className: 'assigned' },
  in_progress: { label: 'En servicio', className: 'progress' },
};

function formatCurrency(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

const Dashboard = () => {
  const history = useHistory();
  const [stats, setStats] = useState(null);
  const [activeServices, setActiveServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [liveEvents, setLiveEvents] = useState([]);
  const [connectionState, setConnectionState] = useState('connecting');
  const fetchInFlightRef = useRef(false);
  const eventIdRef = useRef(0);

  const loadDashboardData = useCallback(async (silent = false) => {
    if (fetchInFlightRef.current) return;
    fetchInFlightRef.current = true;
    try {
      if (silent) setIsRefreshing(true);
      else setIsLoading(true);
      setError('');

      const [statsRes, servicesRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getActiveServices(),
      ]);

      setStats(statsRes.data);
      setActiveServices(servicesRes.data.active || []);
      setLastUpdated(new Date());
    } catch (error) {
      setError(error.response?.data?.error || 'No fue posible actualizar la operación.');
    } finally {
      fetchInFlightRef.current = false;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    const refreshInterval = window.setInterval(
      () => loadDashboardData(true),
      REFRESH_INTERVAL,
    );

    const token = localStorage.getItem('adminToken');
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    let readyTimeout;

    socket.on('connect', () => {
      setConnectionState('authenticating');
      window.clearTimeout(readyTimeout);
      readyTimeout = window.setTimeout(() => setConnectionState('offline'), 5000);
    });
    socket.on('admin:ready', () => {
      window.clearTimeout(readyTimeout);
      setConnectionState('live');
    });
    socket.on('disconnect', () => {
      window.clearTimeout(readyTimeout);
      setConnectionState('offline');
    });
    socket.on('connect_error', () => setConnectionState('offline'));
    socket.io.on('reconnect_attempt', () => setConnectionState('connecting'));

    Object.entries(EVENT_CONFIG).forEach(([eventName, config]) => {
      socket.on(eventName, (data = {}) => {
        eventIdRef.current += 1;
        setLiveEvents(previous => [{
          id: `${Date.now()}-${eventIdRef.current}`,
          eventName,
          type: config.type,
          title: config.title,
          detail: config.detail(data),
          requestId: data.requestId,
          driverId: data.driverId,
          timestamp: new Date(),
        }, ...previous].slice(0, 12));
        loadDashboardData(true);
      });
    });

    return () => {
      window.clearInterval(refreshInterval);
      window.clearTimeout(readyTimeout);
      socket.disconnect();
    };
  }, [loadDashboardData]);

  const services = stats?.services || {};
  const revenue = stats?.revenue || {};
  const assignedServices = useMemo(
    () => activeServices.filter(service => service.status === 'accepted'),
    [activeServices],
  );
  const inProgressServices = useMemo(
    () => activeServices.filter(service => service.status === 'in_progress'),
    [activeServices],
  );
  const unassignedRequests = (services.pending || 0) + (services.quoted || 0);
  const driverValue = Math.max(0, (revenue.total || 0) - (revenue.platformEarnings || 0));

  const connectionCopy = {
    live: { label: 'Canal en vivo', detail: 'Eventos autenticados', className: 'live' },
    authenticating: { label: 'Validando canal', detail: 'Polling activo', className: 'pending' },
    connecting: { label: 'Conectando', detail: 'Polling activo', className: 'pending' },
    offline: { label: 'Sin conexión en vivo', detail: 'Polling cada 30 s', className: 'offline' },
  }[connectionState];

  const openEvent = event => {
    if (event.requestId) history.push(`/services/${event.requestId}`);
    else if (event.driverId) history.push(`/drivers/${event.driverId}`);
  };

  const formatTime = date => date?.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const renderService = service => {
    const status = STATUS_COPY[service.status] || STATUS_COPY.accepted;
    const origin = service.origin?.address || 'Origen no disponible';
    const destination = service.destination?.address || 'Destino no disponible';
    const clientName = service.clientId?.name || service.clientName || 'Cliente';
    const driverName = service.assignedDriverId?.name || 'Conductor asignado';

    return (
      <button
        type="button"
        className="operation-card"
        key={service._id}
        onClick={() => history.push(`/services/${service._id}`)}
      >
        <div className="operation-card__top">
          <span className="operation-id">#{String(service._id).slice(-6).toUpperCase()}</span>
          <span className={`operation-status operation-status--${status.className}`}>
            <span className="operation-status__dot" />
            {status.label}
          </span>
        </div>
        <div className="operation-people">
          <strong>{clientName}</strong>
          <span>{driverName}</span>
        </div>
        <div className="operation-route">
          <div><span className="route-dot route-dot--origin" /> <span>{origin}</span></div>
          <div><span className="route-dot route-dot--destination" /> <span>{destination}</span></div>
        </div>
        <div className="operation-card__bottom">
          <strong>{formatCurrency(service.totalAmount)}</strong>
          <span>Ver detalle →</span>
        </div>
      </button>
    );
  };

  return (
    <IonPage>
      <Sidebar />
      <IonContent>
        <div className="admin-content-wrapper dashboard-wrapper">
          <Header title="Torre de control" />

          <div className="dashboard-statusbar">
            <div className={`connection-state connection-state--${connectionCopy.className}`}>
              <span className="connection-state__dot" />
              <div>
                <strong>{connectionCopy.label}</strong>
                <span>{connectionCopy.detail}</span>
              </div>
            </div>
            <div className="dashboard-update">
              <span>
                {lastUpdated ? `Última actualización ${formatTime(lastUpdated)}` : 'Esperando primera actualización'}
              </span>
              <button
                type="button"
                className="dashboard-refresh"
                onClick={() => loadDashboardData(true)}
                disabled={isRefreshing}
              >
                {isRefreshing ? <IonSpinner name="crescent" /> : '↻'}
                {isRefreshing ? 'Actualizando' : 'Actualizar'}
              </button>
            </div>
          </div>

          {error && (
            <div className="dashboard-error" role="alert">
              <div>
                <strong>No se pudo cargar la operación</strong>
                <span>{error} Los datos visibles podrían estar desactualizados.</span>
              </div>
              <button type="button" onClick={() => loadDashboardData(false)}>Reintentar</button>
            </div>
          )}

          {isLoading && !stats ? (
            <div className="admin-loading">
              <IonSpinner name="crescent" color="primary" />
              <p>Cargando operación...</p>
            </div>
          ) : (
            <>
              <section className="control-section" aria-labelledby="operational-summary">
                <div className="control-section__heading">
                  <div>
                    <span className="section-eyebrow">Operación</span>
                    <h2 id="operational-summary">Pulso de solicitudes y servicios</h2>
                  </div>
                  <span className="section-total">{services.total || 0} históricas</span>
                </div>

                <div className="operational-kpis">
                  <article className="metric-card metric-card--total">
                    <div className="metric-card__icon"><DocumentText size="24" variant="Bold" /></div>
                    <div>
                      <span className="metric-card__label">Solicitudes totales</span>
                      <strong>{services.total || 0}</strong>
                      <small>Histórico operacional</small>
                    </div>
                  </article>
                  <article className="metric-card metric-card--primary">
                    <div className="metric-card__icon"><DocumentText size="24" variant="Bold" /></div>
                    <div>
                      <span className="metric-card__label">Por asignar</span>
                      <strong>{unassignedRequests}</strong>
                      <small>Pendientes o cotizadas</small>
                    </div>
                  </article>
                  <article className="metric-card metric-card--assigned">
                    <div className="metric-card__icon"><Truck size="24" variant="Bold" /></div>
                    <div>
                      <span className="metric-card__label">Asignados</span>
                      <strong>{services.accepted || 0}</strong>
                      <small>Con conductor, sin iniciar</small>
                    </div>
                  </article>
                  <article className="metric-card metric-card--progress">
                    <div className="metric-card__icon"><Truck size="24" variant="Bold" /></div>
                    <div>
                      <span className="metric-card__label">En servicio</span>
                      <strong>{services.inProgress || 0}</strong>
                      <small>Operaciones en marcha</small>
                    </div>
                  </article>
                  <article className="metric-card metric-card--completed">
                    <div className="metric-card__icon"><DocumentText size="24" variant="Bold" /></div>
                    <div>
                      <span className="metric-card__label">Completados</span>
                      <strong>{services.completed || 0}</strong>
                      <small>Servicios finalizados</small>
                    </div>
                  </article>
                  <article className="metric-card metric-card--cancelled">
                    <div className="metric-card__icon"><DocumentText size="24" variant="Bold" /></div>
                    <div>
                      <span className="metric-card__label">Cancelados</span>
                      <strong>{services.cancelled || 0}</strong>
                      <small>Solicitudes cerradas</small>
                    </div>
                  </article>
                </div>
              </section>

              <section className="control-section" aria-labelledby="financial-summary">
                <div className="control-section__heading">
                  <div>
                    <span className="section-eyebrow">Finanzas completadas</span>
                    <h2 id="financial-summary">Distribución de ingresos</h2>
                  </div>
                </div>
                <div className="financial-strip">
                  <article>
                    <div className="financial-icon"><DollarCircle size="22" variant="Bold" /></div>
                    <div><span>Ingresos brutos</span><strong>{formatCurrency(revenue.total)}</strong></div>
                  </article>
                  <article>
                    <div className="financial-icon financial-icon--platform"><DollarCircle size="22" variant="Bold" /></div>
                    <div><span>Comisión Desvare</span><strong>{formatCurrency(revenue.platformEarnings)}</strong></div>
                  </article>
                  <article>
                    <div className="financial-icon financial-icon--drivers"><Truck size="22" variant="Bold" /></div>
                    <div><span>Valor conductores</span><strong>{formatCurrency(driverValue)}</strong></div>
                  </article>
                </div>
              </section>

              <div className="control-grid">
                <section className="control-panel operations-panel" aria-labelledby="active-operations">
                  <div className="panel-heading">
                    <div>
                      <span className="section-eyebrow">Ahora</span>
                      <h2 id="active-operations">Operación activa</h2>
                    </div>
                    <span className="panel-count">{activeServices.length}</span>
                  </div>

                  <div className="operation-groups">
                    <div className="operation-group">
                      <div className="operation-group__heading">
                        <div><span className="group-marker group-marker--assigned" /><h3>Asignados</h3></div>
                        <span>{assignedServices.length}</span>
                      </div>
                      {assignedServices.length > 0
                        ? <div className="operation-list">{assignedServices.map(renderService)}</div>
                        : <div className="group-empty">No hay servicios esperando inicio.</div>}
                    </div>

                    <div className="operation-group">
                      <div className="operation-group__heading">
                        <div><span className="group-marker group-marker--progress" /><h3>En servicio</h3></div>
                        <span>{inProgressServices.length}</span>
                      </div>
                      {inProgressServices.length > 0
                        ? <div className="operation-list">{inProgressServices.map(renderService)}</div>
                        : <div className="group-empty">No hay servicios en marcha.</div>}
                    </div>
                  </div>
                </section>

                <aside className="control-panel events-panel" aria-labelledby="live-events">
                  <div className="panel-heading">
                    <div>
                      <span className="section-eyebrow">Tiempo real</span>
                      <h2 id="live-events">Actividad reciente</h2>
                    </div>
                    {connectionState === 'live' && <span className="live-pill"><span /> En vivo</span>}
                  </div>

                  {liveEvents.length > 0 ? (
                    <div className="event-feed">
                      {liveEvents.map(event => (
                        <button
                          type="button"
                          className={`event-item event-item--${event.type}`}
                          key={event.id}
                          onClick={() => openEvent(event)}
                          disabled={!event.requestId && !event.driverId}
                        >
                          <span className="event-item__marker" />
                          <span className="event-item__body">
                            <span className="event-item__top">
                              <strong>{event.title}</strong>
                              <time>{formatTime(event.timestamp)}</time>
                            </span>
                            <span>{event.detail}</span>
                            {(event.requestId || event.driverId) && (
                              <small>#{String(event.requestId || event.driverId).slice(-6).toUpperCase()}</small>
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="events-empty">
                      <span className="events-empty__signal"><span /></span>
                      <strong>Esperando actividad</strong>
                      <p>Los eventos operacionales aparecerán aquí en tiempo real.</p>
                    </div>
                  )}
                </aside>
              </div>
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;
