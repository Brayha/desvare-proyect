import React, { useState, useEffect } from "react";
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

const RESEND_SECONDS = 60;

const AuthModal = ({ isOpen, onDismiss, onSuccess }) => {
  const { showSuccess, showError } = useToast();
  const { login: authLogin } = useAuth();

  const [authMode, setAuthMode] = useState("login");
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Formulario de login
  const [loginPhone, setLoginPhone] = useState("");

  // Formulario de registro
  const [registerName, setRegisterName] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");

  // OTP (input único)
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  // Reenvío de código
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // Resetear contador al llegar al paso 2
  useEffect(() => {
    if (step === 2) {
      setCountdown(RESEND_SECONDS);
      setCanResend(false);
    }
  }, [step]);

  // Contador regresivo
  useEffect(() => {
    if (step !== 2) return;
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown, step]);

  // Función para formatear teléfono
  const formatPhone = (phone) => {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    if (cleaned.length <= 8) return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
  };

  const handlePhoneInput = (value, setter) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 10);
    setter(cleaned);
  };

  const handleOTPChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(val);
    setOtpError("");
  };

  const handleLoginSubmit = async () => {
    if (!loginPhone || loginPhone.length !== 10) {
      showError("Ingresa un número de teléfono válido");
      return;
    }
    setIsLoading(true);
    try {
      const response = await authAPI.loginOTP({ phone: loginPhone });
      setUserId(response.data.userId);
      setStep(2);
      showSuccess("Te enviamos un código de verificación");
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Error al iniciar sesión";
      showError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async () => {
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
      setUserId(response.data.userId);
      setStep(2);
      showSuccess("Te enviamos un código de verificación");
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Error al registrarte";
      if (errorMsg.includes("ya está registrado")) {
        showError('Este número ya está registrado. Usa "Iniciar Sesión" en su lugar.');
      } else {
        showError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
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
      const response = await authAPI.verifyOTP({ userId, otp });
      const { token, user } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      await authLogin(user);
      if (onSuccess) onSuccess(user);
      handleResetModal();
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Código inválido o expirado";
      setOtpError(errorMsg);
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setOtpError("");
    try {
      if (authMode === "login") {
        await authAPI.loginOTP({ phone: loginPhone });
      } else {
        await authAPI.registerOTP({
          name: registerName,
          phone: registerPhone,
          email: registerEmail || undefined,
        });
      }
      setOtp("");
      setCanResend(false);
      setCountdown(RESEND_SECONDS);
      showSuccess("Nuevo código enviado");
    } catch {
      setOtpError("No se pudo reenviar el código. Intenta de nuevo.");
    } finally {
      setResendLoading(false);
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
    if (onDismiss) onDismiss();
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
        {/* Logo */}
        <div className="auth-logo-container">
          <img src={logo} alt="Desvare" className="auth-logo" />
        </div>

        {/* Tabs — solo en paso 1 */}
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
            <h2 className="auth-form-title">
              {authMode === "register" ? "Crea tu cuenta aquí" : "Ingresa a tu cuenta"}
            </h2>

            {authMode === "register" ? (
              <div className="auth-form-content">
                <div className="auth-input-group">
                  <div className="auth-input-icon"><Profile size="24" color="#9CA3AF" /></div>
                  <input type="text" placeholder="Como te llamas?" value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)} className="auth-input" disabled={isLoading} />
                </div>
                <div className="auth-input-group">
                  <div className="auth-input-icon"><Call size="24" color="#9CA3AF" /></div>
                  <input type="tel" inputMode="numeric" placeholder="000 000 00 00"
                    value={formatPhone(registerPhone)}
                    onChange={(e) => handlePhoneInput(e.target.value, setRegisterPhone)}
                    className="auth-input" maxLength={13} disabled={isLoading} />
                </div>
                <div className="auth-input-group">
                  <div className="auth-input-icon"><Sms size="24" color="#9CA3AF" /></div>
                  <input type="email" placeholder="ejemplo@email.com" value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)} className="auth-input" disabled={isLoading} />
                </div>
                <p className="auth-terms">
                  Al continuar aceptas tomar nuestros servicios con nuestros{" "}
                  <a href="/terms">términos y condiciones</a> y también que tus datos estarán
                  seguros bajo nuestra <a href="/privacy">política de privacidad</a>
                </p>
                <button className="auth-submit-button" onClick={handleRegisterSubmit}
                  disabled={isLoading || !registerName || registerPhone.length !== 10}>
                  {isLoading ? <IonSpinner name="crescent" /> : "Registrarme"}
                </button>
              </div>
            ) : (
              <div className="auth-form-content">
                <div className="auth-input-group">
                  <div className="auth-input-icon"><Call size="24" color="#9CA3AF" /></div>
                  <input type="tel" inputMode="numeric" placeholder="000 000 00 00"
                    value={formatPhone(loginPhone)}
                    onChange={(e) => handlePhoneInput(e.target.value, setLoginPhone)}
                    className="auth-input" maxLength={13} disabled={isLoading} />
                </div>
                <button className="auth-submit-button" onClick={handleLoginSubmit}
                  disabled={isLoading || loginPhone.length !== 10}>
                  {isLoading ? <IonSpinner name="crescent" /> : "Validar número"}
                </button>
                <button className="auth-secondary-button" onClick={handleDismiss} disabled={isLoading}>
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
                Código de seguridad enviado a{" "}
                <strong>{formatPhone(authMode === "login" ? loginPhone : registerPhone)}</strong>
              </p>
            </div>

            {/* Input único de 6 dígitos */}
            <div className="otp-single-wrap">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                className={`otp-single-input${otp.length === 6 ? " otp-single-complete" : ""}`}
                value={otp}
                onChange={handleOTPChange}
                disabled={isLoading}
                autoFocus
                placeholder="000000"
              />
            </div>

            {otpError && (
              <IonText color="danger" className="otp-error">
                <small>{otpError}</small>
              </IonText>
            )}

            <button className="auth-submit-button" onClick={handleVerifyOTP}
              disabled={isLoading || otp.length !== 6}>
              {isLoading ? <IonSpinner name="crescent" /> : "Validar código"}
            </button>

            {/* Contador / reenvío */}
            <div className="otp-resend-container">
              {canResend ? (
                <button className="otp-resend-btn" onClick={handleResend} disabled={resendLoading}>
                  {resendLoading
                    ? <IonSpinner name="crescent" className="otp-resend-spinner" />
                    : "¿No recibiste el código? Reenviar"}
                </button>
              ) : (
                <p className="otp-resend-countdown">
                  Reenviar código en{" "}
                  <strong>0:{String(countdown).padStart(2, "0")}</strong>
                </p>
              )}
            </div>

            <button className="auth-secondary-button"
              onClick={() => { setStep(1); setOtp(""); setOtpError(""); }}
              disabled={isLoading || resendLoading}>
              Cancelar
            </button>
          </div>
        )}
      </IonContent>
    </IonModal>
  );
};

export default AuthModal;
