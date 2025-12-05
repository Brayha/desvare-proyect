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
import { locationOutline, navigateCircleOutline, mapOutline } from 'ionicons/icons';
import './LocationPermissionModal.css';

/**
 * Modal que explica por qué necesitamos permisos de ubicación
 * Se muestra al entrar a /home por primera vez
 */
const LocationPermissionModal = ({ isOpen, onDismiss, onRequestPermission }) => {
  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss} className="location-permission-modal">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Ubicación Necesaria</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="permission-modal-content">
          {/* Icono principal */}
          <div className="permission-icon-container">
            <IonIcon icon={locationOutline} className="permission-main-icon" />
          </div>

          {/* Título */}
          <h2 className="permission-title">¿Por qué necesitamos tu ubicación?</h2>

          {/* Descripción */}
          <p className="permission-description">
            Para ofrecerte el mejor servicio, necesitamos acceder a tu ubicación en tiempo real.
          </p>

          {/* Lista de beneficios */}
          <div className="permission-benefits">
            <div className="benefit-item">
              <IonIcon icon={navigateCircleOutline} className="benefit-icon" />
              <div className="benefit-text">
                <strong>Cotizaciones precisas</strong>
                <p>Los clientes verán tu ubicación al recibir tu cotización</p>
              </div>
            </div>

            <div className="benefit-item">
              <IonIcon icon={mapOutline} className="benefit-icon" />
              <div className="benefit-text">
                <strong>Seguimiento en vivo</strong>
                <p>Durante el servicio, el cliente podrá ver por dónde vas</p>
              </div>
            </div>

            <div className="benefit-item">
              <IonIcon icon={locationOutline} className="benefit-icon" />
              <div className="benefit-text">
                <strong>Más confianza</strong>
                <p>Los clientes confían más en conductores con ubicación activa</p>
              </div>
            </div>
          </div>

          {/* Nota de privacidad */}
          <div className="permission-privacy-note">
            <IonText color="medium">
              <small>
                🔒 Tu ubicación es privada y solo se comparte con clientes que soliciten tus servicios.
              </small>
            </IonText>
          </div>

          {/* Botones de acción */}
          <div className="permission-buttons">
            <IonButton
              expand="block"
              size="large"
              onClick={onRequestPermission}
              className="permission-primary-button"
            >
              Activar Ubicación
            </IonButton>
            <IonButton
              expand="block"
              fill="clear"
              onClick={onDismiss}
              className="permission-secondary-button"
            >
              Más tarde
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default LocationPermissionModal;

