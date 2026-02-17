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
import logo from "../assets/img/Desvare.svg";
import geolocationIcon from "../assets/img/area-map.gif";
import "./LocationPermission.css";
import { Routing2, LocationTick } from 'iconsax-react';
import { Button } from "../components/Button/Button";

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
        history.push("/tabs/desvare");
      }, 1000);
    } catch (error) {
      showError(
        "No pudimos obtener tu ubicación. Por favor, activa los permisos en tu navegador."
      );
    }
  };

  const handleDenyPermission = () => {
    history.push("/home");
  };

    return (
    <IonPage>
      <IonContent>
        <div className="location-permission-page">
          {/* TODO: LOGO */}
          <div className="permission-content-header">
            <img src={logo} alt="logo" />
          </div>
          <div className="permission-container">
            {!permissionGranted ? (
              <>
              <div className="permission-icon">
                <img src={geolocationIcon} alt="geolocation" />
              </div>
                {/* Título */}
                <IonText>
                  <h1 className="permission-title">Necesitamos tu ubicación</h1>
                </IonText>

                {/* Descripción */}
                <IonText color="medium">
                  <p className="permission-description">
                    Para brindarte el mejor servicio, necesitamos conocer tu
                    ubicación y calcular la ruta hacia tu destino.
                  </p>
                </IonText>

                {/* Beneficios */}
                <div className="benefits-list">
                  <div className="benefit-item">
                  <Routing2 size={24} color="#9CA3AF"/>
                    <IonText>
                      <p>Calcula rutas precisas</p>
                    </IonText>
                  </div>
                  <div className="benefit-item">
                  <LocationTick size={24} color="#9CA3AF"/>
                    <IonText>
                      <p>Encuentra conductores cercanos</p>
                    </IonText>
                  </div>
                </div>

                {/* Botón de acción */}
                <Button
                  variant="primary"
                  size="large"
                  expand="block"
                  onClick={handleRequestPermission}
                  disabled={loading}
                >
                  Permitir acceso a ubicación
                </Button>

                <Button
                  variant="outline"
                  size="large"
                  expand="block"
                  onClick={handleDenyPermission}
                  disabled={loading}
                  color="#9CA3AF"
                >
                  Denegar solicitud
                </Button>

                {/* Nota de privacidad */}
                <IonText color="medium">
                  <p className="privacy-note">
                    Tu ubicación solo se usa para calcular rutas y encontrar
                    conductores. No compartimos tu información con terceros.
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
        </div>
      </IonContent>
    </IonPage>
  );
};

export default LocationPermission;
