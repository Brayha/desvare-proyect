import { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonText,
  IonIcon,
  IonSpinner,
} from "@ionic/react";
import { settingsOutline } from "ionicons/icons";
import planchonImg from "../assets/img/vehicles/planchon.svg";
import ganchoImg from "../assets/img/vehicles/gancho.svg";
import socketService from "../services/socket";
import "./Profile.css";
import { Logout, Verify, MessageQuestion, Moneys } from "iconsax-react";

// ============================================
// API URL Configuration
// ============================================
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const Profile = () => {
  const history = useHistory();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      history.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);

    // Cargar perfil completo
    loadProfile(parsedUser._id);
  }, [history]);

  const loadProfile = async (driverId) => {
    try {
      const response = await fetch(
        `${API_URL}/api/drivers/profile/${driverId}`,
      );
      const data = await response.json();

      if (response.ok) {
        setProfile(data.driver);
      } else {
        console.error("Error al cargar perfil:", data);
      }
    } catch (error) {
      console.error("❌ Error al cargar perfil:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppSupport = () => {
    const phoneNumber = '573505790415';

    const brand = profile?.towTruck?.baseBrand || profile?.towTruck?.customBrand || profile?.towTruck?.brand || 'N/A';
    const model = profile?.towTruck?.baseModel || profile?.towTruck?.customModel || profile?.towTruck?.model || 'N/A';
    const plate = profile?.towTruck?.licensePlate || 'N/A';

    const message = `Hola, necesito ayuda con Desvare (conductor).

*Datos del conductor:*
- Nombre: ${profile?.name || 'N/A'}
- Teléfono: ${profile?.phone || 'N/A'}
- Email: ${profile?.email || 'No registrado'}
- Grúa: ${brand} ${model}
- Placa: ${plate}

Mi consulta es: `;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("hasSeenLocationModal");
    socketService.disconnect();
    history.push("/login");
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/home" />
            </IonButtons>
            <IonTitle>Mi Perfil</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner name="crescent" />
          <IonText>
            <p>Cargando perfil...</p>
          </IonText>
        </IonContent>
      </IonPage>
    );
  }

  if (!profile) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/home" />
            </IonButtons>
            <IonTitle>Mi Perfil</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonText color="danger">
            <p>Error al cargar el perfil</p>
          </IonText>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Mi Perfil</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding profile-content-body">
        <div className="profile-container ">
          <div className="profile-header">
            <div className="profile-header-left">
              <img
                src={
                  profile.documents?.selfie ||
                  "https://ionicframework.com/docs/img/demos/avatar.svg"
                }
                alt={profile.name}
                className="profile-avatar"
              />
              <div className="profile-header-left-text">
                <h2 className="profile-name">
                  {profile.name}
                </h2>
                <p className="profile-subtitle">{profile.phone} <span> / {profile.rating.toFixed(1)} ⭐</span></p>
              </div>
            </div>
            <div
              className="profile-header-right"
              onClick={() => history.push("/edit-profile")}
              style={{ cursor: "pointer" }}
            >
              <IonIcon icon={settingsOutline} slot="start" color="primary" />
            </div>
          </div>
          {/* Mi grua */}
          <div className="vehicles-container">
            <div className="vehicles-header">
              <h2>Mi Grúa</h2>
            </div>

            <div className="vehicles-content">
              {!profile.towTruck ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    width: "100%",
                  }}
                >
                  <IonText color="medium">
                    <p style={{ margin: "0 0 8px 0", fontSize: "14px" }}>
                      No tienes grúa registrada
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "12px",
                        color: "#9CA3AF",
                      }}
                    >
                      Contacta al administrador para registrar tu vehículo
                    </p>
                  </IonText>
                </div>
              ) : (
                <div className="vehicles-content-item">
                  <div className="vehicles-content-item-left">
                    <div className="tow-truck-icon-wrapper">
                      <img
                        src={profile.towTruck.truckType === "GRUA_PESADA" ? ganchoImg : planchonImg}
                        alt="Grúa"
                        className="tow-truck-icon"
                      />
                    </div>
                    <div className="vehicles-content-item-text">
                      <h3>
                        {profile.towTruck.baseBrand || profile.towTruck.customBrand || profile.towTruck.brand}{" "}
                        {profile.towTruck.baseModel || profile.towTruck.customModel || profile.towTruck.model}
                        {profile.towTruck.year ? ` (${profile.towTruck.year})` : ""}
                      </h3>
                      <p>{profile.towTruck.licensePlate}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="options-profile">
            <div className="options-profile-item">
              <Moneys size={20} color="#9CA3AF" />
              <p>Ganancias Totales</p>
              <p className="options-profile-item-value">${profile.totalEarnings.toLocaleString()}</p>
            </div>
            <div
              className="options-profile-item"
              onClick={() => history.push("/driver-service-history")}
              style={{ cursor: "pointer" }}
            >
              <Verify size={20} color="#9CA3AF" />
              <p>Servicios Completados</p>
              <p className="options-profile-item-value">{profile.totalServices}</p>
            </div>
            <div className="options-profile-item" onClick={handleWhatsAppSupport} style={{ cursor: "pointer" }}>
              <MessageQuestion size={20} color="#9CA3AF" />
              <p>Ayuda</p>
            </div>
            <div className="options-profile-item" onClick={handleLogout}>
              <Logout size={20} color="#9CA3AF" />
              <p>Cerrar sesión</p>
            </div>
          </div>
          <p className="my-account-footer-text">
            v.1.5.69 · <a href="/terms">Terms & Conditions</a> ·{" "}
            <a href="/privacy">Politicas de privacidad</a>
          </p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Profile;
