import { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonText,
  IonSpinner,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonInput,
  IonSegment,
  IonSegmentButton,
} from "@ionic/react";
import { arrowBack, locationOutline, navigateOutline, timeOutline, mapOutline, carOutline } from "ionicons/icons";
import { useToast } from "@hooks/useToast";
import { authAPI, requestAPI } from "../services/api";
import socketService from "../services/socket";
import { PhoneInput, OTPInput } from "../../../shared/components";
import "./RequestAuth.css";

const RequestAuth = () => {
  const history = useHistory();
  const { showSuccess, showError } = useToast();
  
  // Datos de la ruta y vehículo (desde localStorage)
  const [routeData, setRouteData] = useState(null);
  const [vehicleData, setVehicleData] = useState(null);
  
  // Estado de autenticación OTP (2 pasos)
  const [authMode, setAuthMode] = useState("login"); // "login" o "register"
  const [step, setStep] = useState(1); // 1: formulario, 2: OTP
  const [userId, setUserId] = useState(null); // ID del usuario para verificar OTP
  const [isLoading, setIsLoading] = useState(false);
  
  // Formulario de login (solo teléfono)
  const [loginPhone, setLoginPhone] = useState("");
  
  // Formulario de registro (nombre, teléfono, email opcional)
  const [registerName, setRegisterName] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  
  // OTP
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  useEffect(() => {
    console.log('🔍 RequestAuth - Verificando estado de autenticación...');
    
    // Verificar si ya está autenticado
    const userData = localStorage.getItem('user');
    if (userData) {
      console.log('✅ Usuario ya autenticado, redirigiendo...');
      history.replace('/waiting-quotes');
      return;
    }

    // Cargar datos de la ruta (usar 'requestData' que es lo que guarda RequestService)
    const storedRouteData = localStorage.getItem('requestData');
    if (!storedRouteData) {
      console.log('❌ No hay datos de ruta, volviendo a RequestService');
      showError('Selecciona primero tu destino');
      history.replace('/request-service');
      return;
    }

    try {
      const parsedRouteData = JSON.parse(storedRouteData);
      console.log('📋 Datos de ruta cargados:', parsedRouteData);
      setRouteData(parsedRouteData);
    } catch (error) {
      console.error('❌ Error al parsear requestData:', error);
      showError('Error al cargar datos de la ruta');
      history.replace('/request-service');
    }

    // Cargar datos del vehículo (si existen)
    const storedVehicleData = localStorage.getItem('vehicleData');
    if (storedVehicleData) {
      try {
        const parsedVehicleData = JSON.parse(storedVehicleData);
        console.log('🚗 Datos de vehículo cargados:', parsedVehicleData);
        setVehicleData(parsedVehicleData);
      } catch (error) {
        console.error('⚠️ Error al parsear vehicleData:', error);
        // No bloqueamos el flujo si falla la carga de vehículo
      }
    } else {
      console.log('⚠️ No hay datos de vehículo en localStorage');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ Sin dependencias para ejecutar solo una vez al montar y evitar loops

  // PASO 1: Login (solo teléfono)
  const handleLoginSubmit = async () => {
    console.log('📱 Iniciando login con teléfono:', loginPhone);
    
    if (!loginPhone || loginPhone.length !== 10) {
      showError('Ingresa un número de teléfono válido');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.loginOTP({ phone: loginPhone });
      console.log('✅ Login OTP - Respuesta:', response.data);
      
      setUserId(response.data.userId);
      setStep(2); // Ir a paso de OTP
      showSuccess('Te enviamos un código de verificación');
      
    } catch (error) {
      console.error('❌ Error en login OTP:', error);
      const errorMsg = error.response?.data?.error || 'Error al iniciar sesión';
      showError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // PASO 1: Registro (nombre, teléfono, email opcional)
  const handleRegisterSubmit = async () => {
    console.log('📱 Iniciando registro:', { registerName, registerPhone, registerEmail });
    
    if (!registerName || !registerPhone || registerPhone.length !== 10) {
      showError('Nombre y teléfono válido son requeridos');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.registerOTP({
        name: registerName,
        phone: registerPhone,
        email: registerEmail || undefined,
      });
      console.log('✅ Registro OTP - Respuesta:', response.data);
      
      setUserId(response.data.userId);
      setStep(2); // Ir a paso de OTP
      showSuccess('Te enviamos un código de verificación');
      
    } catch (error) {
      console.error('❌ Error en registro OTP:', error);
      const errorMsg = error.response?.data?.error || 'Error al registrarte';
      
      // Si el teléfono ya existe, sugerir usar login
      if (errorMsg.includes('ya está registrado')) {
        showError('Este número ya está registrado. Usa "Iniciar Sesión" en su lugar.');
      } else {
        showError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // PASO 2: Verificar OTP y enviar solicitud
  const handleVerifyOTP = async () => {
    console.log('🔐 Verificando OTP:', otp);
    console.log('🆔 UserId guardado:', userId);
    
    if (otp.length !== 4) {
      setOtpError('Ingresa el código de 4 dígitos');
      return;
    }

    if (!userId) {
      setOtpError('Error: No se encontró el ID de usuario. Intenta de nuevo.');
      setStep(1);
      return;
    }

    setIsLoading(true);
    setOtpError("");
    
    try {
      // 1. Verificar OTP
      console.log('📤 Enviando a verify-otp:', { userId, otp });
      const response = await authAPI.verifyOTP({
        userId: userId,
        otp: otp,
      });
      console.log('✅ OTP verificado - Respuesta:', response.data);
      
      const { token, user } = response.data;
      
      // 2. Guardar token y usuario
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      console.log('💾 Token y usuario guardados');
      
      // 3. Enviar solicitud a conductores
      console.log('🚀 Enviando solicitud a conductores...');
      await sendRequestToDrivers(user);
      
      // 4. Redirigir a WaitingQuotes
      console.log('🔄 Redirigiendo a /waiting-quotes...');
      await new Promise(resolve => setTimeout(resolve, 100)); // Delay para sincronizar localStorage
      history.replace('/waiting-quotes');
      
    } catch (error) {
      console.error('❌ Error al verificar OTP:', error);
      const errorMsg = error.response?.data?.error || 'Código inválido o expirado';
      setOtpError(errorMsg);
      setOtp(""); // Limpiar OTP
    } finally {
      setIsLoading(false);
    }
  };

  // Función para enviar solicitud a conductores (después de autenticar)
  const sendRequestToDrivers = async (user) => {
    try {
      console.log('📡 sendRequestToDrivers - Iniciando...');
      console.log('👤 Usuario:', user);
      console.log('🗺️ RouteData:', routeData);

      // 1. Verificar Socket.IO
      if (!socketService.isConnected()) {
        console.log('⚠️ Socket.IO no conectado, esperando...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // 2. Registrar cliente en Socket.IO
      console.log('👤 Registrando cliente en Socket.IO...');
      socketService.registerClient(user.id);

      // 3. Crear solicitud en BD
      console.log('📝 Creando solicitud en BD...');
      const requestData = {
        clientId: user.id,
        clientName: user.name,
        clientPhone: user.phone || 'N/A',
        clientEmail: user.email || 'N/A',
        origin: {
          coordinates: [routeData.origin.lng, routeData.origin.lat],
          address: routeData.origin.address,
        },
        destination: {
          coordinates: [routeData.destination.lng, routeData.destination.lat],
          address: routeData.destination.address,
        },
        distance: routeData.routeInfo.distance,
        duration: routeData.routeInfo.duration,
      };

      // 3.1. Agregar datos del vehículo si existen
      if (vehicleData) {
        console.log('🚗 Incluyendo datos del vehículo en la solicitud...');
        requestData.vehicleId = vehicleData.vehicleId || null;
        requestData.vehicleSnapshot = vehicleData.vehicleSnapshot;
        requestData.serviceDetails = vehicleData.serviceDetails;
      }
      
      console.log('📦 Request payload:', JSON.stringify(requestData, null, 2));
      
      const response = await requestAPI.createRequest(requestData);
      const requestId = response.data.requestId;
      console.log('✅ Solicitud creada en BD con ID:', requestId);

      // 4. Guardar requestId (usar 'currentRequestId' para consistencia)
      localStorage.setItem('currentRequestId', requestId);
      console.log('💾 RequestId guardado en localStorage:', requestId);

      // 5. Emitir evento Socket.IO a conductores
      console.log('📡 Emitiendo request:new via Socket.IO...');
      const socketData = {
        requestId: requestId,
        clientId: user.id,
        clientName: user.name,
        origin: {
          address: routeData.origin.address,
          lat: routeData.origin.lat,
          lng: routeData.origin.lng
        },
        destination: {
          address: routeData.destination.address,
          lat: routeData.destination.lat,
          lng: routeData.destination.lng
        },
        distance: routeData.routeInfo.distance,
        duration: routeData.routeInfo.duration,
      };

      // 5.1. Agregar datos del vehículo al Socket.IO si existen
      if (vehicleData) {
        console.log('🚗 Incluyendo datos del vehículo en Socket.IO...');
        socketData.vehicleSnapshot = vehicleData.vehicleSnapshot;
        socketData.serviceDetails = vehicleData.serviceDetails;
      }

      socketService.sendNewRequest(socketData);

      console.log('✅ sendRequestToDrivers completado exitosamente');
      
    } catch (error) {
      console.error('❌ Error en sendRequestToDrivers:', error);
      throw error;
    }
  };

  const handleBack = () => {
    if (step === 2) {
      // Volver al paso 1
      setStep(1);
      setOtp("");
      setOtpError("");
    } else {
      // Volver a RequestService
      history.goBack();
    }
  };

  if (!routeData) {
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

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={handleBack} disabled={isLoading}>
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle>{step === 1 ? 'Autenticación' : 'Verificación'}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding request-auth-content">
        {/* Resumen de la solicitud */}
        <IonCard className="route-summary-card">
          <IonCardHeader>
            <IonCardTitle>Resumen del Servicio</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="route-detail">
              <IonIcon icon={locationOutline} className="detail-icon" />
              <div className="detail-content">
                <IonLabel className="detail-label">Origen</IonLabel>
                <IonText className="detail-text">{routeData.origin.address}</IonText>
              </div>
            </div>

            <div className="route-detail">
              <IonIcon icon={navigateOutline} className="detail-icon" />
              <div className="detail-content">
                <IonLabel className="detail-label">Destino</IonLabel>
                <IonText className="detail-text">{routeData.destination.address}</IonText>
              </div>
            </div>

            <div className="route-metrics">
              <div className="metric">
                <IonIcon icon={mapOutline} />
                <IonText>{routeData.routeInfo.distanceText}</IonText>
              </div>
              <div className="metric">
                <IonIcon icon={timeOutline} />
                <IonText>{routeData.routeInfo.durationText}</IonText>
              </div>
            </div>

            {/* Información del vehículo */}
            {vehicleData && vehicleData.vehicleSnapshot && (
              <>
                <div className="divider"></div>
                <div className="route-detail">
                  <IonIcon icon={carOutline} className="detail-icon" />
                  <div className="detail-content">
                    <IonLabel className="detail-label">Vehículo</IonLabel>
                    <IonText className="detail-text">
                      {vehicleData.vehicleSnapshot.brand.name} {vehicleData.vehicleSnapshot.model.name}
                    </IonText>
                    <IonText className="detail-subtext">
                      {vehicleData.vehicleSnapshot.category.name} • {vehicleData.vehicleSnapshot.licensePlate}
                    </IonText>
                  </div>
                </div>
                
                {/* Problema del vehículo */}
                {vehicleData.serviceDetails && vehicleData.serviceDetails.problem && (
                  <div className="route-detail">
                    <div className="detail-content" style={{ marginLeft: '36px' }}>
                      <IonLabel className="detail-label">Problema</IonLabel>
                      <IonText className="detail-text">{vehicleData.serviceDetails.problem}</IonText>
                    </div>
                  </div>
                )}
              </>
            )}
          </IonCardContent>
        </IonCard>

        {/* PASO 1: Formulario de Login o Registro */}
        {step === 1 && (
          <>
            <IonSegment 
              value={authMode} 
              onIonChange={(e) => setAuthMode(e.detail.value)}
              className="auth-segment"
            >
              <IonSegmentButton value="login">
                <IonLabel>Iniciar Sesión</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="register">
                <IonLabel>Registrarse</IonLabel>
              </IonSegmentButton>
            </IonSegment>

            {authMode === "login" ? (
              <div className="auth-form">
                <IonText color="medium" className="auth-subtitle">
                  Ingresa tu número de teléfono
                </IonText>
                
                <PhoneInput
                  value={loginPhone}
                  onChange={setLoginPhone}
                />

                <IonButton
                  expand="block"
                  onClick={handleLoginSubmit}
                  disabled={isLoading || loginPhone.length !== 10}
                  className="auth-button"
                >
                  {isLoading ? <IonSpinner /> : 'Continuar'}
                </IonButton>
              </div>
            ) : (
              <div className="auth-form">
                <IonText color="medium" className="auth-subtitle">
                  Crea tu cuenta para cotizar
                </IonText>

                <IonItem lines="none" className="custom-input-item">
                  <IonLabel position="stacked">Nombre completo</IonLabel>
                  <IonInput
                    type="text"
                    placeholder="Juan Pérez"
                    value={registerName}
                    onIonInput={(e) => setRegisterName(e.detail.value)}
                  />
                </IonItem>

                <PhoneInput
                  value={registerPhone}
                  onChange={setRegisterPhone}
                />

                <IonItem lines="none" className="custom-input-item">
                  <IonLabel position="stacked">Email (opcional)</IonLabel>
                  <IonInput
                    type="email"
                    placeholder="juan@ejemplo.com"
                    value={registerEmail}
                    onIonInput={(e) => setRegisterEmail(e.detail.value)}
                  />
                </IonItem>

                <IonButton
                  expand="block"
                  onClick={handleRegisterSubmit}
                  disabled={isLoading || !registerName || registerPhone.length !== 10}
                  className="auth-button"
                >
                  {isLoading ? <IonSpinner /> : 'Crear Cuenta'}
                </IonButton>
              </div>
            )}
          </>
        )}

        {/* PASO 2: Verificación OTP */}
        {step === 2 && (
          <div className="otp-form">
            <IonText color="medium" className="otp-subtitle">
              Ingresa el código de 4 dígitos
            </IonText>
            <IonText color="medium" className="otp-hint">
              (Para pruebas usa: 0000)
            </IonText>

            <OTPInput
              value={otp}
              onChange={(value) => {
                setOtp(value);
                setOtpError("");
              }}
              error={otpError}
            />

            <IonButton
              expand="block"
              onClick={handleVerifyOTP}
              disabled={isLoading || otp.length !== 4}
              className="auth-button"
            >
              {isLoading ? <IonSpinner /> : 'Verificar y Buscar Cotizaciones'}
            </IonButton>

            <IonButton
              expand="block"
              fill="clear"
              onClick={() => {
                setStep(1);
                setOtp("");
                setOtpError("");
              }}
              disabled={isLoading}
            >
              Cambiar número
            </IonButton>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default RequestAuth;
