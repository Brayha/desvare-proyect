import { useState } from "react";
import { useHistory } from "react-router-dom";
import {
  IonPage,
  IonContent,
  IonButton,
  IonText,
  IonSpinner,
  IonIcon,
} from "@ionic/react";
import { locationOutline, checkmarkCircleOutline } from "ionicons/icons";
import { useGeolocation } from "../hooks/useGeolocation";
import { useToast } from "@hooks/useToast";
import "./LocationPermission.css";

const LocationPermission = () => {
  const history = useHistory();
  const { showError } = useToast();
  const { requestLocation, loading } = useGeolocation();
  const [permissionGranted, setPermissionGranted] = useState(false);

  const handleRequestPermission = async () => {
    try {
      await requestLocation();
      setPermissionGranted(true);
      
      // Esperar 1 segundo para mostrar el éxito y luego navegar
      setTimeout(() => {
        history.push("/request-service");
      }, 1000);
    } catch (error) {
      showError("No pudimos obtener tu ubicación. Por favor, activa los permisos en tu navegador.");
    }
  };

  return (
    <IonPage>
      <IonContent className="location-permission-page">
        <div className="permission-container">
          {!permissionGranted ? (
            <>
              {/* Icono principal */}
              <div className="icon-container">
                <IonIcon icon={locationOutline} className="location-icon" />
              </div>

              {/* Título */}
              <IonText>
                <h1 className="permission-title">
                  Necesitamos tu ubicación
                </h1>
              </IonText>

              {/* Descripción */}
              <IonText color="medium">
                <p className="permission-description">
                  Para brindarte el mejor servicio, necesitamos conocer tu ubicación
                  y calcular la ruta hacia tu destino.
                </p>
              </IonText>

              {/* Beneficios */}
              <div className="benefits-list">
                <div className="benefit-item">
                  <IonIcon icon={checkmarkCircleOutline} color="success" />
                  <IonText>
                    <p>Calcula rutas precisas</p>
                  </IonText>
                </div>
                <div className="benefit-item">
                  <IonIcon icon={checkmarkCircleOutline} color="success" />
                  <IonText>
                    <p>Encuentra conductores cercanos</p>
                  </IonText>
                </div>
                <div className="benefit-item">
                  <IonIcon icon={checkmarkCircleOutline} color="success" />
                  <IonText>
                    <p>Cotizaciones más rápidas</p>
                  </IonText>
                </div>
              </div>

              {/* Botón de acción */}
              <IonButton
                expand="block"
                size="large"
                onClick={handleRequestPermission}
                disabled={loading}
                className="permission-button"
              >
                {loading ? (
                  <>
                    <IonSpinner name="crescent" />
                    <span style={{ marginLeft: "10px" }}>Solicitando permiso...</span>
                  </>
                ) : (
                  "Permitir acceso a ubicación"
                )}
              </IonButton>

              {/* Nota de privacidad */}
              <IonText color="medium">
                <p className="privacy-note">
                  Tu ubicación solo se usa para calcular rutas y encontrar conductores.
                  No compartimos tu información con terceros.
                </p>
              </IonText>
            </>
          ) : (
            <>
              {/* Estado de éxito */}
              <div className="success-container">
                <IonIcon
                  icon={checkmarkCircleOutline}
                  className="success-icon"
                  color="success"
                />
                <IonText>
                  <h2 className="success-title">¡Ubicación obtenida!</h2>
                </IonText>
                <IonText color="medium">
                  <p>Redirigiendo...</p>
                </IonText>
                <IonSpinner name="crescent" color="primary" />
              </div>
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default LocationPermission;

