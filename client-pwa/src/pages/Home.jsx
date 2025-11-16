import { useState, useEffect } from "react";
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
import { Button } from "@components";
import { Location } from 'iconsax-react';
import mapBackground from "@shared/src/img/map-home-responsive.png";
import socketService from "../services/socket";
import "./Home.css";
import logo from "@shared/src/img/Desvare.svg";

const Home = () => {
  const history = useHistory();
  const [present] = useIonToast();

  const [user, setUser] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (userData && token) {
      // Usuario está logueado
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setIsLoggedIn(true);

      // Registrar cliente (Socket.IO ya está conectado desde App.jsx)
      socketService.registerClient(parsedUser.id);

      // Escuchar cotizaciones recibidas
      socketService.onQuoteReceived((quote) => {
        console.log("💰 Cotización recibida:", quote);
        setQuotes((prev) => [quote, ...prev]);

        present({
          message: `Nueva cotización de ${
            quote.driverName
          }: $${quote.amount.toLocaleString()}`,
          duration: 3000,
          color: "success",
        });
      });

      return () => {
        // Solo limpiar el listener, no desconectar (manejado por App.jsx)
        socketService.offQuoteReceived();
      };
    } else {
      // Usuario NO está logueado
      setIsLoggedIn(false);
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

  const handleLogout = () => {
    console.log("👋 Cerrando sesión...");

    // Limpiar TODOS los datos de localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("requestData");
    localStorage.removeItem("currentRequestId");

    // NO desconectar Socket.IO aquí - se maneja en App.jsx al desmontar
    // Solo limpiar listeners locales
    socketService.offQuoteReceived();

    // Redirigir al home
    history.replace("/home");

    // Recargar para actualizar el estado
    window.location.reload();
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

              {isLoggedIn && (
                <Button
                  variant="secondary"
                  size="large"
                  expand="block"
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </Button>
              )}
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
