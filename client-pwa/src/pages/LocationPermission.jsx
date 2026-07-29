import { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import {
  IonPage,
  IonContent,
  IonText,
  IonSpinner,
  IonIcon,
} from "@ionic/react";
import { checkmarkCircleOutline } from "ionicons/icons";
import { useToast } from "@hooks/useToast";
import logo from "../assets/img/Desvare.svg";
import geolocationIcon from "../assets/img/area-map.gif";
import "./LocationPermission.css";
import { Routing2, LocationTick } from "iconsax-react";
import { Button } from "../components/Button/Button";
import {
  goToMarketingSite,
  markLocationPermissionGranted,
  resolveGeolocationEntryPath,
} from "../utils/appNavigation";

const LocationPermission = () => {
  const history = useHistory();
  const { showError } = useToast();
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Si el permiso ya fue concedido antes, ir directo al mapa sin mostrar esta pantalla
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const path = await resolveGeolocationEntryPath();
      if (!cancelled && path === "/tabs/desvare") {
        history.replace("/tabs/desvare");
        return;
      }
      if (!cancelled) {
        setIsChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [history]);

  const handleRequestPermission = () => {
    if (!navigator.geolocation) {
      showError("Tu navegador no soporta geolocalización");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        markLocationPermissionGranted();
        setPermissionGranted(true);
        setTimeout(() => {
          history.replace("/tabs/desvare");
        }, 1000);
      },
      () => {
        showError(
          "No pudimos obtener tu ubicación. Por favor, activa los permisos en tu navegador."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const handleDenyPermission = () => {
    goToMarketingSite();
  };

  if (isChecking) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner name="crescent" />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent>
        <div className="location-permission-page">
          <div className="permission-content-header">
            <img src={logo} alt="logo" />
          </div>
          <div className="permission-container">
            {!permissionGranted ? (
              <>
                <div className="permission-icon">
                  <img src={geolocationIcon} alt="geolocation" />
                </div>
                <IonText>
                  <h1 className="permission-title">Necesitamos tu ubicación</h1>
                </IonText>

                <IonText color="medium">
                  <p className="permission-description">
                    Para brindarte el mejor servicio, necesitamos conocer tu
                    ubicación y calcular la ruta hacia tu destino.
                  </p>
                </IonText>

                <div className="benefits-list">
                  <div className="benefit-item">
                    <Routing2 size={24} color="#9CA3AF" />
                    <IonText>
                      <p>Calcula rutas precisas</p>
                    </IonText>
                  </div>
                  <div className="benefit-item">
                    <LocationTick size={24} color="#9CA3AF" />
                    <IonText>
                      <p>Encuentra conductores cercanos</p>
                    </IonText>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="large"
                  expand="block"
                  onClick={handleRequestPermission}
                >
                  Permitir acceso a ubicación
                </Button>

                <Button
                  variant="outline"
                  size="large"
                  expand="block"
                  onClick={handleDenyPermission}
                  color="#9CA3AF"
                >
                  Denegar solicitud
                </Button>

                <IonText color="medium">
                  <p className="privacy-note">
                    Tu ubicación solo se usa para calcular rutas y encontrar
                    conductores. No compartimos tu información con terceros.
                  </p>
                </IonText>
              </>
            ) : (
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
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default LocationPermission;
