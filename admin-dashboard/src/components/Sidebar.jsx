import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Category, People, Truck, DocumentText, Chart, Setting2, LogoutCurve } from 'iconsax-react';
import { authAPI } from '../services/adminAPI';
import logo from '../assets/img/Desvare-white.svg';
import './Sidebar.css';

const Sidebar = () => {
  const history = useHistory();
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', icon: <Category size="24" />, label: 'Dashboard' },
    { path: '/drivers', icon: <Truck size="24" />, label: 'Conductores' },
    { path: '/clients', icon: <People size="24" />, label: 'Clientes' },
    { path: '/reports', icon: <Chart size="24" />, label: 'Reportes' },
    { path: '/services', icon: <DocumentText size="24" />, label: 'Servicios' },
    { path: '/settings', icon: <Setting2 size="24" />, label: 'Configuración' },
  ];

  const handleLogout = () => {
    authAPI.logout();
    history.replace('/login');
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="admin-sidebar">
      <div className="admin-sidebar-header">
        <img src={logo} alt="Desvare" className="admin-sidebar-logo" />
        <h2>Admin Dashboard</h2>
      </div>

      <nav className="admin-sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.path}
            className={`admin-sidebar-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => history.push(item.path)}
          >
            <span className="admin-sidebar-icon">{item.icon}</span>
            <span className="admin-sidebar-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <button className="admin-sidebar-logout" onClick={handleLogout}>
          <LogoutCurve size="24" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

