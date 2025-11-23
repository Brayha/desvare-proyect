import { useState, useEffect, useRef } from "react";
import { useHistory } from "react-router-dom";
import {
  IonPage,
  IonModal,
  IonContent,
  IonText,
  IonSpinner,
  IonSegment,
  IonSegmentButton,
  IonLabel,
} from "@ionic/react";
import { Profile, Call, Sms, Lock } from "iconsax-react";
import { useToast } from "@hooks/useToast";
import { authAPI, requestAPI } from "../services/api";
import socketService from "../services/socket";
import { useAuth } from "../contexts/AuthContext";
import { MapPicker } from "../components/Map/MapPicker";
import "./RequestAuth.css";
import logo from "@shared/src/img/Desvare.svg";

const RequestAuth = () => {
  const history = useHistory();
  const { showSuccess, showError } = useToast();
  const { login: authLogin, refreshVehicles } = useAuth();

  // Datos de la ruta y vehículo (desde localStorage)
  const [routeData, setRouteData] = useState(null);
  const [vehicleData, setVehicleData] = useState(null);

  // Estado de autenticación OTP (2 pasos)
  const [authMode, setAuthMode] = useState("login"); // "login" o "register"
  const [step, setStep] = useState(1); // 1: formulario, 2: OTP
  const [userId, setUserId] = useState(null); // ID del usuario para verificar OTP
  const [isLoading, setIsLoading] = useState(false);

  // Formulario de login (solo teléfono)
  const [loginPhone, setLoginPhone] = useState("");

  // Formulario de registro (nombre, teléfono, email opcional)
  const [registerName, setRegisterName] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");

  // OTP
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  // Refs para OTP inputs
  const otpRefs = useRef([]);

  // Control del modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // useEffect para abrir el modal al montar
  useEffect(() => {
    // Pequeño delay para asegurar que el DOM esté listo
    const timer = setTimeout(() => {
      setIsModalOpen(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Función para formatear teléfono: 319 257 95 62
  const formatPhone = (phone) => {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, "");

    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    } else if (cleaned.length <= 8) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(
        6
      )}`;
    } else {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(
        6,
        8
      )} ${cleaned.slice(8, 10)}`;
    }
  };

  // Función para manejar input de teléfono
  const handlePhoneInput = (value, setter) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 10);
    setter(cleaned);
  };

  // Funciones para manejar OTP
  const handleOTPChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Solo números

    const newOtp = otp.split("");
    newOtp[index] = value;
    setOtp(newOtp.join(""));
    setOtpError("");

    // Auto-focus siguiente input
    if (value && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  useEffect(() => {
    console.log("🔍 RequestAuth - Verificando estado de autenticación...");

    // Verificar si ya está autenticado
    const userData = localStorage.getItem("user");
    if (userData) {
      console.log("✅ Usuario ya autenticado, redirigiendo...");
      history.replace("/waiting-quotes");
      return;
    }

    // Cargar datos de la ruta (usar 'requestData' que es lo que guarda RequestService)
    const storedRouteData = localStorage.getItem("requestData");
    if (!storedRouteData) {
      console.log("❌ No hay datos de ruta, volviendo a RequestService");
      showError("Selecciona primero tu destino");
      history.replace("/request-service");
      return;
    }

    try {
      const parsedRouteData = JSON.parse(storedRouteData);
      console.log("📋 Datos de ruta cargados:", parsedRouteData);
      setRouteData(parsedRouteData);
    } catch (error) {
      console.error("❌ Error al parsear requestData:", error);
      showError("Error al cargar datos de la ruta");
      history.replace("/request-service");
    }

    // Cargar datos del vehículo (si existen)
    const storedVehicleData = localStorage.getItem("vehicleData");
    if (storedVehicleData) {
      try {
        const parsedVehicleData = JSON.parse(storedVehicleData);
        console.log("🚗 Datos de vehículo cargados:", parsedVehicleData);
        setVehicleData(parsedVehicleData);
      } catch (error) {
        console.error("⚠️ Error al parsear vehicleData:", error);
        // No bloqueamos el flujo si falla la carga de vehículo
      }
    } else {
      console.log("⚠️ No hay datos de vehículo en localStorage");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ Sin dependencias para ejecutar solo una vez al montar y evitar loops

  // PASO 1: Login (solo teléfono)
  const handleLoginSubmit = async () => {
    console.log("📱 Iniciando login con teléfono:", loginPhone);

    if (!loginPhone || loginPhone.length !== 10) {
      showError("Ingresa un número de teléfono válido");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.loginOTP({ phone: loginPhone });
      console.log("✅ Login OTP - Respuesta:", response.data);

      setUserId(response.data.userId);
      setStep(2); // Ir a paso de OTP
      showSuccess("Te enviamos un código de verificación");
    } catch (error) {
      console.error("❌ Error en login OTP:", error);
      const errorMsg = error.response?.data?.error || "Error al iniciar sesión";
      showError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // PASO 1: Registro (nombre, teléfono, email opcional)
  const handleRegisterSubmit = async () => {
    console.log("📱 Iniciando registro:", {
      registerName,
      registerPhone,
      registerEmail,
    });

    if (!registerName || !registerPhone || registerPhone.length !== 10) {
      showError("Nombre y teléfono válido son requeridos");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.registerOTP({
        name: registerName,
        phone: registerPhone,
        email: registerEmail || undefined,
      });
      console.log("✅ Registro OTP - Respuesta:", response.data);

      setUserId(response.data.userId);
      setStep(2); // Ir a paso de OTP
      showSuccess("Te enviamos un código de verificación");
    } catch (error) {
      console.error("❌ Error en registro OTP:", error);
      const errorMsg = error.response?.data?.error || "Error al registrarte";

      // Si el teléfono ya existe, sugerir usar login
      if (errorMsg.includes("ya está registrado")) {
        showError(
          'Este número ya está registrado. Usa "Iniciar Sesión" en su lugar.'
        );
      } else {
        showError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // PASO 2: Verificar OTP y enviar solicitud
  const handleVerifyOTP = async () => {
    console.log("🔐 Verificando OTP:", otp);
    console.log("🆔 UserId guardado:", userId);

    if (otp.length !== 4) {
      setOtpError("Ingresa el código de 4 dígitos");
      return;
    }

    if (!userId) {
      setOtpError("Error: No se encontró el ID de usuario. Intenta de nuevo.");
      setStep(1);
      return;
    }

    setIsLoading(true);
    setOtpError("");

    try {
      // 1. Verificar OTP
      console.log("📤 Enviando a verify-otp:", { userId, otp });
      const response = await authAPI.verifyOTP({
        userId: userId,
        otp: otp,
      });
      console.log("✅ OTP verificado - Respuesta:", response.data);

      const { token, user } = response.data;

      // 2. Guardar token y usuario
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      console.log("💾 Token y usuario guardados");

      // 2.1. Actualizar contexto de autenticación
      await authLogin(user);
      console.log("✅ Contexto de autenticación actualizado");

      // 2.5. Si hay vehículo en localStorage sin ID, guardarlo en BD
      // Esto aplica TANTO para registro nuevo COMO para login (usuario creó vehículo antes de autenticarse)
      if (
        vehicleData &&
        vehicleData.vehicleSnapshot &&
        !vehicleData.vehicleId
      ) {
        console.log("🚗 Guardando vehículo creado antes de autenticación...");
        console.log(
          "   📋 Snapshot COMPLETO:",
          JSON.stringify(vehicleData.vehicleSnapshot, null, 2)
        );
        console.log(
          "   🔍 Keys del snapshot:",
          Object.keys(vehicleData.vehicleSnapshot)
        );
        console.log(
          "   ❓ ¿Tiene truckData?:",
          vehicleData.vehicleSnapshot.truckData
        );
        console.log(
          "   ❓ ¿Tiene busData?:",
          vehicleData.vehicleSnapshot.busData
        );

        try {
          const { vehicleAPI } = await import("../services/vehicleAPI");
          const newVehiclePayload = {
            userId: user.id,
            category: vehicleData.vehicleSnapshot.category,
            brand: vehicleData.vehicleSnapshot.brand,
            model: vehicleData.vehicleSnapshot.model,
            licensePlate: vehicleData.vehicleSnapshot.licensePlate,
            year: vehicleData.vehicleSnapshot.year,
            color: vehicleData.vehicleSnapshot.color,
          };

          // Agregar campos específicos según categoría
          const categoryId = vehicleData.vehicleSnapshot.category?.id;
          if (["AUTOS", "CAMIONETAS", "ELECTRICOS"].includes(categoryId)) {
            newVehiclePayload.isArmored =
              vehicleData.vehicleSnapshot.isArmored || false;
          } else if (
            categoryId === "CAMIONES" &&
            vehicleData.vehicleSnapshot.truckData
          ) {
            // Filtrar solo propiedades con valor
            const validTruckData = Object.keys(
              vehicleData.vehicleSnapshot.truckData
            )
              .filter(
                (key) =>
                  vehicleData.vehicleSnapshot.truckData[key] != null &&
                  vehicleData.vehicleSnapshot.truckData[key] !== ""
              )
              .reduce((obj, key) => {
                obj[key] = vehicleData.vehicleSnapshot.truckData[key];
                return obj;
              }, {});

            if (Object.keys(validTruckData).length > 0) {
              newVehiclePayload.truckData = validTruckData;
            }
          } else if (
            categoryId === "BUSES" &&
            vehicleData.vehicleSnapshot.busData
          ) {
            // Filtrar solo propiedades con valor
            const validBusData = Object.keys(
              vehicleData.vehicleSnapshot.busData
            )
              .filter(
                (key) =>
                  vehicleData.vehicleSnapshot.busData[key] != null &&
                  vehicleData.vehicleSnapshot.busData[key] !== ""
              )
              .reduce((obj, key) => {
                obj[key] = vehicleData.vehicleSnapshot.busData[key];
                return obj;
              }, {});

            if (Object.keys(validBusData).length > 0) {
              newVehiclePayload.busData = validBusData;
            }
          }

          // VALIDAR payload antes de enviar
          console.log("📤 Payload INICIAL:");
          console.log(JSON.stringify(newVehiclePayload, null, 2));

          // Verificar que NO haya campos no deseados
          if (newVehiclePayload.truckData && categoryId !== "CAMIONES") {
            console.error(
              "⚠️ ERROR: truckData presente en vehículo que NO es camión"
            );
            delete newVehiclePayload.truckData;
            console.log("🧹 truckData eliminado del payload");
          }
          if (newVehiclePayload.busData && categoryId !== "BUSES") {
            console.error(
              "⚠️ ERROR: busData presente en vehículo que NO es bus"
            );
            delete newVehiclePayload.busData;
            console.log("🧹 busData eliminado del payload");
          }

          console.log("📤 Payload FINAL (después de validación):");
          console.log(JSON.stringify(newVehiclePayload, null, 2));
          console.log("🔍 Keys del payload:", Object.keys(newVehiclePayload));

          const vehicleResponse = await vehicleAPI.createVehicle(
            newVehiclePayload
          );
          const savedVehicleId =
            vehicleResponse.data.data?._id || vehicleResponse.data._id;
          console.log("✅ Vehículo guardado en BD con ID:", savedVehicleId);

          // Actualizar vehicleData con el ID real
          vehicleData.vehicleId = savedVehicleId;
          localStorage.setItem("vehicleData", JSON.stringify(vehicleData));

          // Refrescar vehículos en el contexto
          await refreshVehicles();
          console.log("✅ Lista de vehículos refrescada en contexto");

          showSuccess("✅ Vehículo guardado en tu garaje");
        } catch (vehicleError) {
          console.error("❌ Error guardando vehículo:", vehicleError);
          console.error("   Detalles:", vehicleError.response?.data);

          // Mostrar error específico al usuario
          const errorMsg =
            vehicleError.response?.data?.error ||
            "No se pudo guardar el vehículo";
          showError(
            `⚠️ ${errorMsg}. El servicio continuará pero el vehículo no se guardó.`
          );

          // Continuar con el flujo (no bloqueamos la solicitud)
        }
      }

      // 3. Verificar si hay datos de vehículo para crear solicitud
      if (
        !vehicleData ||
        !vehicleData.vehicleSnapshot ||
        !vehicleData.serviceDetails ||
        !vehicleData.serviceDetails.problem
      ) {
        console.log(
          "⚠️ No hay vehicleData completo - Login exitoso pero sin solicitud"
        );
        showSuccess("✅ Sesión iniciada correctamente");

        // Si hay routeData, volver al mapa para que complete el flujo
        if (routeData) {
          console.log(
            "🔄 Redirigiendo al mapa para completar datos del vehículo..."
          );
          await new Promise((resolve) => setTimeout(resolve, 100));
          history.replace("/tabs/desvare");
        } else {
          // Si no hay ruta, ir a home
          console.log("🔄 Redirigiendo a home...");
          history.replace("/tabs/desvare");
        }
        return;
      }

      // 4. Enviar solicitud a conductores
      console.log("🚀 Enviando solicitud a conductores...");
      await sendRequestToDrivers(user);

      // 5. Redirigir a WaitingQuotes
      console.log("🔄 Redirigiendo a /waiting-quotes...");
      await new Promise((resolve) => setTimeout(resolve, 100)); // Delay para sincronizar localStorage
      history.replace("/waiting-quotes");
    } catch (error) {
      console.error("❌ Error al verificar OTP:", error);
      const errorMsg =
        error.response?.data?.error || "Código inválido o expirado";
      setOtpError(errorMsg);
      setOtp(""); // Limpiar OTP
    } finally {
      setIsLoading(false);
    }
  };

  // Función para enviar solicitud a conductores (después de autenticar)
  const sendRequestToDrivers = async (user) => {
    try {
      console.log("📡 sendRequestToDrivers - Iniciando...");
      console.log("👤 Usuario:", user);
      console.log("🗺️ RouteData:", routeData);

      // 1. Verificar Socket.IO
      if (!socketService.isConnected()) {
        console.log("⚠️ Socket.IO no conectado, esperando...");
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // 2. Registrar cliente en Socket.IO
      console.log("👤 Registrando cliente en Socket.IO...");
      socketService.registerClient(user.id);

      // 3. Crear solicitud en BD
      console.log("📝 Creando solicitud en BD...");
      const requestData = {
        clientId: user.id,
        clientName: user.name,
        clientPhone: user.phone || "N/A",
        clientEmail: user.email || "N/A",
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
      };

      // 3.1. Agregar datos del vehículo si existen
      if (vehicleData) {
        console.log("🚗 Incluyendo datos del vehículo en la solicitud...");
        requestData.vehicleId = vehicleData.vehicleId || null;
        requestData.vehicleSnapshot = vehicleData.vehicleSnapshot;
        requestData.serviceDetails = vehicleData.serviceDetails;
      }

      console.log("📦 Request payload:", JSON.stringify(requestData, null, 2));

      const response = await requestAPI.createRequest(requestData);
      const requestId = response.data.requestId;
      console.log("✅ Solicitud creada en BD con ID:", requestId);

      // 4. Guardar requestId (usar 'currentRequestId' para consistencia)
      localStorage.setItem("currentRequestId", requestId);
      console.log("💾 RequestId guardado en localStorage:", requestId);

      // 5. Emitir evento Socket.IO a conductores
      console.log("📡 Emitiendo request:new via Socket.IO...");
      const socketData = {
        requestId: requestId,
        clientId: user.id,
        clientName: user.name,
        origin: {
          address: routeData.origin.address,
          lat: routeData.origin.lat,
          lng: routeData.origin.lng,
        },
        destination: {
          address: routeData.destination.address,
          lat: routeData.destination.lat,
          lng: routeData.destination.lng,
        },
        distance: routeData.routeInfo.distance,
        duration: routeData.routeInfo.duration,
      };

      // 5.1. Agregar datos del vehículo al Socket.IO si existen
      if (vehicleData) {
        console.log("🚗 Incluyendo datos del vehículo en Socket.IO...");
        socketData.vehicleSnapshot = vehicleData.vehicleSnapshot;
        socketData.serviceDetails = vehicleData.serviceDetails;
      }

      socketService.sendNewRequest(socketData);

      console.log("✅ sendRequestToDrivers completado exitosamente");
    } catch (error) {
      console.error("❌ Error en sendRequestToDrivers:", error);
      throw error;
    }
  };

  // Función para resetear el estado del modal
  const handleResetModal = () => {
    setAuthMode("login");
    setStep(1);
    setUserId(null);
    setLoginPhone("");
    setRegisterName("");
    setRegisterPhone("");
    setRegisterEmail("");
    setOtp("");
    setOtpError("");
  };

  const handleModalDismiss = () => {
    setIsModalOpen(false);
    handleResetModal(); // Resetear estado
    // Volver a request-service
    setTimeout(() => {
      history.goBack();
    }, 300);
  };

  if (!routeData) {
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
      {/* Mapa de fondo (desenfocado) */}
      <div className="auth-background-map">
        <MapPicker
          origin={routeData.origin}
          destination={routeData.destination}
          onRouteCalculated={() => {}}
        />
      </div>

      {/* Sheet Modal para autenticación */}
      <IonModal
        isOpen={isModalOpen}
        onDidDismiss={handleModalDismiss}
        breakpoints={[0, 0.6, 0.85, 1]}
        initialBreakpoint={0.85}
        handle={true}
        handleBehavior="cycle"
        className="request-auth-sheet-modal"
        backdropDismiss={true}
        canDismiss={true}
      >
        <IonContent className="auth-sheet-content">
          {/* Logo Desvare centrado */}
          <div className="auth-logo-container">
            <img src={logo} alt="Desvare" className="auth-logo" />
          </div>

          {/* Tabs: Registrarme / Ingresar usando IonSegment - Solo visible en paso 1 */}
          {step === 1 && (
            <IonSegment
              value={authMode}
              onIonChange={(e) => setAuthMode(e.detail.value)}
              disabled={isLoading}
              className="auth-segment"
              mode="ios"
            >
              <IonSegmentButton value="register">
                <IonLabel>Registrarme</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="login">
                <IonLabel>Ingresar</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          )}

          {/* PASO 1: Formulario */}
          {step === 1 && (
            <>
              {/* Título del formulario */}
              <h2 className="auth-form-title">
                {authMode === "register"
                  ? "Crea tu cuenta aquí"
                  : "Ingresa a tu cuenta"}
              </h2>

              {authMode === "register" ? (
                <div className="auth-form-content">
                  {/* Input Nombre */}
                  <div className="auth-input-group">
                    <div className="auth-input-icon">
                      <Profile size="24" color="#9CA3AF" />
                    </div>
                    <input
                      type="text"
                      placeholder="Como te llamas?"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      className="auth-input"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Input Teléfono */}
                  <div className="auth-input-group">
                    <div className="auth-input-icon">
                      <Call size="24" color="#9CA3AF" />
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="000 000 00 00"
                      value={formatPhone(registerPhone)}
                      onChange={(e) =>
                        handlePhoneInput(e.target.value, setRegisterPhone)
                      }
                      className="auth-input"
                      maxLength={13}
                      disabled={isLoading}
                    />
                  </div>

                  {/* Input Email */}
                  <div className="auth-input-group">
                    <div className="auth-input-icon">
                      <Sms size="24" color="#9CA3AF" />
                    </div>
                    <input
                      type="email"
                      placeholder="ejemplo@email.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      className="auth-input"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Términos y condiciones */}
                  <p className="auth-terms">
                    Al continuar aceptas tomar nuestros servicios con nuestros{" "}
                    <a href="/terms">términos y condiciones</a> y también que
                    tus datos estarán seguros bajo nuestra{" "}
                    <a href="/privacy">política de privacidad</a>
                  </p>

                  {/* Botón Registrarme */}
                  <button
                    className="auth-submit-button"
                    onClick={handleRegisterSubmit}
                    disabled={
                      isLoading || !registerName || registerPhone.length !== 10
                    }
                  >
                    {isLoading ? <IonSpinner name="crescent" /> : "Registrarme"}
                  </button>
                </div>
              ) : (
                <div className="auth-form-content">
                  {/* Input Teléfono */}
                  <div className="auth-input-group">
                    <div className="auth-input-icon">
                      <Call size="24" color="#9CA3AF" />
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="000 000 00 00"
                      value={formatPhone(loginPhone)}
                      onChange={(e) =>
                        handlePhoneInput(e.target.value, setLoginPhone)
                      }
                      className="auth-input"
                      maxLength={13}
                      disabled={isLoading}
                    />
                  </div>

                  <button
                    className="auth-submit-button"
                    onClick={handleLoginSubmit}
                    disabled={isLoading || loginPhone.length !== 10}
                  >
                    {isLoading ? (
                      <IonSpinner name="crescent" />
                    ) : (
                      "Validar número"
                    )}
                  </button>

                  <button
                    className="auth-secondary-button"
                    onClick={handleModalDismiss}
                    disabled={isLoading}
                  >
                    No puedo ingresar
                  </button>
                </div>
              )}
            </>
          )}

          {/* PASO 2: Verificación OTP */}
          {step === 2 && (
            <div className="auth-form-content">
              <div className="auth-form-content-inner">
                <div className="otp-icon-container">
                  <Lock size="48" color="#0055FF" variant="Bulk" />
                </div>

                <h3 className="otp-title">Ingresa el código</h3>
                <p className="otp-description">
                  A continuación debes ingresar el código de seguridad enviado a
                  tu número de celular{" "}
                  {formatPhone(
                    authMode === "login" ? loginPhone : registerPhone
                  )}
                </p>
              </div>
              {/* Input OTP personalizado (4 dígitos) */}
              <div className="otp-inputs-container">
                {[0, 1, 2, 3].map((index) => (
                  <input
                    key={index}
                    ref={(el) => (otpRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="otp-input-box"
                    value={otp[index] || ""}
                    onChange={(e) => handleOTPChange(index, e.target.value)}
                    onKeyDown={(e) => handleOTPKeyDown(index, e)}
                    disabled={isLoading}
                  />
                ))}
              </div>

              {otpError && (
                <IonText color="danger" className="otp-error">
                  <small>{otpError}</small>
                </IonText>
              )}

              <button
                className="auth-submit-button"
                onClick={handleVerifyOTP}
                disabled={isLoading || otp.length !== 4}
              >
                {isLoading ? <IonSpinner name="crescent" /> : "Validar código"}
              </button>

              <button
                className="auth-secondary-button"
                onClick={() => {
                  setStep(1);
                  setOtp("");
                  setOtpError("");
                }}
                disabled={isLoading}
              >
                Cancelar
              </button>
            </div>
          )}
        </IonContent>
      </IonModal>
    </IonPage>
  );
};

export default RequestAuth;
