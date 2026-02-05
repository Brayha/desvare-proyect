import { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import {
  IonPage,
  IonContent,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonSpinner,
  useIonAlert,
} from "@ionic/react";
import { call } from "ionicons/icons";
import { Moneys, Refresh2 } from "iconsax-react";
import { MapPicker } from "../components/Map/MapPicker";
import { useToast } from "@hooks/useToast";
import socketService from "../services/socket";
import "./DriverOnWay.css";

import logo from "@shared/src/img/Desvare.svg";

const DriverOnWay = () => {
  const history = useHistory();
  const { showSuccess, showError } = useToast();
  const [presentAlert] = useIonAlert();

  const [serviceData, setServiceData] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null); // 🆕 Ubicación en tiempo real del conductor
  const [driverHeading, setDriverHeading] = useState(0); // 🆕 Dirección del vehículo
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("🔄 DriverOnWay - Inicializando...");

    // Cargar datos del servicio aceptado
    const activeServiceData = localStorage.getItem("activeService");

    if (!activeServiceData) {
      showError("No se encontraron datos del servicio");
      history.push("/home");
      return;
    }

    const parsedData = JSON.parse(activeServiceData);
    console.log("📦 Servicio activo cargado:", parsedData);

    setServiceData(parsedData);
    setIsLoading(false);

    // Socket.IO ya está conectado desde App.jsx
    if (!socketService.socket?.connected) {
      console.log("🔌 Conectando Socket.IO...");
      socketService.connect();
    } else {
      console.log("✅ Socket.IO ya conectado");
    }

    // ✅ Escuchar cuando el conductor completa el servicio
    socketService.onServiceCompleted((data) => {
      console.log('✅ Servicio completado por el conductor:', data);
      
      showSuccess('¡Servicio completado! El conductor llegó al destino.');
      
      // Guardar datos del servicio completado para la pantalla de calificación
      const completedServiceData = {
        requestId: data.requestId || parsedData.requestId,
        driver: parsedData.driver,
        amount: parsedData.amount,
        origin: parsedData.origin,
        destination: parsedData.destination,
        completedAt: data.completedAt
      };
      
      localStorage.setItem('completedService', JSON.stringify(completedServiceData));
      console.log('💾 Datos del servicio completado guardados para calificación');
      
      // Limpiar servicio activo
      localStorage.removeItem('activeService');
      
      // Redirigir a la pantalla de calificación después de 1.5 segundos
      setTimeout(() => {
        history.replace('/rate-service');
      }, 1500);
    });

    // 🆕 Escuchar actualizaciones de ubicación del conductor en tiempo real
    socketService.onLocationUpdate((data) => {
      console.log('📍 Ubicación del conductor actualizada:', data);
      
      setDriverLocation({
        lat: data.location.lat,
        lng: data.location.lng
      });
      
      setDriverHeading(data.heading || 0);
    });

    return () => {
      console.log("🧹 DriverOnWay - Cleanup");
      socketService.offServiceCompleted();
      socketService.offLocationUpdate(); // 🆕 Limpiar listener de ubicación
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCall = () => {
    if (serviceData?.driver?.phone) {
      window.location.href = `tel:${serviceData.driver.phone}`;
    } else {
      showError("No se pudo obtener el teléfono del conductor");
    }
  };

  // Generar estrellas dinámicamente basadas en el rating
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <>
        {"⭐".repeat(fullStars)}
        {hasHalfStar && "⭐"}
        {"☆".repeat(emptyStars)}
      </>
    );
  };

  // Formatear el monto como moneda colombiana
  const formatAmount = (amount) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Formatear placa con guión después de 3 caracteres (ABC-123)
  const formatLicensePlate = (plate) => {
    if (!plate) return "Sin placa";
    
    // Limpiar la placa (eliminar espacios y guiones existentes)
    const cleanPlate = plate.replace(/[\s-]/g, '').toUpperCase();
    
    // Si tiene más de 3 caracteres, agregar el guión
    if (cleanPlate.length > 3) {
      return `${cleanPlate.slice(0, 3)}-${cleanPlate.slice(3)}`;
    }
    
    return cleanPlate;
  };

  // const handleChat = () => {
  //   showInfo("Chat próximamente disponible");
  // };

  const handleCancelService = () => {
    console.log("🚨 handleCancelService llamado - Mostrando alert nativo");
    
    // Primero, ofrecer llamar al conductor
    presentAlert({
      header: '⚠️ Cancelar Servicio',
      message: serviceData?.driver?.phone 
        ? `¿Deseas llamar a ${serviceData.driver.name} antes de cancelar?`
        : '¿Estás seguro que deseas cancelar el servicio?',
      buttons: [
        {
          text: 'Volver',
          role: 'cancel'
        },
        ...(serviceData?.driver?.phone ? [{
          text: `📞 Llamar a ${serviceData.driver.name}`,
          handler: () => {
            window.location.href = `tel:${serviceData.driver.phone}`;
            return true; // Cerrar el alert después de iniciar la llamada
          }
        }] : []),
        {
          text: 'Continuar con cancelación',
          handler: () => {
            // Usar setTimeout para asegurar que el primer alert se cierre antes
            setTimeout(() => {
              showCancellationReasons();
            }, 250);
          }
        }
      ]
    });
  };

  const showCancellationReasons = () => {
    presentAlert({
      header: 'Cancelar Servicio',
      message: '¿Por qué deseas cancelar el servicio?',
      inputs: [
        {
          type: 'radio',
          label: 'Ya me desvaré / El carro prendió',
          value: 'resuelto',
          checked: true
        },
        {
          type: 'radio',
          label: 'El conductor no viene',
          value: 'conductor_no_viene'
        },
        {
          type: 'radio',
          label: 'El conductor no responde',
          value: 'conductor_no_responde'
        },
        {
          type: 'radio',
          label: 'Otra grúa me recogió',
          value: 'otra_grua'
        },
        {
          type: 'radio',
          label: 'Muy caro',
          value: 'muy_caro'
        },
        {
          type: 'radio',
          label: 'El conductor está muy lejos',
          value: 'muy_lejos'
        },
        {
          type: 'radio',
          label: 'Otro motivo',
          value: 'otro'
        }
      ],
      buttons: [
        {
          text: 'Volver',
          role: 'cancel'
        },
        {
          text: 'Confirmar Cancelación',
          cssClass: 'alert-button-confirm',
          handler: (reason) => {
            if (!reason) {
              showError('Selecciona un motivo');
              return false;
            }
            
            if (reason === 'otro') {
              // Usar setTimeout para encadenar alerts correctamente
              setTimeout(() => {
                presentAlert({
                  header: 'Otro Motivo',
                  message: 'Describe el motivo de la cancelación:',
                  inputs: [
                    {
                      name: 'customReason',
                      type: 'textarea',
                      placeholder: 'Escribe aquí...',
                      attributes: {
                        maxlength: 200
                      }
                    }
                  ],
                  buttons: [
                    {
                      text: 'Volver',
                      role: 'cancel'
                    },
                    {
                      text: 'Confirmar',
                      handler: (data) => {
                        if (!data.customReason || data.customReason.trim() === '') {
                          showError('Debes escribir un motivo');
                          return false;
                        }
                        confirmCancellation(reason, data.customReason);
                        return true; // Cerrar el alert después de confirmar
                      }
                    }
                  ]
                });
              }, 250);
              return true; // Cerrar el primer alert
            }
            
            // Cancelar con motivo predefinido
            confirmCancellation(reason);
            return true; // Cerrar el alert después de confirmar
          }
        }
      ]
    });
  };

  const confirmCancellation = (reason, customReason = null) => {
    console.log("📝 Confirmando cancelación con razón:", reason, customReason);

    // ✅ Limpiar TODO completamente
    localStorage.removeItem("activeService");
    localStorage.removeItem("currentRequestId");
    localStorage.removeItem("requestData");
    localStorage.removeItem("quotesReceived");

    // Notificar al backend y al conductor con el método correcto
    socketService.cancelServiceWithDetails({
      requestId: serviceData.requestId,
      reason: reason,
      customReason: customReason,
      clientName: serviceData.clientName,
      vehicle: serviceData.vehicle,
      origin: serviceData.origin,
      destination: serviceData.destination,
      problem: serviceData.problem,
    });

    showSuccess("Servicio cancelado");

    // ✅ Forzar navegación limpia sin conflictos de estado
    window.location.href = "/home";
  };

  if (isLoading || !serviceData) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <IonSpinner />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent className="driver-on-way-page" fullscreen>
        <div className="logo-content" onClick={() => history.replace("/home")}>
          <img src={logo} alt="logo" />
        </div>
        {/* Mapa con tracking en tiempo real */}
        <div className="map-container-tracking">
          <MapPicker
            origin={serviceData.origin}
            destination={null}
            onRouteCalculated={() => {}}
            quotes={[]}
            onQuoteClick={null}
            driverLocation={driverLocation} // 🆕 Ubicación en tiempo real
            driverHeading={driverHeading}   // 🆕 Dirección del vehículo
            driverPhoto={serviceData.driver?.photo} // 🆕 Foto del conductor
            driverName={serviceData.driver?.name}   // 🆕 Nombre del conductor
          />

          {/* Información del servicio */}
          <div className="service-info-section">
            {/* Overlay con info del conductor */}
            <div className="confirm-driver-info-section">
              <div className="confirm-driver-info-header">
                <div className="confirm-driver-info-header-compact">
                  <div className="driver-avatar-small">
                    {serviceData.driver?.photo ? (
                      <img 
                        src={serviceData.driver.photo} 
                        alt={serviceData.driver?.name} 
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.textContent = serviceData.driver?.name?.charAt(0) || "C";
                        }}
                      />
                    ) : (
                      serviceData.driver?.name?.charAt(0) || "C"
                    )}
                  </div>
                  <div className="confirm-driver-info-details">
                    <h3>{serviceData.driver?.name}</h3>
                    <div className="confirm-driver-info-meta">
                      <span className="stars-rating">
                        {renderStars(serviceData.driver?.rating || 5)}
                      </span>
                    </div>
                  </div>
                  <p className="vehicle-plate-confirmed-driver-on-way">
                    {formatLicensePlate(serviceData.driver?.towTruck?.licensePlate)}
                  </p>
                </div>
              </div>

              <IonButton
                expand="block"
                onClick={handleCall}
                className="call-button"
              >
                <IonIcon icon={call} slot="start" />
                Llamar
              </IonButton>
              {/* <IonButton
                expand="block"
                fill="outline"
                onClick={handleChat}
                className="chat-button"
              >
                <IonIcon icon={chatbubbleEllipses} slot="start" />
                Chat
              </IonButton> */}

              <div className="quote-summary-container">
                <div className="box-items">
                  <div className="info-items">
                    <div className="info-item">
                      <p>Valor</p>
                      <h4>{formatAmount(serviceData.amount || 0)}</h4>
                    </div>
                  </div>
                  <div className="info-items">
                    <div className="info-item">
                      <p>Método de pago</p>
                      <h4>{serviceData.paymentMethod || "Efectivo"}</h4>
                    </div>
                  </div>
                </div>
                
                <div className="code-box">
                  <div className="box-info">
                    <h4>🔒 Código de Seguridad</h4>
                    <div className="code-digits">
                      {serviceData.securityCode
                        ?.split("")
                        .map((digit, index) => (
                          <div key={index} className="digit">
                            {digit}
                          </div>
                        ))}
                    </div>
                  </div>
                  <p>
                    Cuando tu vehículo este sobre la grúa, dale este código al
                    condutor para habilitarle el destino
                  </p>
                </div>
              </div>

              <IonButton
                expand="block"
                fill="clear"
                color="danger"
                onClick={handleCancelService}
                className="cancel-service-button"
              >
                Cancelar Servicio
              </IonButton>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default DriverOnWay;
