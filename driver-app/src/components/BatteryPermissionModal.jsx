import React from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonText,
} from '@ionic/react';
import { flashOutline, timeOutline, navigateOutline, lockOpenOutline } from 'ionicons/icons';
import './BatteryPermissionModal.css';

/**
 * Modal que explica por qué la app necesita estar exenta de la
 * optimización de batería (Samsung Device Care / Android Doze).
 *
 * Se muestra en la pantalla Home antes de disparar el diálogo nativo del sistema,
 * igual que LocationPermissionModal hace con los permisos de ubicación.
 */
const BatteryPermissionModal = ({ isOpen, onDismiss, onRequestPermission }) => {
  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss} className="battery-permission-modal">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Rendimiento en segundo plano</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="battery-modal-content">

          {/* Icono principal */}
          <div className="battery-icon-container">
            <IonIcon icon={flashOutline} className="battery-main-icon" />
          </div>

          {/* Título */}
          <h2 className="battery-permission-title">¿Por qué necesitamos este permiso?</h2>

          {/* Descripción */}
          <p className="battery-permission-description">
            Para que el cliente siempre pueda ver tu ubicación en tiempo real,
            incluso cuando tu teléfono está bloqueado o estás en otra app.
          </p>

          {/* Lista de beneficios */}
          <div className="battery-permission-benefits">
            <div className="battery-benefit-item">
              <IonIcon icon={navigateOutline} className="battery-benefit-icon" />
              <div className="battery-benefit-text">
                <strong>GPS sin interrupciones</strong>
                <p>Tu ubicación se envía aunque el teléfono esté bloqueado</p>
              </div>
            </div>

            <div className="battery-benefit-item">
              <IonIcon icon={timeOutline} className="battery-benefit-icon" />
              <div className="battery-benefit-text">
                <strong>Servicio siempre activo</strong>
                <p>El cliente sigue viendo tu posición mientras vas en camino</p>
              </div>
            </div>

            <div className="battery-benefit-item">
              <IonIcon icon={lockOpenOutline} className="battery-benefit-icon" />
              <div className="battery-benefit-text">
                <strong>Sin conexiones perdidas</strong>
                <p>La app no se cierra cuando cambias de aplicación</p>
              </div>
            </div>
          </div>

          {/* Nota de privacidad */}
          <div className="battery-privacy-note">
            <IonText color="medium">
              <small>
                🔒 Este permiso solo afecta a Desvare. Tu batería sigue protegida en todas las demás apps.
              </small>
            </IonText>
          </div>

          {/* Botones de acción */}
          <div className="battery-permission-buttons">
            <IonButton
              expand="block"
              size="large"
              onClick={onRequestPermission}
              className="battery-primary-button"
            >
              Activar rendimiento
            </IonButton>
            <IonButton
              expand="block"
              fill="clear"
              onClick={onDismiss}
              className="battery-secondary-button"
            >
              Más tarde
            </IonButton>
          </div>

        </div>
      </IonContent>
    </IonModal>
  );
};

export default BatteryPermissionModal;
