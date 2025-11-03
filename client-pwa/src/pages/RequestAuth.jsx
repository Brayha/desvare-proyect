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
import { arrowBack, locationOutline, navigateOutline, timeOutline, mapOutline } from "ionicons/icons";
import { useToast } from "@hooks/useToast";
import { authAPI } from "../services/api";
import socketService from "../services/socket";
import "./RequestAuth.css";

const RequestAuth = () => {
  const history = useHistory();
  const { showSuccess, showError } = useToast();
  
  // Datos de la ruta (desde localStorage)
  const [routeData, setRouteData] = useState(null);
  
  // Estado de autenticación
  const [authMode, setAuthMode] = useState("login"); // "login" o "register"
  const [isLoading, setIsLoading] = useState(false);
  
  // Formulario de login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Formulario de registro
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  useEffect(() => {
    // Verificar si ya está autenticado
    const userData = localStorage.getItem('user');
    if (userData) {
      // Ya está autenticado, ir directo a confirmar solicitud
      history.push('/request-confirmation');
      return;
    }

    // Cargar datos de la ruta
    const storedRouteData = localStorage.getItem('requestData');
    if (!storedRouteData) {
      // No hay datos de ruta, redirigir al inicio
      showError("No se encontraron datos de la ruta");
      history.push('/home');
      return;
    }

    setRouteData(JSON.parse(storedRouteData));
  }, [history, showError]);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!loginEmail || !loginPassword) {
      showError("Por favor completa todos los campos");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authAPI.login({
        email: loginEmail,
        password: loginPassword,
      });

      // Guardar datos del usuario
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('token', response.data.token);

      showSuccess(`¡Bienvenido de nuevo, ${response.data.user.name}!`);

      // Conectar Socket.IO
      socketService.connect();
      socketService.registerClient(response.data.user.id);

      // Redirigir a confirmación de solicitud
      setTimeout(() => {
        history.push('/request-confirmation');
      }, 500);

    } catch (error) {
      showError(error.response?.data?.error || "Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!registerName || !registerEmail || !registerPhone || !registerPassword) {
      showError("Por favor completa todos los campos");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authAPI.register({
        name: registerName,
        email: registerEmail,
        phone: registerPhone,
        password: registerPassword,
        role: 'client',
      });

      // Guardar datos del usuario
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('token', response.data.token);

      showSuccess(`¡Bienvenido, ${response.data.user.name}!`);

      // Conectar Socket.IO
      socketService.connect();
      socketService.registerClient(response.data.user.id);

      // Redirigir a confirmación de solicitud
      setTimeout(() => {
        history.push('/request-confirmation');
      }, 500);

    } catch (error) {
      showError(error.response?.data?.error || "Error al registrarse");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    history.goBack();
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
            <IonButton onClick={handleBack}>
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle>Confirmar Solicitud</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="request-auth-page">
        {/* Resumen de la ruta */}
        <IonCard className="route-summary-card">
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={mapOutline} />
              Resumen de tu ruta
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="route-summary-item">
              <IonIcon icon={locationOutline} color="primary" />
              <div className="route-summary-text">
                <IonText color="medium">
                  <small>Origen</small>
                </IonText>
                <IonText>
                  <p>{routeData.origin.address}</p>
                </IonText>
              </div>
            </div>

            <div className="route-summary-divider" />

            <div className="route-summary-item">
              <IonIcon icon={navigateOutline} color="danger" />
              <div className="route-summary-text">
                <IonText color="medium">
                  <small>Destino</small>
                </IonText>
                <IonText>
                  <p>{routeData.destination.address}</p>
                </IonText>
              </div>
            </div>

            <div className="route-summary-stats">
              <div className="stat-item">
                <IonIcon icon={mapOutline} color="medium" />
                <IonText>
                  <small>{routeData.routeInfo.distanceText}</small>
                </IonText>
              </div>
              <div className="stat-item">
                <IonIcon icon={timeOutline} color="medium" />
                <IonText>
                  <small>{routeData.routeInfo.durationText}</small>
                </IonText>
              </div>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Segmento Login/Register */}
        <div className="auth-segment-container">
          <IonSegment value={authMode} onIonChange={(e) => setAuthMode(e.detail.value)}>
            <IonSegmentButton value="login">
              <IonLabel>Iniciar Sesión</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="register">
              <IonLabel>Registrarse</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </div>

        {/* Formulario de Login */}
        {authMode === "login" && (
          <form onSubmit={handleLogin} className="auth-form">
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Inicia sesión</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonItem>
                  <IonLabel position="floating">Email</IonLabel>
                  <IonInput
                    type="email"
                    value={loginEmail}
                    onIonInput={(e) => setLoginEmail(e.detail.value)}
                    required
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="floating">Contraseña</IonLabel>
                  <IonInput
                    type="password"
                    value={loginPassword}
                    onIonInput={(e) => setLoginPassword(e.detail.value)}
                    required
                  />
                </IonItem>

                <IonButton
                  expand="block"
                  type="submit"
                  disabled={isLoading}
                  className="submit-button"
                >
                  {isLoading ? (
                    <>
                      <IonSpinner name="crescent" />
                      <span style={{ marginLeft: "10px" }}>Iniciando sesión...</span>
                    </>
                  ) : (
                    "Iniciar Sesión"
                  )}
                </IonButton>
              </IonCardContent>
            </IonCard>
          </form>
        )}

        {/* Formulario de Registro */}
        {authMode === "register" && (
          <form onSubmit={handleRegister} className="auth-form">
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Crea tu cuenta</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonItem>
                  <IonLabel position="floating">Nombre completo</IonLabel>
                  <IonInput
                    type="text"
                    value={registerName}
                    onIonInput={(e) => setRegisterName(e.detail.value)}
                    required
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="floating">Email</IonLabel>
                  <IonInput
                    type="email"
                    value={registerEmail}
                    onIonInput={(e) => setRegisterEmail(e.detail.value)}
                    required
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="floating">Teléfono</IonLabel>
                  <IonInput
                    type="tel"
                    value={registerPhone}
                    onIonInput={(e) => setRegisterPhone(e.detail.value)}
                    placeholder="+57 300 123 4567"
                    required
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="floating">Contraseña</IonLabel>
                  <IonInput
                    type="password"
                    value={registerPassword}
                    onIonInput={(e) => setRegisterPassword(e.detail.value)}
                    required
                  />
                </IonItem>

                <IonButton
                  expand="block"
                  type="submit"
                  disabled={isLoading}
                  className="submit-button"
                >
                  {isLoading ? (
                    <>
                      <IonSpinner name="crescent" />
                      <span style={{ marginLeft: "10px" }}>Registrando...</span>
                    </>
                  ) : (
                    "Registrarse"
                  )}
                </IonButton>
              </IonCardContent>
            </IonCard>
          </form>
        )}

        <IonText className="privacy-text">
          <p>
            Al continuar, aceptas que tus datos se usen para conectar con conductores
            disponibles. No compartimos tu información con terceros.
          </p>
        </IonText>
      </IonContent>
    </IonPage>
  );
};

export default RequestAuth;

