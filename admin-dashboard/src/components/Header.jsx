import React, { useState, useEffect } from 'react';
import { User } from 'iconsax-react';
import NotificationControl from './NotificationControl';
import './Header.css';

const Header = ({ title }) => {
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    const adminData = localStorage.getItem('admin');
    if (adminData) {
      setAdmin(JSON.parse(adminData));
    }
  }, []);

  return (
    <div className="admin-header">
      <div className="admin-header-left">
        <h1 className="admin-header-title">{title}</h1>
      </div>

      <div className="admin-header-right">
        <NotificationControl />

        <div className="admin-header-user">
          <div className="admin-header-user-info">
            <span className="admin-header-user-name">{admin?.name || 'Admin'}</span>
            <span className="admin-header-user-role">{admin?.role || 'super_admin'}</span>
          </div>
          <div className="admin-header-user-avatar">
            <User size="20" color="white" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;

