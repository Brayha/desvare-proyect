import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonIcon,
  IonText,
  IonAvatar,
  IonSpinner,
} from "@ionic/react";
import { personCircleOutline, logInOutline } from "ionicons/icons";
import { Button } from "@components";
import AuthModal from "../components/AuthModal/AuthModal";
import ConfirmModal from "../components/ConfirmModal/ConfirmModal";
import socketService from "../services/socket";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "@hooks/useToast";
import { vehicleAPI } from "../services/vehicleAPI";
import { getVehicleImage } from "../utils/vehicleImages";
import "./MyAccount.css";
import logo from "@shared/src/img/Desvare.svg";
import {
  Setting2,
  Verify,
  MessageQuestion,
  Logout,
  Trash,
} from "iconsax-react";

const MyAccount = () => {
  const history = useHistory();
  const { showSuccess, showError } = useToast();
  const {
    user,
    isLoggedIn,
    vehicles,
    isLoadingVehicles,
    login,
    logout,
    refreshVehicles,
  } = useAuth();

  const [showAuthModal, setShowAuthModal] = useState(false);

  // Estados para eliminar vehículo
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Si no está logueado, mostrar modal de autenticación
    if (!isLoggedIn) {
      setShowAuthModal(true);
    }
  }, [isLoggedIn]);

  const handleAuthSuccess = async (userData) => {
    console.log("✅ Usuario autenticado:", userData);
    await login(userData);
    setShowAuthModal(false);
    showSuccess("¡Bienvenido!");
  };

  const handleAuthModalDismiss = () => {
    setShowAuthModal(false);
    // Si el usuario cierra el modal sin loguearse, redirigir a tab de Desvare
    if (!isLoggedIn) {
      history.replace("/tabs/desvare");
    }
  };

  const handleLogout = () => {
    console.log("👋 Cerrando sesión...");

    // Limpiar listeners de Socket.IO
    socketService.offQuoteReceived();

    // Usar el logout del contexto (limpia todo)
    logout();

    // Forzar recarga completa para limpiar estado
    // Usamos window.location para asegurar un inicio limpio
    window.location.href = "/home";
  };

  // Función para eliminar vehículo
  const handleDeleteVehicle = async () => {
    if (!vehicleToDelete) return;

    setIsDeleting(true);
    try {
      console.log("🗑️ Eliminando vehículo:", vehicleToDelete._id);

      // 1. Llamar al API para eliminar
      await vehicleAPI.deleteVehicle(vehicleToDelete._id);

      // 2. Limpiar localStorage si el vehículo eliminado está allí
      const storedVehicleData = localStorage.getItem("vehicleData");
      if (storedVehicleData) {
        try {
          const parsedVehicleData = JSON.parse(storedVehicleData);
          if (parsedVehicleData.vehicleId === vehicleToDelete._id) {
            console.log("🧹 Limpiando vehículo de localStorage");
            localStorage.removeItem("vehicleData");
          }
        } catch (error) {
          console.error("Error al parsear vehicleData:", error);
        }
      }

      // 3. Refrescar lista de vehículos
      await refreshVehicles();

      // 4. Mostrar mensaje de éxito
      showSuccess("Vehículo eliminado correctamente");

      // 5. Cerrar modal
      setShowDeleteModal(false);
      setVehicleToDelete(null);
    } catch (error) {
      console.error("❌ Error eliminando vehículo:", error);
      const errorMsg =
        error.response?.data?.error || "Error al eliminar el vehículo";
      showError(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Función para abrir modal de confirmación
  const handleOpenDeleteModal = (vehicle) => {
    console.log('🗑️ Abriendo modal para eliminar:', vehicle);
    console.log('Estado antes:', { showDeleteModal, vehicleToDelete });
    setVehicleToDelete(vehicle);
    setShowDeleteModal(true);
    console.log('Estado después - showDeleteModal debería cambiar a true');
  };

  // Función para cerrar modal sin eliminar
  const handleCancelDelete = () => {
    if (!isDeleting) {
      setShowDeleteModal(false);
      setVehicleToDelete(null);
    }
  };

  // Función para abrir WhatsApp con mensaje personalizado
  const handleWhatsAppSupport = () => {
    const phoneNumber = '573505790415'; // +57 350 5790415 sin símbolos
    
    // Crear mensaje personalizado con datos del usuario
    const message = `Hola, necesito ayuda con Desvare.

*Datos del usuario:*
- Nombre: ${user?.name || 'N/A'}
- Teléfono: ${user?.phone || 'N/A'}
- Email: ${user?.email || 'No registrado'}
- Vehículos registrados: ${vehicles.length}

Mi consulta es: `;

    // Codificar el mensaje para URL
    const encodedMessage = encodeURIComponent(message);
    
    // Crear enlace de WhatsApp
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    // Abrir WhatsApp (en nueva pestaña para web, o app para móvil)
    window.open(whatsappUrl, '_blank');
    
    console.log('📱 Abriendo WhatsApp para soporte');
  };

  // Vista cuando NO está logueado (se muestra el modal automáticamente)
  if (!isLoggedIn) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Mi cuenta</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding my-account-page">
          <div className="empty-state">
            <IonIcon icon={logInOutline} className="empty-icon" />
            <IonText>
              <h2>Inicia sesión</h2>
              <p>
                Accede a tu cuenta para ver tu perfil y gestionar tus vehículos
              </p>
            </IonText>
            <Button expand="block" onClick={() => setShowAuthModal(true)}>
              Iniciar sesión / Registrarse
            </Button>
          </div>

          <AuthModal
            isOpen={showAuthModal}
            onDismiss={handleAuthModalDismiss}
            onSuccess={handleAuthSuccess}
          />
        </IonContent>
      </IonPage>
    );
  }

  // Vista cuando SÍ está logueado
  return (
    <IonPage>
      <IonContent className="my-account-page">
        <div className="my-account-content">
          <div className="auth-logo-profile">
            <img src={logo} alt="Desvare" className="auth-logo" />
          </div>

          <div className="profile-container">
            <div className="profile-header">
              <div className="profile-header-left">
                <IonAvatar className="profile-avatar">
                  <IonIcon icon={personCircleOutline} />
                </IonAvatar>
                <IonText>
                  <h1 className="profile-name">
                    Hola, {user?.name || "Usuario"}
                  </h1>
                  <p className="profile-subtitle">{user?.phone || "N/A"}</p>
                </IonText>
              </div>

              <div className="profile-header-right">
                <Setting2 size={20} color="#9CA3AF" />
              </div>
            </div>

            {/* Mis Vehículos */}
            <div className="vehicles-container">
              <div className="vehicles-header">
                <h2>Mis Vehículos</h2>
              </div>

              {/* Loading State */}
              {isLoadingVehicles ? (
                <div className="vehicles-content">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      padding: "40px 20px",
                      width: "100%",
                    }}
                  >
                    <IonSpinner name="crescent" color="primary" />
                  </div>
                </div>
              ) : vehicles.length === 0 ? (
                /* Empty State */
                <div className="vehicles-content">
                  <div
                    style={{
                      textAlign: "center",
                      padding: "40px 20px",
                      width: "100%",
                    }}
                  >
                    <IonText color="medium">
                      <p style={{ margin: "0 0 8px 0", fontSize: "14px" }}>
                        No tienes vehículos guardados
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "12px",
                          color: "#9CA3AF",
                        }}
                      >
                        Los vehículos se guardan automáticamente cuando
                        solicitas un servicio
                      </p>
                    </IonText>
                  </div>
                </div>
              ) : (
                /* Lista de Vehículos con tu estilo */
                <div className="vehicles-content">
                  {vehicles.map((vehicle) => (
                    <div key={vehicle._id} className="vehicles-content-item">
                      <div className="vehicles-content-item-left">
                        <img
                          src={getVehicleImage(vehicle.category?.id)}
                          alt={vehicle.category?.name || "Vehículo"}
                        />
                        <div className="vehicles-content-item-text">
                          <h3>
                            {vehicle.brand?.name || "N/A"}{" "}
                            {vehicle.model?.name || ""}
                          </h3>
                          <p>{vehicle.licensePlate || "N/A"}</p>
                        </div>
                      </div>
                      <div className="vehicles-content-item-right">
                        <button
                          className="vehicle-delete-btn"
                          onClick={() => handleOpenDeleteModal(vehicle)}
                          aria-label="Eliminar vehículo"
                        >
                          <Trash size={20} color="#EF4444" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="options-profile">
              <div className="options-profile-item">
                <Verify size={20} color="#9CA3AF" />
                <p>Servicios tomados</p>
              </div>
              <div className="options-profile-item" onClick={handleWhatsAppSupport}>
                <MessageQuestion size={20} color="#9CA3AF" />
                <p>Ayuda</p>
              </div>
              <div className="options-profile-item" onClick={handleLogout}>
                <Logout size={20} color="#9CA3AF" />
                <p>Cerrar sesión</p>
              </div>
            </div>

            <p className="my-account-footer-text">
              v.1.5.69 · <a href="/terms">Terms & Conditions</a> · <a href="/privacy">Politicas de privacidad</a></p>
          </div>
        </div>
      </IonContent>

      {/* Modal de confirmación para eliminar vehículo */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onDismiss={handleCancelDelete}
        onConfirm={handleDeleteVehicle}
        title="¿Eliminar vehículo?"
        message={`¿Estás seguro de que deseas eliminar el ${vehicleToDelete?.brand?.name} ${vehicleToDelete?.model?.name}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isLoading={isDeleting}
        variant="danger"
      />
    </IonPage>
  );
};

export default MyAccount;
