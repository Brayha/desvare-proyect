import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonText,
  IonSpinner,
  IonButtons,
  IonBackButton,
  IonBadge,
  useIonToast,
  useIonAlert,
} from '@ionic/react';
import { Location } from 'iconsax-react';
import RequestDetailMap from '../components/RequestDetailMap';
import socketService from '../services/socket'; // ✅ Importar socketService
import './RequestDetail.css'; // ✅ Reutilizar mismo CSS

// Importar iconos SVG de vehículos
import carIcon from '../../../shared/src/img/vehicles/car.svg';
import motoIcon from '../../../shared/src/img/vehicles/moto.svg';
import camionetaIcon from '../../../shared/src/img/vehicles/camioneta.svg';
import camionIcon from '../../../shared/src/img/vehicles/camion.svg';
import busIcon from '../../../shared/src/img/vehicles/bus.svg';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const ActiveService = () => {
  const history = useHistory();
  const [present] = useIonToast();
  const [presentAlert] = useIonAlert();
  
  const [serviceData, setServiceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [completing, setCompleting] = useState(false); // ✅ Estado para loading al completar
  
  // ✅ Estados para el mapa y conductor
  const [driverPhoto, setDriverPhoto] = useState(
    'https://ionicframework.com/docs/img/demos/avatar.svg'
  );
  const [driverAddress, setDriverAddress] = useState('Obteniendo ubicación...');
  const [driverLocation, setDriverLocation] = useState({ lat: 4.6097, lng: -74.0817 }); // Bogotá por defecto
  
  // ✅ Estado para controlar las 2 fases
  const [codeValidated, setCodeValidated] = useState(false);

  useEffect(() => {
    console.log('🚗 ActiveService - Inicializando...');
    
    // ✅ RESETEAR estado de validación para cada nuevo servicio
    setCodeValidated(false);
    console.log('🔄 Estado de validación reseteado - Nuevo servicio requiere código');
    
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
      console.log('📍 Estructura de origin:', parsedData.origin);
      console.log('📍 Estructura de destination:', parsedData.destination);
      
      // ✅ Si faltan datos del vehículo o teléfono, buscar del backend
      if (!parsedData.vehicle && !parsedData.vehicleSnapshot && parsedData.requestId) {
        console.log('⚠️ Faltan datos del vehículo - Buscando del backend...');
        loadCompleteRequestData(parsedData);
      } else {
        setServiceData(parsedData);
        setIsLoading(false);
      }
      
      // ⚡ Cargar datos del conductor en paralelo
      loadDriverPhoto();
      loadDriverAddress();
    } catch (error) {
      console.error('❌ Error al parsear servicio activo:', error);
      history.push('/home');
      return;
    }
  }, [history, present]);

  const loadDriverPhoto = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        const response = await fetch(
          `http://localhost:5001/api/drivers/profile/${parsedUser._id}`
        );
        const data = await response.json();

        if (response.ok && data.driver?.documents?.selfie) {
          setDriverPhoto(data.driver.documents.selfie);
          console.log('✅ Foto del conductor cargada');
        }
      }
    } catch (error) {
      console.error('❌ Error al cargar foto del conductor:', error);
    }
  };

  const loadDriverAddress = async () => {
    try {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            setDriverLocation({ lat, lng });
            console.log('✅ Ubicación GPS obtenida:', { lat, lng });
            
            if (!MAPBOX_TOKEN) {
              setDriverAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
              return;
            }

            try {
              const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=es`
              );
              const data = await response.json();

              if (data.features && data.features.length > 0) {
                const address = data.features[0].place_name;
                setDriverAddress(address);
                console.log('📍 Dirección del conductor:', address);
              } else {
                setDriverAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
              }
            } catch (geoError) {
              console.error('⚠️ Error obteniendo dirección:', geoError);
              setDriverAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            }
          },
          (error) => {
            console.error('❌ Error obteniendo ubicación GPS:', error);
            setDriverAddress('Bogotá, Colombia');
          },
          {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 300000
          }
        );
      }
    } catch (error) {
      console.error('❌ Error en loadDriverAddress:', error);
      setDriverAddress('Bogotá, Colombia');
    }
  };

  const loadCompleteRequestData = async (parsedData) => {
    try {
      console.log('🔄 Obteniendo datos completos del request del backend...');
      const response = await fetch(`http://localhost:5001/api/requests/${parsedData.requestId}`);
      const data = await response.json();
      
      if (response.ok && data.request) {
        console.log('✅ Datos completos del request obtenidos:', data.request);
        
        // Mezclar datos del localStorage con datos del backend
        const completeData = {
          ...parsedData, // Mantener requestId, amount, securityCode, etc.
          clientPhone: data.request.clientPhone || parsedData.clientPhone,
          vehicle: data.request.vehicleSnapshot?.vehicle || parsedData.vehicle,
          vehicleSnapshot: data.request.vehicleSnapshot || parsedData.vehicleSnapshot,
          problem: data.request.serviceDetails?.problem || parsedData.problem,
          serviceDetails: data.request.serviceDetails || parsedData.serviceDetails,
        };
        
        console.log('✅ Datos mezclados:', completeData);
        setServiceData(completeData);
        
        // Actualizar localStorage con datos completos
        localStorage.setItem('activeService', JSON.stringify(completeData));
      } else {
        console.warn('⚠️ No se pudieron obtener datos completos, usando datos básicos');
        setServiceData(parsedData);
      }
    } catch (error) {
      console.error('❌ Error al obtener datos completos del request:', error);
      // Usar datos básicos del localStorage si falla
      setServiceData(parsedData);
    } finally {
      setIsLoading(false);
    }
  };

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
    // FASE 1: Navegar al origen (recogida)
    // FASE 2: Navegar al destino
    const targetLocation = codeValidated 
      ? serviceData?.destination?.coordinates 
      : serviceData?.origin?.coordinates;
    
    if (targetLocation) {
      const [lng, lat] = targetLocation;
      const destination = codeValidated ? 'destino' : 'punto de recogida';
      
      // Abrir Google Maps con navegación
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(mapsUrl, '_blank');
      
      present({
        message: `🧭 Navegando al ${destination}...`,
        duration: 2000,
        color: 'success',
      });
    }
  };

  const getVehicleIcon = (iconEmoji) => {
    const iconMap = {
      '🏍️': motoIcon,
      '🚗': carIcon,
      '🚙': camionetaIcon,
      '🚚': camionIcon,
      '🚌': busIcon,
    };
    return iconMap[iconEmoji] || carIcon;
  };

  const handleVerifySecurityCode = () => {
    presentAlert({
      header: '🔒 Validar Código de Seguridad',
      message: 'Solicita al cliente el código de 4 dígitos para ver el destino',
      inputs: [
        {
          name: 'code',
          type: 'tel',
          placeholder: '••••',
          maxlength: 4,
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
            const inputCode = data.code?.toString();
            const correctCode = serviceData.securityCode?.toString();
            
            if (inputCode === correctCode) {
              setCodeValidated(true);
              present({
                message: '✅ Código correcto. Ahora puedes ver el destino.',
                duration: 2500,
                color: 'success',
              });
              console.log('✅ Código validado - Mostrando destino');
            } else {
              present({
                message: '❌ Código incorrecto. Intenta de nuevo.',
                duration: 2000,
                color: 'danger',
              });
              console.log('❌ Código incorrecto');
              return false; // Mantener el alert abierto
            }
          },
        },
      ],
    });
  };

  const handleCompleteService = () => {
    presentAlert({
      header: '✅ Completar Servicio',
      message: '¿Confirmas que llegaste al destino y completaste el servicio exitosamente?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Confirmar',
          handler: async () => {
            setCompleting(true);
            
            try {
              const user = JSON.parse(localStorage.getItem('user'));
              const completedAt = new Date();
              
              console.log('📡 Completando servicio:', {
                requestId: serviceData.requestId,
                driverId: user._id
              });
              
              // 1. Actualizar en el backend
              const response = await fetch(`http://localhost:5001/api/requests/${serviceData.requestId}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  driverId: user._id,
                  completedAt: completedAt,
                })
              });
              
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al completar servicio');
              }
              
              const data = await response.json();
              console.log('✅ Backend confirmó completado:', data);
              
              // 2. Notificar por Socket.IO al cliente
              socketService.completeService({
                requestId: serviceData.requestId,
                clientId: data.request.clientId,
                driverId: user._id,
                driverName: user.name,
                completedAt: completedAt
              });
              
              // 3. Limpiar localStorage
              localStorage.removeItem('activeService');
              console.log('🗑️ activeService removido del localStorage');
              
              // 4. Cambiar estado a DISPONIBLE
              const updatedUser = { ...user };
              updatedUser.driverProfile.isOnline = true;
              localStorage.setItem('user', JSON.stringify(updatedUser));
              console.log('🟢 Estado cambiado a DISPONIBLE');
              
              present({
                message: '🎉 ¡Servicio completado! Ahora estás disponible para nuevos servicios.',
                duration: 3000,
                color: 'success',
              });
              
              // 5. Volver al Home (disponible para nuevos servicios)
              setTimeout(() => {
                history.replace('/home');
              }, 500);
              
            } catch (error) {
              console.error('❌ Error al completar servicio:', error);
              present({
                message: error.message || 'Error al completar servicio. Intenta de nuevo.',
                duration: 3000,
                color: 'danger'
              });
            } finally {
              setCompleting(false);
            }
            
            return true; // Cerrar el alert
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

  if (isLoading || !serviceData) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/home" text="Atrás" />
            </IonButtons>
            <IonTitle>🚗 Servicio Activo</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding ion-text-center">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: '15px',
            }}
          >
            <IonSpinner name="crescent" />
            <IonText color="medium">
              <p>Cargando servicio activo...</p>
            </IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // Validar que existan coordenadas (formato flexible)
  const hasValidOrigin = serviceData.origin && (
    (serviceData.origin.coordinates && serviceData.origin.coordinates.length === 2) ||
    (serviceData.origin.lat && serviceData.origin.lng)
  );

  if (!hasValidOrigin) {
    console.error('❌ Coordenadas inválidas:', {
      origin: serviceData.origin,
      destination: serviceData.destination
    });
    
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/home" text="Atrás" />
            </IonButtons>
            <IonTitle>🚗 Servicio Activo</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonText color="danger">
            <h3>Error: No se encontraron coordenadas del servicio</h3>
            <p>Estructura del origen: {JSON.stringify(serviceData.origin)}</p>
            <p>Por favor, intenta aceptar el servicio nuevamente.</p>
          </IonText>
          <button 
            className="send-quote-button" 
            onClick={() => history.push('/home')}
            style={{ margin: '20px' }}
          >
            Volver al Inicio
          </button>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" text="Atrás" />
          </IonButtons>
          <IonTitle>
            {codeValidated ? '🎯 En Camino al Destino' : '🚗 Servicio Activo'}
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <div className="request-detail-page">
        {/* Mapa */}
        <div className="map-section">
          <RequestDetailMap
            request={{
              origin: serviceData.origin,
              destination: codeValidated && serviceData.destination ? serviceData.destination : null,
              vehicle: serviceData.vehicle || serviceData.vehicleSnapshot?.vehicle,
              problem: serviceData.problem || serviceData.serviceDetails?.problem,
            }}
            driverLocation={driverLocation}
            driverPhoto={driverPhoto}
            showDestination={codeValidated}
          />
        </div>

        {/* Contenido de detalles */}
        <div className="detail-content">
          <div className="request-detail-content">
            {/* Badge de Estado */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '5px' }}>
              {codeValidated ? (
                <IonBadge color="success" style={{ fontSize: '14px', padding: '8px 12px' }}>
                  ✅ Código Validado
                </IonBadge>
              ) : (
                <IonBadge color="warning" style={{ fontSize: '14px', padding: '8px 12px' }}>
                  🔒 Pendiente Validación
                </IonBadge>
              )}
            </div>

            {/* Monto Acordado Destacado */}
            <div style={{
              width: '100%',
              background: 'linear-gradient(135deg, #10dc60 0%, #24d6a3 100%)',
              padding: '20px',
              borderRadius: '15px',
              textAlign: 'center',
              marginBottom: '10px',
              boxShadow: '0 4px 10px rgba(16, 220, 96, 0.3)'
            }}>
              <IonText style={{ color: 'white', fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '5px' }}>
                💰 Monto Acordado
              </IonText>
              <IonText style={{ color: 'white', fontSize: '36px', fontWeight: 'bold', display: 'block' }}>
                {formatAmount(serviceData.amount)}
              </IonText>
            </div>

            {/* Información del conductor (Tu ubicación) */}
            <div className="user-location-card">
              <div className="user-avatar">
                <img
                  src={driverPhoto}
                  alt="Conductor"
                  onError={(e) => {
                    e.target.src = 'https://ionicframework.com/docs/img/demos/avatar.svg';
                  }}
                />
              </div>
              <div className="user-info">
                <IonText className="user-name">
                  <h3>Tu</h3>
                </IonText>
                <IonText color="medium" className="user-address">
                  <p>{driverAddress}</p>
                </IonText>
              </div>
            </div>

            {/* Cliente */}
            <div className="location-section">
              <div className="location-icon">
                <Location size="24" variant="Bold" color="#3880ff" />
              </div>
              <div className="location-text">
                <IonText color="medium" className="location-label">
                  Cliente
                </IonText>
                <IonText className="location-address">
                  {serviceData.clientName}
                </IonText>
                {serviceData.clientPhone && (
                  <IonText color="medium" style={{ fontSize: '13px', display: 'block', marginTop: '2px' }}>
                    📞 {serviceData.clientPhone}
                  </IonText>
                )}
              </div>
            </div>

            {/* FASE 1: Punto de Recogida (Origen) */}
            {!codeValidated && (
              <div className="location-section">
                <div className="location-icon">
                  <Location size="24" variant="Bold" color="#3880ff" />
                </div>
                <div className="location-text">
                  <IonText color="medium" className="location-label">
                    Punto de Recogida
                  </IonText>
                  <IonText className="location-address">
                    {serviceData.origin.address}
                  </IonText>
                </div>
              </div>
            )}

            {/* FASE 2: Destino Final (solo después de validar código) */}
            {codeValidated && serviceData.destination && (
              <div className="location-section">
                <div className="location-icon-destination">
                  <Location size="24" variant="Bold" color="#eb445a" />
                </div>
                <div className="location-text">
                  <IonText color="medium" className="location-label">
                    🔴 Destino Final
                  </IonText>
                  <IonText className="location-address">
                    {serviceData.destination.address}
                  </IonText>
                </div>
              </div>
            )}

            {/* Vehículo */}
            {serviceData.vehicle && (
              <div className="vehicle-problem-card">
                <div className="vehicle-info">
                  <div className="vehicle-icon">
                    <img
                      src={getVehicleIcon(serviceData.vehicle.icon)}
                      alt={serviceData.vehicle.category || 'Vehículo'}
                      className="vehicle-svg-icon"
                    />
                  </div>
                  <div className="vehicle-details">
                    <IonText className="vehicle-brand">
                      <h3>{serviceData.vehicle.brand || 'N/A'}</h3>
                    </IonText>
                    <IonText color="medium" className="vehicle-model">
                      <p>{serviceData.vehicle.model || 'N/A'}</p>
                    </IonText>
                    {serviceData.vehicle.licensePlate && (
                      <IonText color="medium" className="vehicle-plate">
                        <p>Placa: {serviceData.vehicle.licensePlate}</p>
                      </IonText>
                    )}
                  </div>
                </div>

                {serviceData.problem && (
                  <div className="problem-section">
                    <IonText color="medium" className="section-label">
                      Problema reportado
                    </IonText>
                    <IonText className="problem-text">
                      {serviceData.problem}
                    </IonText>
                  </div>
                )}
              </div>
            )}

            {/* FASE 1: Código de Seguridad Pendiente */}
            {!codeValidated && (
              <div style={{
                width: '100%',
                background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
                padding: '25px',
                borderRadius: '15px',
                textAlign: 'center',
                boxShadow: '0 4px 10px rgba(243, 156, 18, 0.3)'
              }}>
                <IonText style={{ color: 'white', fontSize: '16px', fontWeight: '700', display: 'block', marginBottom: '10px' }}>
                  🔒 Código de Seguridad Requerido
                </IonText>
                <IonText style={{ color: 'white', fontSize: '14px', display: 'block', marginBottom: '15px', opacity: 0.9 }}>
                  Solicita al cliente el código de 4 dígitos en el punto de recogida para ver el destino
                </IonText>
                <button 
                  className="send-quote-button" 
                  style={{ background: 'white', color: '#f39c12', marginBottom: 0 }}
                  onClick={handleVerifySecurityCode}
                >
                  🔐 Validar Código
                </button>
              </div>
            )}

            {/* FASE 2: Confirmación de Código Validado */}
            {codeValidated && (
              <div style={{
                width: '100%',
                background: 'linear-gradient(135deg, #10dc60 0%, #24d6a3 100%)',
                padding: '15px',
                borderRadius: '15px',
                textAlign: 'center',
                boxShadow: '0 4px 10px rgba(16, 220, 96, 0.3)'
              }}>
                <IonText style={{ color: 'white', fontSize: '15px', fontWeight: '600' }}>
                  ✅ Código Verificado - Servicio en Progreso
                </IonText>
              </div>
            )}

            {/* Botones de Acción */}
            <button
              className="send-quote-button"
              onClick={handleCall}
              style={{ background: '#3880ff', marginTop: '10px' }}
            >
              📞 Llamar Cliente
            </button>

            <button
              className="send-quote-button"
              onClick={handleStartNavigation}
              style={{ background: '#5260ff' }}
            >
              {codeValidated ? '🧭 Navegar al Destino' : '🧭 Navegar a Recogida'}
            </button>

            {codeValidated && (
              <button
                className="send-quote-button"
                onClick={handleCompleteService}
                disabled={completing}
                style={{ background: '#10dc60' }}
              >
                {completing ? '⏳ Completando...' : '✅ Completar Servicio'}
              </button>
            )}
          </div>
        </div>
      </div>
    </IonPage>
  );
};

export default ActiveService;
