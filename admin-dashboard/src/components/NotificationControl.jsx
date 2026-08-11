import React, { useCallback, useEffect, useState } from 'react';
import { Notification } from 'iconsax-react';
import {
  disableWebPush,
  enableWebPush,
  getWebPushStatus,
} from '../services/webPushService';

const STATUS_COPY = {
  enabled: 'Notificaciones activas',
  disabled: 'Activar notificaciones',
  denied: 'Notificaciones bloqueadas',
  unsupported: 'No disponible en este navegador',
  unconfigured: 'Notificaciones no configuradas',
  'ios-install-required': 'Instala el admin para activar alertas',
};

const NotificationControl = () => {
  const [status, setStatus] = useState('loading');
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState('');

  const refreshStatus = useCallback(async () => {
    try {
      const nextState = await getWebPushStatus();
      setStatus(nextState.status);
      if (nextState.status === 'ios-install-required') {
        setMessage('En iPhone, agrega el admin a tu pantalla de inicio y ábrelo desde el ícono.');
      }
    } catch {
      setStatus('unsupported');
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const handleToggle = async () => {
    if (!['enabled', 'disabled'].includes(status) || isUpdating) return;

    setIsUpdating(true);
    setMessage('');

    try {
      if (status === 'enabled') {
        await disableWebPush();
        setStatus('disabled');
        setMessage('Las notificaciones se desactivaron en este dispositivo.');
      } else {
        await enableWebPush();
        setStatus('enabled');
        setMessage('Recibirás alertas nuevas en este dispositivo.');
      }
    } catch (error) {
      await refreshStatus();
      setMessage(error.message || 'No se pudo cambiar la configuración.');
    } finally {
      setIsUpdating(false);
    }
  };

  const label = isUpdating
    ? 'Actualizando...'
    : STATUS_COPY[status] || 'Comprobando notificaciones...';
  const isEnabled = status === 'enabled';
  const isDisabled = !['enabled', 'disabled'].includes(status) || isUpdating;

  return (
    <div className="admin-notification-control">
      <button
        type="button"
        className={`admin-notification-toggle ${isEnabled ? 'is-enabled' : ''}`}
        onClick={handleToggle}
        disabled={isDisabled}
        aria-pressed={isEnabled}
        aria-label={label}
        aria-describedby={message ? 'admin-notification-message' : undefined}
        title={label}
      >
        <Notification size="21" color="currentColor" variant={isEnabled ? 'Bold' : 'Linear'} />
        <span>{label}</span>
        <span className="admin-notification-state" aria-hidden="true">
          {isEnabled ? 'ON' : 'OFF'}
        </span>
      </button>
      {message && (
        <span
          id="admin-notification-message"
          className="admin-notification-message"
          role="status"
        >
          {message}
        </span>
      )}
    </div>
  );
};

export default NotificationControl;

