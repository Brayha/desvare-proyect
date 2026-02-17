import { useEffect } from "react";
import { useHistory } from "react-router-dom";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonList,
  IonItem,
  IonLabel,
  IonText,
  IonBadge,
  IonButtons,
  useIonToast,
} from "@ionic/react";
import { Button } from "../components/Button/Button";
import { Location } from 'iconsax-react';
import mapBackground from "../assets/img/map-home-responsive.png";
import socketService from "../services/socket";
import "./Home.css";
import logo from "../assets/img/Desvare.svg";

const Home = () => {
  const history = useHistory();
  const [present] = useIonToast();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (userData && token) {
      // Usuario está logueado
      const parsedUser = JSON.parse(userData);

      // Registrar cliente (Socket.IO ya está conectado desde App.jsx)
      socketService.registerClient(parsedUser.id);
    }
  }, [history, present]);

  // Función para solicitar grúa (verifica permisos primero)
  const handleRequestTowTruck = async () => {
    console.log('🚗 Botón "Solicitar Grúa" presionado');

    // Verificar permisos del navegador directamente
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({
          name: "geolocation",
        });
        console.log("📍 Estado de permisos de geolocalización:", result.state);

        if (result.state === "granted") {
          // Tiene permisos, guardar en localStorage y ir al mapa
          localStorage.setItem("locationPermission", "granted");
          console.log(
            "✅ Permisos confirmados → Ir directo a /tabs/desvare"
          );
          history.push("/tabs/desvare");
        } else {
          // No tiene permisos o están denegados
          console.log("⚠️ Sin permisos → Ir a /location-permission");
          history.push("/location-permission");
        }
      } else {
        // Navegador no soporta query de permisos, verificar localStorage
        const locationPermission = localStorage.getItem("locationPermission");
        if (locationPermission === "granted") {
          console.log(
            "✅ Ya tiene permisos (localStorage) → Ir directo a /tabs/desvare"
          );
          history.push("/tabs/desvare");
        } else {
          console.log("⚠️ Sin permisos → Ir a /location-permission");
          history.push("/location-permission");
        }
      }
    } catch (error) {
      console.error("❌ Error al verificar permisos:", error);
      // En caso de error, ir a location-permission por seguridad
      history.push("/location-permission");
    }
  };

  return (
    <IonPage>
      <IonContent className="home-container">
        <div
          className="home-content-wrapper"
          style={{ backgroundImage: `url(${mapBackground})` }}
        >
          <div className="home-content">
            {/* TODO: LOGO */}
            <div className="home-content-header">
              <img src={logo} alt="logo" />
            </div>
            {/* TODO: COTIZACIONES */}
            <div className="quotes-container">
              <div className="location-pointer">
                <Location size={40} color="var(--desvare-primary)" variant="Bold" />
              </div>
              <div className="quote-item quote-1">
                <h2 className="quote-item-title">$120.000</h2>
              </div>
              <div className="quote-item quote-2">
                <h2 className="quote-item-title">$100.000</h2>
              </div>
              <div className="quote-item quote-3">
                <h2 className="quote-item-title">$80.000</h2>
              </div>
            </div>
            {/* TODO: ACCIONES */}
            <div className="home-content-body">
              <h1 className="title-card">Pide tu grúa en minutos</h1>
              <p className="description-card">
                Cotiza en tiempo real, compara precios y recibe ayuda al
                instante
              </p>
              <Button
                variant="primary"
                expand="block"
                onClick={handleRequestTowTruck}
                className="button-large"
              >
                Cotizar servicio de grúa
              </Button>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
