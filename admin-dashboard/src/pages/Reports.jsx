import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonSpinner, IonButton } from '@ionic/react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { reportsAPI, dashboardAPI } from '../services/adminAPI';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DocumentDownload, Calendar } from 'iconsax-react';
import './Reports.css';

const Reports = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');

  useEffect(() => {
    loadReports();
  }, [dateRange]);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const response = await dashboardAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('❌ Error cargando reportes:', error);
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

  // Datos de ejemplo para gráficos (en producción vendrían del backend)
  const servicesData = [
    { name: 'Ene', completados: 45, cancelados: 5 },
    { name: 'Feb', completados: 52, cancelados: 8 },
    { name: 'Mar', completados: 61, cancelados: 6 },
    { name: 'Abr', completados: 70, cancelados: 9 },
    { name: 'May', completados: 85, cancelados: 7 },
    { name: 'Jun', completados: 92, cancelados: 10 },
  ];

  const revenueData = [
    { name: 'Ene', ingresos: 4500000 },
    { name: 'Feb', ingresos: 5200000 },
    { name: 'Mar', ingresos: 6100000 },
    { name: 'Abr', ingresos: 7000000 },
    { name: 'May', ingresos: 8500000 },
    { name: 'Jun', ingresos: 9200000 },
  ];

  const vehicleCategoryData = [
    { name: 'Autos', value: 45 },
    { name: 'Camionetas', value: 30 },
    { name: 'Camiones', value: 15 },
    { name: 'Buses', value: 10 },
  ];

  const COLORS = ['#0055FF', '#10B981', '#F59E0B', '#EF4444'];

  const handleExport = () => {
    alert('📊 Función de exportar reportes en desarrollo...');
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

  return (
    <IonPage>
      <Sidebar />
      <IonContent>
        <div className="admin-content-wrapper">
          <Header title="Reportes y Analíticas" />

          {/* Filters and Export */}
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
            
            <IonButton onClick={handleExport}>
              <DocumentDownload size="20" style={{ marginRight: '8px' }} />
              Exportar Reporte
            </IonButton>
          </div>

          {/* Summary Cards */}
          <div className="reports-summary">
            <div className="summary-card">
              <span className="summary-label">Ingresos Totales</span>
              <span className="summary-value">{formatCurrency(stats?.revenue?.total || 0)}</span>
              <span className="summary-change positive">+12% vs mes anterior</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Servicios Completados</span>
              <span className="summary-value">{stats?.services?.completed || 0}</span>
              <span className="summary-change positive">+8% vs mes anterior</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Nuevos Clientes</span>
              <span className="summary-value">{stats?.clients?.total || 0}</span>
              <span className="summary-change positive">+15% vs mes anterior</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Conductores Activos</span>
              <span className="summary-value">{stats?.drivers?.active || 0}</span>
              <span className="summary-change neutral">=0% vs mes anterior</span>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="charts-grid">
            {/* Services Chart */}
            <div className="chart-card">
              <h3 className="chart-title">Servicios por Mes</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={servicesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completados" fill="#10B981" name="Completados" />
                  <Bar dataKey="cancelados" fill="#EF4444" name="Cancelados" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue Chart */}
            <div className="chart-card">
              <h3 className="chart-title">Ingresos por Mes</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="ingresos" 
                    stroke="#0055FF" 
                    strokeWidth={3} 
                    name="Ingresos"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Vehicle Categories Chart */}
            <div className="chart-card">
              <h3 className="chart-title">Servicios por Categoría de Vehículo</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={vehicleCategoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {vehicleCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Driver Performance */}
            <div className="chart-card">
              <h3 className="chart-title">Top Conductores del Mes</h3>
              <div className="top-drivers-list">
                <div className="top-driver-item">
                  <div className="rank gold">🥇</div>
                  <div className="driver-info">
                    <span className="driver-name">Juan Pérez</span>
                    <span className="driver-services">45 servicios</span>
                  </div>
                  <div className="driver-earnings">{formatCurrency(4500000)}</div>
                </div>
                <div className="top-driver-item">
                  <div className="rank silver">🥈</div>
                  <div className="driver-info">
                    <span className="driver-name">María García</span>
                    <span className="driver-services">38 servicios</span>
                  </div>
                  <div className="driver-earnings">{formatCurrency(3800000)}</div>
                </div>
                <div className="top-driver-item">
                  <div className="rank bronze">🥉</div>
                  <div className="driver-info">
                    <span className="driver-name">Carlos Rodríguez</span>
                    <span className="driver-services">32 servicios</span>
                  </div>
                  <div className="driver-earnings">{formatCurrency(3200000)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Reports;

