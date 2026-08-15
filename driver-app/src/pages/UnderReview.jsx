import React, { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonContent, IonButton, IonToast, IonSpinner } from '@ionic/react';
import { Clock, SecurityUser, TickCircle, Notification } from 'iconsax-react';
import DesvareLogoWhite from '../assets/img/Desvare.svg';
import socketService from '../services/socket';
import { authAPI } from '../services/api';
import { initializePushNotifications, isPushPermissionGranted } from '../services/pushNotifications';
import './UnderReview.css';

const NOTIFY_DECLINED_KEY = 'underReviewNotifyDeclined';

const UnderReview = () => {
  const history = useHistory();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('success');
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [notifyDeclined, setNotifyDeclined] = useState(
    () => localStorage.getItem(NOTIFY_DECLINED_KEY) === 'true',
  );
  const [notifyLoading, setNotifyLoading] = useState(false);
  const navigatedRef = useRef(false);

  const navigateForStatus = (status, message) => {
    if (navigatedRef.current) return;
    if (status !== 'approved' && status !== 'rejected') return;

    navigatedRef.current = true;

    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    localStorage.setItem('user', JSON.stringify({
      ...storedUser,
      driverProfile: {
        ...(storedUser.driverProfile || {}),
        status,
      },
    }));

    setToastColor(status === 'approved' ? 'success' : 'danger');
    setToastMessage(message);
    setShowToast(true);

    setTimeout(() => {
      if (status === 'rejected') {
        history.replace('/rejected');
        return;
      }
      history.replace(
        localStorage.getItem('permissionsConfigured') ? '/home' : '/permissions',
      );
    }, 1500);
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user._id;

    if (!userId) {
      console.warn('⚠️ No se encontró ID de usuario, no se puede conectar Socket.IO');
      return;
    }

    isPushPermissionGranted().then((granted) => {
      if (granted) setNotifyEnabled(true);
    });

    const socket = socketService.connect();
    const register = () => socketService.registerDriver(userId);
    register();
    if (socket && !socket.connected) {
      socket.once('connect', register);
    }
    socketService.onReconnect(register);

    const onApproved = (data) => {
      navigateForStatus(
        'approved',
        data?.message || '¡Tu cuenta ha sido aprobada! Redirigiendo...',
      );
    };
    const onRejected = (data) => {
      navigateForStatus(
        'rejected',
        data?.message || 'Tu cuenta ha sido rechazada.',
      );
    };

    socketService.onAccountApproved(onApproved);
    socketService.onAccountRejected(onRejected);

    const checkStatus = async () => {
      if (navigatedRef.current) return;
      try {
        const res = await authAPI.getMyProfile();
        const status = res.data?.driver?.status;
        if (status === 'approved') {
          navigateForStatus('approved', '¡Tu cuenta ha sido aprobada! Redirigiendo...');
        } else if (status === 'rejected') {
          navigateForStatus('rejected', 'Tu cuenta ha sido rechazada.');
        }
      } catch (error) {
        console.warn('⚠️ No se pudo consultar el estado del perfil:', error?.message);
      }
    };

    checkStatus();
    const pollId = setInterval(checkStatus, 20000);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') checkStatus();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      socketService.offAccountApproved(onApproved);
      socketService.offAccountRejected(onRejected);
      socketService.offReconnect(register);
      if (socket) socket.off('connect', register);
      clearInterval(pollId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [history]);

  const handleEnableNotifications = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user._id) return;

    setNotifyLoading(true);
    try {
      const granted = await initializePushNotifications(user._id);
      if (granted) {
        setNotifyEnabled(true);
        localStorage.removeItem(NOTIFY_DECLINED_KEY);
        setToastColor('success');
        setToastMessage('Listo. Te avisaremos cuando te aprueben.');
        setShowToast(true);
      } else {
        setNotifyDeclined(true);
        localStorage.setItem(NOTIFY_DECLINED_KEY, 'true');
        setToastColor('warning');
        setToastMessage('Puedes activar las notificaciones más adelante.');
        setShowToast(true);
      }
    } catch (error) {
      console.error('❌ Error activando notificaciones:', error);
      setNotifyDeclined(true);
      localStorage.setItem(NOTIFY_DECLINED_KEY, 'true');
    } finally {
      setNotifyLoading(false);
    }
  };

  const handleDeclineNotifications = () => {
    setNotifyDeclined(true);
    localStorage.setItem(NOTIFY_DECLINED_KEY, 'true');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    socketService.disconnect();
    history.replace('/splash');
  };

  return (
    <IonPage>
      <IonContent className="under-review-content">
        <div className="under-review-container">
          <div className="under-review-logo-container">
            <img src={DesvareLogoWhite} alt="Desvare" className="under-review-logo" />
          </div>

          <div className="under-review-icon">
            <TickCircle size="32" color="green" variant="Bulk" />
          </div>

          <h1 className="under-review-title">¡Registro Completo!</h1>
          <p className="under-review-subtitle">
            Tu perfil está en revisión
          </p>

          <div className="under-review-card">
            <p className="under-review-description">
              Nuestro equipo está revisando tus documentos y datos.
              Este proceso puede tardar <strong>24 a 48 horas</strong>.
            </p>
          </div>

          <div className="review-checklist">
            <div className="checklist-item">
              <TickCircle size="24" color="#10B981" variant="Bold" />
              <span>Documentos recibidos</span>
            </div>
            <div className="checklist-item">
              <SecurityUser size="24" color="#10B981" variant="Bold" />
              <span>Verificación en proceso</span>
            </div>
            <div className="checklist-item">
              <Clock size="24" color="#F59E0B" variant="Bold" />
              <span>Esperando aprobación</span>
            </div>
          </div>

          {notifyEnabled ? (
            <div className="under-review-notice">
              <p>
                Te avisaremos cuando tu perfil sea aprobado y puedas empezar a recibir servicios.
              </p>
            </div>
          ) : notifyDeclined ? (
            <div className="under-review-notice">
              <p>
                Te notificaremos cuando tu perfil sea aprobado. Si no activaste avisos, revisa esta pantalla o entra de nuevo más tarde.
              </p>
            </div>
          ) : (
            <div className="under-review-notify-card">
              <div className="under-review-notify-icon">
                <Notification size="24" color="#0055FF" variant="Bold" />
              </div>
              <p className="under-review-notify-title">
                ¿Quieres que te avisemos cuando te aprueben?
              </p>
              <p className="under-review-notify-text">
                Activa las notificaciones para enterarte aunque no tengas la app abierta.
              </p>
              <div className="under-review-notify-actions">
                <IonButton
                  expand="block"
                  className="under-review-notify-accept"
                  onClick={handleEnableNotifications}
                  disabled={notifyLoading}
                >
                  {notifyLoading ? <IonSpinner name="crescent" /> : 'Sí, avísame'}
                </IonButton>
                <button
                  type="button"
                  className="under-review-notify-later"
                  onClick={handleDeclineNotifications}
                  disabled={notifyLoading}
                >
                  Ahora no
                </button>
              </div>
            </div>
          )}

          <IonButton
            expand="block"
            fill="outline"
            className="logout-button"
            onClick={handleLogout}
          >
            Cerrar Sesión
          </IonButton>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={1500}
          position="top"
          color={toastColor}
        />
      </IonContent>
    </IonPage>
  );
};

export default UnderReview;
