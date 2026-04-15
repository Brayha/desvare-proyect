import React, { useState, useRef } from "react";
import {
  IonModal,
  IonContent,
  IonText,
  IonSpinner,
  IonSegment,
  IonSegmentButton,
  IonLabel,
} from "@ionic/react";
import { Profile, Call, Sms, Lock } from "iconsax-react";
import { authAPI } from "../../services/api";
import { useToast } from "@hooks/useToast";
import { useAuth } from "../../contexts/AuthContext";
import "./AuthModal.css";
import logo from "../../assets/img/Desvare.svg";

const AuthModal = ({ isOpen, onDismiss, onSuccess }) => {
  const { showSuccess, showError } = useToast();
  const { login: authLogin } = useAuth();

  const [authMode, setAuthMode] = useState("login"); // "login" o "register"
  const [step, setStep] = useState(1); // 1: formulario, 2: OTP
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Formulario de login
  const [loginPhone, setLoginPhone] = useState("");

  // Formulario de registro
  const [registerName, setRegisterName] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");

  // OTP
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  // Refs para OTP inputs
  const otpRefs = useRef([]);

  // Función para formatear teléfono
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
    if (!/^\d*$/.test(value)) return;

    const newOtp = otp.split("");
    newOtp[index] = value;
    setOtp(newOtp.join(""));
    setOtpError("");

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

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
      setStep(2);
      showSuccess("Te enviamos un código de verificación");
    } catch (error) {
      console.error("❌ Error en login OTP:", error);
      const errorMsg = error.response?.data?.error || "Error al iniciar sesión";
      showError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

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
      setStep(2);
      showSuccess("Te enviamos un código de verificación");
    } catch (error) {
      console.error("❌ Error en registro OTP:", error);
      const errorMsg = error.response?.data?.error || "Error al registrarte";

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

  const handleVerifyOTP = async () => {
    console.log("🔐 Verificando OTP:", otp);

    if (otp.length !== 6) {
      setOtpError("Ingresa el código de 6 dígitos");
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
      const response = await authAPI.verifyOTP({
        userId: userId,
        otp: otp,
      });
      console.log("✅ OTP verificado - Respuesta:", response.data);

      const { token, user } = response.data;

      // Guardar token y usuario en localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      console.log("💾 Token y usuario guardados en localStorage");

      // CRÍTICO: Actualizar AuthContext para que toda la app lo detecte
      await authLogin(user);
      console.log("✅ AuthContext actualizado - Usuario logueado globalmente");

      // Llamar al callback de éxito (para UI específica)
      if (onSuccess) {
        onSuccess(user);
      }

      // Resetear el modal
      handleResetModal();
    } catch (error) {
      console.error("❌ Error al verificar OTP:", error);
      const errorMsg =
        error.response?.data?.error || "Código inválido o expirado";
      setOtpError(errorMsg);
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleDismiss = () => {
    handleResetModal();
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={handleDismiss}
      className="auth-modal-modern"
      breakpoints={[0, 0.6, 0.85, 1]}
      initialBreakpoint={0.85}
      handle={true}
      handleBehavior="cycle"
      backdropDismiss={true}
      canDismiss={true}
    >
      <IonContent className="auth-modal-content">
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
                  <a href="/terms">términos y condiciones</a> y también que tus
                  datos estarán seguros bajo nuestra{" "}
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
                  onClick={handleDismiss}
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
                {formatPhone(authMode === "login" ? loginPhone : registerPhone)}
              </p>
            </div>

            {/* Input OTP personalizado (6 dígitos) */}
            <div className="otp-inputs-container">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <input
                  key={index}
                  ref={(el) => (otpRefs.current[index] = el)}
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="9"
                  step="1"
                  className="otp-input-box"
                  value={otp[index] || ""}
                  onChange={(e) => {
                    const digit = e.target.value.replace(/\D/g, '').slice(-1);
                    handleOTPChange(index, digit);
                  }}
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
              disabled={isLoading || otp.length !== 6}
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
  );
};

export default AuthModal;
