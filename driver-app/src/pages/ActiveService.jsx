import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonCard,
  IonCardContent,
  IonIcon,
  IonText,
  IonSpinner,
  IonButtons,
  IonBackButton,
  useIonToast,
  useIonAlert,
} from '@ionic/react';
import { 
  call, 
  navigate, 
  person, 
  location, 
  car,
  shield,
  cash,
  checkmarkCircle
} from 'ionicons/icons';
import './ActiveService.css';

const ActiveService = () => {
  const history = useHistory();
  const [present] = useIonToast();
  const [presentAlert] = useIonAlert();
  
  const [serviceData, setServiceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('🚗 ActiveService - Inicializando...');
    
    // Cargar datos del servicio activo desde localStorage
    const activeServiceData = localStorage.getItem('activeService');
    
    if (!activeServiceData) {
      console.log('❌ No hay servicio activo');
      present({
        message: 'No se encontraron datos del servicio',
        duration: 2000,
        color: 'danger',
      });
      history.push('/home');
      return;
    }

    try {
      const parsedData = JSON.parse(activeServiceData);
      console.log('📦 Servicio activo cargado:', parsedData);
      setServiceData(parsedData);
    } catch (error) {
      console.error('❌ Error al parsear servicio activo:', error);
      history.push('/home');
      return;
    } finally {
      setIsLoading(false);
    }
  }, [history, present]);

  const handleCall = () => {
    if (serviceData?.clientName && serviceData?.origin?.address) {
      // Usar el teléfono que venga en los datos del servicio
      // O buscar el teléfono en la base de datos si es necesario
      const phoneNumber = serviceData.clientPhone || 'No disponible';
      
      if (phoneNumber !== 'No disponible') {
        window.location.href = `tel:${phoneNumber}`;
      } else {
        present({
          message: 'Teléfono del cliente no disponible',
          duration: 2000,
          color: 'warning',
        });
      }
    }
  };

  const handleStartNavigation = () => {
    if (serviceData?.origin?.coordinates) {
      const [lng, lat] = serviceData.origin.coordinates;
      
      // Abrir Google Maps con navegación al origen
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(mapsUrl, '_blank');
      
      present({
        message: 'Abriendo navegación...',
        duration: 2000,
        color: 'success',
      });
    }
  };

  const handleVerifySecurityCode = () => {
    presentAlert({
      header: '🔒 Verificar Código',
      message: 'Solicita al cliente el código de seguridad de 4 dígitos',
      inputs: [
        {
          name: 'code',
          type: 'number',
          placeholder: 'Código de 4 dígitos',
          min: 1000,
          max: 9999,
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Verificar',
          handler: (data) => {
            if (data.code === serviceData.securityCode) {
              present({
                message: '✅ Código correcto. Puedes iniciar el servicio.',
                duration: 3000,
                color: 'success',
              });
            } else {
              present({
                message: '❌ Código incorrecto. Intenta de nuevo.',
                duration: 2000,
                color: 'danger',
              });
            }
          },
        },
      ],
    });
  };

  const handleCompleteService = () => {
    presentAlert({
      header: '✅ Completar Servicio',
      message: '¿Confirmas que el servicio ha sido completado exitosamente?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Confirmar',
          handler: () => {
            // Limpiar servicio activo
            localStorage.removeItem('activeService');
            
            present({
              message: '🎉 ¡Servicio completado exitosamente!',
              duration: 3000,
              color: 'success',
            });
            
            // Volver al home
            history.push('/home');
          },
        },
      ],
    });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <IonSpinner />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!serviceData) {
    return null;
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>🚗 Servicio Activo</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="active-service-page">
        {/* Información del Cliente */}
        <IonCard className="client-card">
          <IonCardContent>
            <div className="card-header">
              <IonIcon icon={person} className="header-icon" />
              <h2>Información del Cliente</h2>
            </div>
            
            <div className="info-row">
              <span className="label">Nombre:</span>
              <span className="value">{serviceData.clientName}</span>
            </div>
            
            {serviceData.clientPhone && (
              <div className="info-row">
                <span className="label">Teléfono:</span>
                <span className="value">{serviceData.clientPhone}</span>
              </div>
            )}
          </IonCardContent>
        </IonCard>

        {/* Ubicación de Origen */}
        <IonCard className="location-card">
          <IonCardContent>
            <div className="card-header">
              <IonIcon icon={location} className="header-icon" />
              <h2>Ubicación del Cliente</h2>
            </div>
            
            <div className="info-row">
              <span className="label">Dirección:</span>
              <span className="value">{serviceData.origin?.address || 'N/A'}</span>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Detalles del Vehículo (si existe) */}
        {serviceData.vehicle && (
          <IonCard className="vehicle-card">
            <IonCardContent>
              <div className="card-header">
                <IonIcon icon={car} className="header-icon" />
                <h2>Vehículo a Desvarar</h2>
              </div>
              
              <div className="info-row">
                <span className="label">Vehículo:</span>
                <span className="value">
                  {serviceData.vehicle.brand} {serviceData.vehicle.model}
                </span>
              </div>
              
              {serviceData.vehicle.licensePlate && (
                <div className="info-row">
                  <span className="label">Placa:</span>
                  <span className="value">{serviceData.vehicle.licensePlate}</span>
                </div>
              )}
            </IonCardContent>
          </IonCard>
        )}

        {/* Código de Seguridad */}
        <IonCard className="security-card">
          <IonCardContent>
            <div className="card-header">
              <IonIcon icon={shield} className="header-icon" />
              <h2>Código de Seguridad</h2>
            </div>
            
            <div className="security-code-display">
              {serviceData.securityCode?.split('').map((digit, index) => (
                <div key={index} className="code-digit-large">
                  {digit}
                </div>
              ))}
            </div>
            
            <IonText color="medium">
              <p className="code-instruction">
                El cliente debe proporcionarte este código antes de iniciar el servicio
              </p>
            </IonText>
            
            <IonButton 
              expand="block" 
              fill="outline"
              onClick={handleVerifySecurityCode}
              className="verify-button"
            >
              <IonIcon icon={shield} slot="start" />
              Verificar Código
            </IonButton>
          </IonCardContent>
        </IonCard>

        {/* Monto del Servicio */}
        <IonCard className="amount-card">
          <IonCardContent>
            <div className="card-header">
              <IonIcon icon={cash} className="header-icon" />
              <h2>Monto Acordado</h2>
            </div>
            
            <div className="amount-display">
              {formatAmount(serviceData.amount)}
            </div>
          </IonCardContent>
        </IonCard>

        {/* Botones de Acción */}
        <div className="action-buttons-container">
          <IonButton 
            expand="block" 
            color="primary"
            onClick={handleCall}
            className="action-button"
          >
            <IonIcon icon={call} slot="start" />
            Llamar Cliente
          </IonButton>
          
          <IonButton 
            expand="block" 
            color="secondary"
            onClick={handleStartNavigation}
            className="action-button"
          >
            <IonIcon icon={navigate} slot="start" />
            Iniciar Navegación
          </IonButton>
          
          <IonButton 
            expand="block" 
            color="success"
            onClick={handleCompleteService}
            className="action-button complete-button"
          >
            <IonIcon icon={checkmarkCircle} slot="start" />
            Completar Servicio
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ActiveService;
