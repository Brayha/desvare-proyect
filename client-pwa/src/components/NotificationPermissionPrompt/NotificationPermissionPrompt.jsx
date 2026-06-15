import { useState } from 'react';
import { IonButton, IonIcon, IonText } from '@ionic/react';
import { notifications, notificationsOff } from 'ionicons/icons';
import './NotificationPermissionPrompt.css';

/**
 * Componente para solicitar permisos de notificaciones push
 * Se muestra después del login o registro exitoso
 */
// En iOS las notificaciones push SOLO funcionan si la PWA está instalada en la
// pantalla de inicio (iOS 16.4+). En Safari normal, pedir permiso no sirve.
const isIOSDevice = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalonePWA = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

const NotificationPermissionPrompt = ({ onRequestPermission, onDismiss }) => {
  const [isRequesting, setIsRequesting] = useState(false);

  // iPhone/iPad sin instalar → primero hay que instalar la PWA.
  const iosNeedsInstall = isIOSDevice() && !isStandalonePWA();

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      await onRequestPermission();
    } finally {
      setIsRequesting(false);
    }
  };

  if (iosNeedsInstall) {
    return (
      <div className="notification-permission-prompt">
        <div className="notification-prompt-content">
          <div className="notification-icon-container">
            <IonIcon icon={notifications} className="notification-icon" />
          </div>

          <IonText>
            <h2>Instala la app para recibir avisos</h2>
            <p>
              En iPhone, las notificaciones de nuevas cotizaciones solo llegan si
              agregas Desvare a tu pantalla de inicio:
            </p>
            <ol style={{ textAlign: 'left', paddingLeft: '1.2rem', margin: '0.5rem 0' }}>
              <li>Toca el botón <strong>Compartir</strong> en Safari.</li>
              <li>Elige <strong>"Añadir a pantalla de inicio"</strong>.</li>
              <li>Abre Desvare desde el nuevo ícono y activa las notificaciones.</li>
            </ol>
          </IonText>

          <div className="notification-prompt-actions">
            <IonButton
              expand="block"
              fill="clear"
              color="medium"
              onClick={onDismiss}
            >
              Entendido
            </IonButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-permission-prompt">
      <div className="notification-prompt-content">
        <div className="notification-icon-container">
          <IonIcon icon={notifications} className="notification-icon" />
        </div>
        
        <IonText>
          <h2>¿Recibir notificaciones?</h2>
          <p>
            Te avisaremos cuando lleguen nuevas cotizaciones para tu solicitud de grúa,
            incluso si estás en otra app.
          </p>
        </IonText>

        <div className="notification-prompt-actions">
          <IonButton
            expand="block"
            color="primary"
            onClick={handleRequestPermission}
            disabled={isRequesting}
          >
            {isRequesting ? 'Configurando...' : 'Activar Notificaciones'}
          </IonButton>
          
          <IonButton
            expand="block"
            fill="clear"
            color="medium"
            onClick={onDismiss}
            disabled={isRequesting}
          >
            Ahora no
          </IonButton>
        </div>

        <div className="notification-prompt-info">
          <IonIcon icon={notificationsOff} size="small" />
          <IonText color="medium">
            <p>Puedes cambiar esto después en la configuración de tu cuenta</p>
          </IonText>
        </div>
      </div>
    </div>
  );
};

export default NotificationPermissionPrompt;
