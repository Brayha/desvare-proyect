import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonSpinner, IonButton } from '@ionic/react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { reportsAPI } from '../services/adminAPI';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { DocumentDownload, Calendar } from 'iconsax-react';
import './Reports.css';

const COLORS = ['#0055FF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const PERIOD_LABELS = {
  week: 'Última semana',
  month: 'Último mes',
  quarter: 'Último trimestre',
  year: 'Último año',
};

const Reports = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [dateRange, setDateRange] = useState('month');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadReports();
  }, [dateRange]);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await reportsAPI.getRevenue(dateRange);
      setData(response.data);
    } catch (err) {
      console.error('❌ Error cargando reportes:', err);
      setError('No se pudieron cargar los reportes. Verifica la conexión al servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await reportsAPI.export(dateRange);
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `desvare-reporte-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('❌ Error exportando:', err);
      alert('Error al exportar el reporte. Intenta de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <IonPage>
        <Sidebar />
        <IonContent>
          <div className="admin-content-wrapper">
            <Header title="Reportes y Analíticas" />
            <div className="admin-loading">
              <IonSpinner name="crescent" color="primary" />
              <p>Cargando reportes...</p>
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (error) {
    return (
      <IonPage>
        <Sidebar />
        <IonContent>
          <div className="admin-content-wrapper">
            <Header title="Reportes y Analíticas" />
            <div className="admin-loading">
              <p style={{ color: '#EF4444' }}>{error}</p>
              <IonButton onClick={loadReports}>Reintentar</IonButton>
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const { chartData = [], vehicleCategoryData = [], topDrivers = [], totals = {} } = data || {};

  return (
    <IonPage>
      <Sidebar />
      <IonContent>
        <div className="admin-content-wrapper">
          <Header title="Reportes y Analíticas" />

          {/* Filtros y exportar */}
          <div className="reports-actions">
            <div className="date-range-selector">
              <Calendar size="20" color="#6B7280" />
              <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
                <option value="quarter">Último trimestre</option>
                <option value="year">Último año</option>
              </select>
            </div>

            <IonButton onClick={handleExport} disabled={isExporting}>
              <DocumentDownload size="20" style={{ marginRight: '8px' }} />
              {isExporting ? 'Exportando...' : 'Exportar CSV'}
            </IonButton>
          </div>

          {/* Tarjetas de resumen — datos reales del periodo */}
          <div className="reports-summary">
            <div className="summary-card">
              <span className="summary-label">Ingresos — {PERIOD_LABELS[dateRange]}</span>
              <span className="summary-value">{formatCurrency(totals.ingresos)}</span>
              <span className="summary-change neutral">10% comisión: {formatCurrency(totals.ganancias)}</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Servicios Completados</span>
              <span className="summary-value">{totals.completados || 0}</span>
              <span className="summary-change neutral">{totals.cancelados || 0} cancelados</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Total Solicitudes</span>
              <span className="summary-value">
                {(totals.completados || 0) + (totals.cancelados || 0)}
              </span>
              <span className="summary-change neutral">
                {totals.completados && (totals.completados + totals.cancelados) > 0
                  ? Math.round((totals.completados / (totals.completados + totals.cancelados)) * 100)
                  : 0}% tasa de éxito
              </span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Top Conductor</span>
              <span className="summary-value">
                {topDrivers[0]?.name || '—'}
              </span>
              <span className="summary-change neutral">
                {topDrivers[0] ? `${topDrivers[0].servicios} servicios` : 'Sin datos'}
              </span>
            </div>
          </div>

          {/* Gráficos */}
          <div className="charts-grid">

            {/* Servicios completados vs cancelados por periodo */}
            <div className="chart-card">
              <h3 className="chart-title">Servicios por Periodo</h3>
              {chartData.length === 0 ? (
                <div className="chart-empty">Sin datos para el periodo seleccionado</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completados" fill="#10B981" name="Completados" />
                    <Bar dataKey="cancelados" fill="#EF4444" name="Cancelados" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Ingresos por periodo */}
            <div className="chart-card">
              <h3 className="chart-title">Ingresos por Periodo</h3>
              {chartData.length === 0 ? (
                <div className="chart-empty">Sin datos para el periodo seleccionado</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="ingresos"
                      stroke="#0055FF"
                      strokeWidth={3}
                      name="Ingresos"
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Categorías de vehículos */}
            <div className="chart-card">
              <h3 className="chart-title">Servicios por Categoría de Vehículo</h3>
              {vehicleCategoryData.length === 0 || vehicleCategoryData[0]?.name === 'Sin datos' ? (
                <div className="chart-empty">Sin datos de categorías para este periodo</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={vehicleCategoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {vehicleCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Top conductores reales */}
            <div className="chart-card">
              <h3 className="chart-title">Top Conductores del Periodo</h3>
              {topDrivers.length === 0 ? (
                <div className="chart-empty">Sin servicios completados en este periodo</div>
              ) : (
                <div className="top-drivers-list">
                  {topDrivers.map((driver, index) => {
                    const medals = ['🥇', '🥈', '🥉'];
                    const rankClass = ['gold', 'silver', 'bronze'][index] || 'default';
                    return (
                      <div key={driver._id || index} className="top-driver-item">
                        <div className={`rank ${rankClass}`}>
                          {medals[index] || `#${index + 1}`}
                        </div>
                        <div className="driver-info">
                          <span className="driver-name">{driver.name}</span>
                          <span className="driver-services">{driver.servicios} servicios</span>
                        </div>
                        <div className="driver-earnings">{formatCurrency(driver.ingresos)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Reports;
