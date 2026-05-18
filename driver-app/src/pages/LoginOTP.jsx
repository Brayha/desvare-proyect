import React, { useState, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonContent, IonSpinner, IonText } from '@ionic/react';
import { authAPI } from '../services/api';
import { PhoneInput } from '../components/PhoneInput/PhoneInput';
import DesvareLogoWhite from '../assets/img/Desvare.svg';
import './LoginOTP.css';

/**
 * Flujo unificado de autenticación para conductores.
 *
 * PASO 1 — Ingresa número de celular
 *   check-phone al backend
 *     ↓ conductor existe + tiene PIN  → PASO 2: ingresar PIN de 4 dígitos
 *     ↓ conductor nuevo               → OTP para verificar teléfono → /verify-otp (NEW_DRIVER)
 *     ↓ "Olvidé mi clave"            → OTP para recuperar          → /verify-otp (FORGOT_PIN)
 */

const LoginOTP = () => {
  const history = useHistory();

  const [phone, setPhone] = useState('');
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const pinRefs = useRef([]);

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const navigateAfterAuth = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    const status = user.driverProfile?.status;
    if (status === 'pending_documents') history.replace('/complete-registration');
    else if (status === 'pending_review') history.replace('/under-review');
    else if (status === 'approved') history.replace('/permissions');
    else if (status === 'rejected') history.replace('/rejected');
    else history.replace('/permissions');
  };

  // ─── Paso PHONE ────────────────────────────────────────────────────────────

  const handlePhoneSubmit = async () => {
    if (phone.length !== 10) {
      setError('Ingresa un número válido de 10 dígitos');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const res = await authAPI.checkPhone({ phone });
      const data = res.data;

      if (!data.exists) {
        // Conductor nuevo: verificar teléfono por OTP primero
        const otpRes = await authAPI.registerDriverInitial({ phone });
        localStorage.setItem('tempDriverId', otpRes.data.userId);
        localStorage.setItem('tempDriverPhone', phone);
        localStorage.setItem('otpPurpose', 'NEW_DRIVER');
        history.push('/verify-otp');
      } else if (data.hasPIN) {
        // Conductor existente con PIN → mostrar cajas de PIN
        setUserId(data.userId);
        setUserName(data.name);
        setPin(['', '', '', '']);
        setShowPin(true);
        setTimeout(() => pinRefs.current[0]?.focus(), 100);
      } else {
        // No debería ocurrir (todos los conductores nuevos crearán PIN en el registro)
        // Por seguridad, si existe sin PIN, enviar OTP para crear uno
        const otpRes = await authAPI.loginDriverOTP({ phone });
        localStorage.setItem('tempDriverId', otpRes.data.userId || data.userId);
        localStorage.setItem('tempDriverPhone', phone);
        localStorage.setItem('otpPurpose', 'FORGOT_PIN');
        history.push('/verify-otp');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al verificar el número. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Paso PIN_LOGIN ─────────────────────────────────────────────────────────

  const handlePinChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError('');
    if (value && index < 3) {
      pinRefs.current[index + 1]?.focus();
    }
    // Auto-submit cuando se completan los 4 dígitos
    if (newPin.every(d => d !== '') && value) {
      handlePinLogin(newPin.join(''));
    }
  };

  const handlePinKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
  };

  const handlePinLogin = async (pinValue) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await authAPI.loginDriverPin({ userId, pin: pinValue });
      navigateAfterAuth(res.data.token, res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'PIN incorrecto. Intenta de nuevo.');
      setPin(['', '', '', '']);
      setTimeout(() => pinRefs.current[0]?.focus(), 50);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPin = async () => {
    setIsLoading(true);
    setError('');
    try {
      await authAPI.loginDriverOTP({ phone });
      localStorage.setItem('tempDriverId', userId);
      localStorage.setItem('tempDriverPhone', phone);
      localStorage.setItem('otpPurpose', 'FORGOT_PIN');
      history.push('/verify-otp');
    } catch (err) {
      setError('No se pudo enviar el código. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setShowPin(false);
    setPin(['', '', '', '']);
    setError('');
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <IonPage>
      <IonContent className="login-otp-content">
        <div className="login-otp-container">

          {/* Header */}
          <div className="driver-auth-header">
            {showPin && (
              <button className="driver-auth-back" onClick={handleBackToPhone} disabled={isLoading}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
            <img src={DesvareLogoWhite} alt="Desvare" className="driver-auth-logo" />
          </div>

          {/* Pantalla: ingresar teléfono */}
          {!showPin && (
            <>
              <h1 className="login-otp-title">Ingresa tu número celular</h1>
              <p className="login-otp-subtitle">
                Si ya tienes cuenta ingresarás con tu clave. Si es tu primera vez, te registraremos.
              </p>
              <div className="login-otp-form">
                <PhoneInput value={phone} onChange={setPhone} disabled={isLoading} />
                {error && (
                  <IonText color="danger" className="login-otp-error">
                    <small>{error}</small>
                  </IonText>
                )}
                <button
                  className="login-otp-button"
                  onClick={handlePhoneSubmit}
                  disabled={isLoading || phone.length !== 10}
                >
                  {isLoading ? <IonSpinner name="crescent" /> : 'Continuar'}
                </button>
              </div>
            </>
          )}

          {/* Pantalla: ingresar PIN */}
          {showPin && (
            <>
              <h1 className="login-otp-title">
                Hola, {userName.split(' ')[0]}
              </h1>
              <p className="login-otp-subtitle">
                Ingresa tu clave de 4 dígitos para acceder a tu cuenta.
              </p>
              <div className="login-otp-form">
                <div className="driver-pin-boxes">
                  {[0, 1, 2, 3].map((i) => (
                    <input
                      key={i}
                      ref={(el) => (pinRefs.current[i] = el)}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      className="driver-pin-box"
                      value={pin[i]}
                      onChange={(e) =>
                        handlePinChange(i, e.target.value.replace(/\D/g, '').slice(-1))
                      }
                      onKeyDown={(e) => handlePinKeyDown(i, e)}
                      disabled={isLoading}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                {isLoading && (
                  <div className="driver-pin-loading">
                    <IonSpinner name="crescent" />
                    <span>Verificando...</span>
                  </div>
                )}

                {error && (
                  <IonText color="danger" className="login-otp-error">
                    <small>{error}</small>
                  </IonText>
                )}

                <div className="login-otp-footer">
                  <button
                    className="login-otp-link"
                    onClick={handleForgotPin}
                    disabled={isLoading}
                  >
                    ¿Olvidaste tu clave?
                  </button>
                </div>
              </div>
            </>
          )}

        </div>
      </IonContent>
    </IonPage>
  );
};

export default LoginOTP;
