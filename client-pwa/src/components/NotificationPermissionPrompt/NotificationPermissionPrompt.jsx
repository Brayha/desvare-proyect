import { useState } from 'react';
import { IonButton, IonIcon, IonText } from '@ionic/react';
import { notifications, notificationsOff } from 'ionicons/icons';
import './NotificationPermissionPrompt.css';

/**
 * Componente para solicitar permisos de notificaciones push
 * Se muestra después del login o registro exitoso
 */
const NotificationPermissionPrompt = ({ onRequestPermission, onDismiss }) => {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      await onRequestPermission();
    } finally {
      setIsRequesting(false);
    }
  };

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
