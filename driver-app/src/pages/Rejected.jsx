import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonContent, IonButton, IonText } from '@ionic/react';
import { CloseCircle, InfoCircle, Refresh } from 'iconsax-react';
import DesvareLogoWhite from '../../../shared/src/img/Desvare-white.svg';
import './Rejected.css';

/**
 * Vista "Rechazado"
 * Se muestra cuando el administrador rechaza el perfil del conductor.
 * El conductor puede ver el motivo y reintentar el registro.
 */

const Rejected = () => {
  const history = useHistory();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Obtener datos del usuario del localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleRetry = () => {
    // Redirigir al registro completo para que pueda corregir sus datos
    history.replace('/complete-registration');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    history.replace('/splash');
  };

  const handleContactSupport = () => {
    // Abrir WhatsApp con mensaje pre-escrito
    const phone = '+573505790415';
    const message = `Hola, soy ${user?.name || 'un conductor'} y mi perfil fue rechazado. Me gustaría saber más detalles. Mi número es ${user?.phone || 'N/A'}.`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const rejectionReason = user?.driverProfile?.rejectionReason || 
    'Algunos de tus documentos no cumplen con los requisitos o la información proporcionada no es correcta.';

  return (
    <IonPage>
      <IonContent className="rejected-content">
        <div className="rejected-container">
          {/* Logo */}
          <div className="rejected-logo-container">
            <img src={DesvareLogoWhite} alt="Desvare" className="rejected-logo" />
          </div>

          {/* Ícono principal */}
          <div className="rejected-icon">
            <CloseCircle size="80" color="white" variant="Bulk" />
          </div>

          {/* Título */}
          <h1 className="rejected-title">Perfil No Aprobado</h1>
          <p className="rejected-subtitle">
            Tu solicitud no fue aprobada
          </p>

          {/* Razón del rechazo */}
          <div className="rejected-card">
            <div className="rejected-card-header">
              <InfoCircle size="24" color="#FCD34D" variant="Bold" />
              <span>Motivo del rechazo</span>
            </div>
            <p className="rejected-reason">
              {rejectionReason}
            </p>
          </div>

          {/* Instrucciones */}
          <div className="rejected-instructions">
            <h3>¿Qué puedes hacer?</h3>
            <ul>
              <li>Revisa tus documentos y asegúrate de que sean legibles</li>
              <li>Verifica que la información sea correcta y completa</li>
              <li>Asegúrate de que las fotos sean claras y bien iluminadas</li>
              <li>Vuelve a intentar el registro con datos correctos</li>
            </ul>
          </div>

          {/* Botones */}
          <div className="rejected-actions">
            <IonButton
              expand="block"
              className="retry-button"
              onClick={handleRetry}
            >
              <Refresh size="20" />
              <span>Volver a Intentar</span>
            </IonButton>

            <IonButton
              expand="block"
              fill="clear"
              className="support-button"
              onClick={handleContactSupport}
            >
              Contactar Soporte
            </IonButton>

            <IonButton
              expand="block"
              fill="outline"
              className="logout-button-rejected"
              onClick={handleLogout}
            >
              Cerrar Sesión
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Rejected;

