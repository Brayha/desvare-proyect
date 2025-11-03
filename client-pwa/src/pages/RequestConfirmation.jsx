import { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
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
  IonTextarea,
} from "@ionic/react";
import { locationOutline, navigateOutline, timeOutline, mapOutline, personOutline, callOutline, mailOutline } from "ionicons/icons";
import { useToast } from "@hooks/useToast";
import { requestAPI } from "../services/api";
import socketService from "../services/socket";
import "./RequestConfirmation.css";

const RequestConfirmation = () => {
  const history = useHistory();
  const { showSuccess, showError } = useToast();
  
  const [user, setUser] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Verificar autenticación
    const userData = localStorage.getItem('user');
    if (!userData) {
      showError("Debes iniciar sesión primero");
      history.push('/request-auth');
      return;
    }

    // Cargar datos de la ruta
    const storedRouteData = localStorage.getItem('requestData');
    if (!storedRouteData) {
      showError("No se encontraron datos de la ruta");
      history.push('/home');
      return;
    }

    setUser(JSON.parse(userData));
    setRouteData(JSON.parse(storedRouteData));
  }, [history, showError]);

  const handleSubmitRequest = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Crear solicitud en la base de datos con todos los datos
      const response = await requestAPI.createRequest({
        clientId: user.id,
        clientName: user.name,
        clientPhone: user.phone,
        clientEmail: user.email,
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
        notes: notes || undefined,
      });

      // Emitir evento de nueva solicitud vía Socket.IO
      socketService.sendNewRequest({
        requestId: response.data.requestId,
        clientId: user.id,
        clientName: user.name,
        origin: routeData.origin.address,
        destination: routeData.destination.address,
        distance: routeData.routeInfo.distanceText,
        duration: routeData.routeInfo.durationText,
      });

      showSuccess("¡Solicitud enviada! Los conductores recibirán tu solicitud.");

      // Limpiar datos de ruta del localStorage
      localStorage.removeItem('requestData');

      // Redirigir al Home para ver cotizaciones
      setTimeout(() => {
        history.push('/home');
      }, 1500);

    } catch (error) {
      console.error("Error al enviar solicitud:", error);
      showError(error.response?.data?.error || "Error al enviar solicitud");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || !routeData) {
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
          <IonTitle>Confirmar Solicitud</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="request-confirmation-page">
        {/* Información del usuario */}
        <IonCard className="user-info-card">
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={personOutline} />
              Tus datos
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="user-info-item">
              <IonIcon icon={personOutline} color="primary" />
              <IonText>
                <p>{user.name}</p>
              </IonText>
            </div>
            <div className="user-info-item">
              <IonIcon icon={callOutline} color="primary" />
              <IonText>
                <p>{user.phone}</p>
              </IonText>
            </div>
            <div className="user-info-item">
              <IonIcon icon={mailOutline} color="primary" />
              <IonText>
                <p>{user.email}</p>
              </IonText>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Resumen de la ruta */}
        <IonCard className="route-info-card">
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={mapOutline} />
              Ruta solicitada
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="route-info-item">
              <IonIcon icon={locationOutline} color="primary" />
              <div className="route-info-text">
                <IonText color="medium">
                  <small>Origen</small>
                </IonText>
                <IonText>
                  <p>{routeData.origin.address}</p>
                </IonText>
              </div>
            </div>

            <div className="route-divider" />

            <div className="route-info-item">
              <IonIcon icon={navigateOutline} color="danger" />
              <div className="route-info-text">
                <IonText color="medium">
                  <small>Destino</small>
                </IonText>
                <IonText>
                  <p>{routeData.destination.address}</p>
                </IonText>
              </div>
            </div>

            <div className="route-stats">
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

        {/* Notas adicionales */}
        <IonCard className="notes-card">
          <IonCardHeader>
            <IonCardTitle>Notas adicionales (opcional)</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem lines="none">
              <IonLabel position="stacked">
                Información adicional para el conductor
              </IonLabel>
              <IonTextarea
                value={notes}
                onIonInput={(e) => setNotes(e.detail.value)}
                placeholder="Ej: Mi vehículo es una moto Honda roja, placa ABC123"
                rows={4}
                maxlength={200}
              />
            </IonItem>
            <IonText color="medium">
              <small>{notes.length}/200 caracteres</small>
            </IonText>
          </IonCardContent>
        </IonCard>

        {/* Botón de confirmar */}
        <div className="confirmation-actions">
          <IonButton
            expand="block"
            size="large"
            onClick={handleSubmitRequest}
            disabled={isSubmitting}
            className="confirm-button"
          >
            {isSubmitting ? (
              <>
                <IonSpinner name="crescent" />
                <span style={{ marginLeft: "10px" }}>Enviando solicitud...</span>
              </>
            ) : (
              "Enviar Solicitud a Conductores"
            )}
          </IonButton>

          <IonButton
            expand="block"
            fill="clear"
            onClick={() => history.goBack()}
            disabled={isSubmitting}
          >
            Volver atrás
          </IonButton>
        </div>

        <IonText className="info-text">
          <p>
            Al enviar la solicitud, los conductores disponibles recibirán una
            notificación y podrán enviarte sus cotizaciones.
          </p>
        </IonText>
      </IonContent>
    </IonPage>
  );
};

export default RequestConfirmation;

