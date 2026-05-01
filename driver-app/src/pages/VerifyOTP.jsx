import React, { useState, useRef, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonContent, IonSpinner, IonText } from '@ionic/react';
import { Lock, ArrowLeft } from 'iconsax-react';
import { authAPI } from '../services/api';
import './VerifyOTP.css';

/**
 * Verificación OTP + flujo post-OTP según otpPurpose:
 *
 *  NEW_DRIVER  → OTP → Nombre → Email (opcional) → Crear PIN → Confirmar PIN → navegar
 *  FORGOT_PIN  → OTP → Crear PIN → Confirmar PIN → navegar
 *  undefined   → OTP → navegar directo según status (legacy)
 */

const RESEND_SECONDS = 60;

const STEPS = {
  OTP: 'OTP',
  NAME: 'NAME',
  EMAIL: 'EMAIL',
  PIN_CREATE: 'PIN_CREATE',
  PIN_CONFIRM: 'PIN_CONFIRM',
};

const VerifyOTP = () => {
  const history = useHistory();

  const userId = localStorage.getItem('tempDriverId');
  const phone = localStorage.getItem('tempDriverPhone');
  const otpPurpose = localStorage.getItem('otpPurpose');

  const [step, setStep] = useState(STEPS.OTP);
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [newPin, setNewPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [verifiedUser, setVerifiedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  // Resend countdown
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const otpRefs = useRef([]);
  const newPinRefs = useRef([]);
  const confirmPinRefs = useRef([]);

  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return; }
    const timer = setInterval(() => setCountdown(p => p - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    if (!userId || !phone) {
      if (!verificationSuccess) history.replace('/login');
    }
  }, [userId, phone, history, verificationSuccess]);

  const formatPhone = (p) => {
    if (!p) return '';
    const c = p.replace(/\D/g, '');
    if (c.length <= 3) return c;
    if (c.length <= 6) return `${c.slice(0, 3)} ${c.slice(3)}`;
    if (c.length <= 8) return `${c.slice(0, 3)} ${c.slice(3, 6)} ${c.slice(6)}`;
    return `${c.slice(0, 3)} ${c.slice(3, 6)} ${c.slice(6, 8)} ${c.slice(8, 10)}`;
  };

  const clearTempStorage = () => {
    localStorage.removeItem('tempDriverId');
    localStorage.removeItem('tempDriverPhone');
    localStorage.removeItem('otpPurpose');
  };

  const navigateAfterAuth = (user) => {
    clearTempStorage();
    const status = user.driverProfile?.status;
    setTimeout(() => {
      if (status === 'pending_documents') history.replace('/complete-registration');
      else if (status === 'pending_review') history.replace('/under-review');
      else if (status === 'approved') history.replace('/permissions');
      else if (status === 'rejected') history.replace('/rejected');
      else history.replace('/permissions');
    }, 100);
  };

  // ─── Reenvío OTP ─────────────────────────────────────────────────────────────

  const handleResend = async () => {
    if (!phone) return;
    setResendLoading(true);
    setError('');
    try {
      await authAPI.loginDriverOTP({ phone });
      setOtp('');
      setCanResend(false);
      setCountdown(RESEND_SECONDS);
      otpRefs.current[0]?.focus();
    } catch {
      setError('No se pudo reenviar el código. Intenta de nuevo.');
    } finally {
      setResendLoading(false);
    }
  };

  // ─── OTP ────────────────────────────────────────────────────────────────────

  const handleOTPChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = otp.split('');
    next[index] = value;
    setOtp(next.join(''));
    setError('');
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOTPKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) { setError('Ingresa el código de 6 dígitos'); return; }
    if (!userId) { history.replace('/login'); return; }

    setIsLoading(true);
    setError('');
    try {
      const res = await authAPI.verifyDriverOTP({ userId, otp });
      const { token, user } = res.data;

      setVerificationSuccess(true);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setVerifiedUser(user);

      if (otpPurpose === 'NEW_DRIVER') {
        // Primero recopilar nombre y email antes de crear el PIN
        setStep(STEPS.NAME);
      } else if (otpPurpose === 'FORGOT_PIN') {
        // Directo a crear PIN
        setStep(STEPS.PIN_CREATE);
        setTimeout(() => newPinRefs.current[0]?.focus(), 100);
      } else {
        // Legacy: ir directo según status
        navigateAfterAuth(user);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Código inválido o expirado');
      setOtp('');
      otpRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Nombre ─────────────────────────────────────────────────────────────────

  const handleNameSubmit = () => {
    if (!name || name.trim().length < 3) {
      setError('Ingresa tu nombre completo (mínimo 3 caracteres)');
      return;
    }
    setError('');
    setStep(STEPS.EMAIL);
  };

  // ─── Email ───────────────────────────────────────────────────────────────────

  const handleEmailSubmit = async () => {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Ingresa un email válido');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      // Guardar nombre y email en el backend
      await authAPI.completeInitialRegistration({
        userId,
        name: name.trim(),
        email: email.trim() || undefined,
      });
      // Actualizar nombre en localStorage para que se muestre correctamente
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      storedUser.name = name.trim();
      if (email.trim()) storedUser.email = email.trim();
      localStorage.setItem('user', JSON.stringify(storedUser));
      setVerifiedUser(storedUser);

      setStep(STEPS.PIN_CREATE);
      setTimeout(() => newPinRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar tus datos. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── PIN inputs ──────────────────────────────────────────────────────────────

  const handlePinChange = (refs, pinState, setPinState, index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...pinState];
    next[index] = value;
    setPinState(next);
    setError('');
    if (value && index < 3) refs.current[index + 1]?.focus();
  };

  const handlePinKeyDown = (refs, pinState, index, e) => {
    if (e.key === 'Backspace' && !pinState[index] && index > 0) refs.current[index - 1]?.focus();
  };

  const handleConfirmPIN = () => {
    if (newPin.some(d => d === '')) { setError('Completa los 4 dígitos'); return; }
    setError('');
    setStep(STEPS.PIN_CONFIRM);
    setTimeout(() => confirmPinRefs.current[0]?.focus(), 100);
  };

  const handleSavePin = async () => {
    if (confirmPin.some(d => d === '')) { setError('Completa los 4 dígitos de confirmación'); return; }
    if (newPin.join('') !== confirmPin.join('')) {
      setError('Las claves no coinciden. Intenta de nuevo.');
      setConfirmPin(['', '', '', '']);
      setTimeout(() => confirmPinRefs.current[0]?.focus(), 50);
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await authAPI.setDriverPin({ userId, pin: newPin.join('') });
      navigateAfterAuth(verifiedUser);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar la clave. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Botón atrás ─────────────────────────────────────────────────────────────

  const handleBack = () => {
    setError('');
    if (step === STEPS.PIN_CONFIRM) {
      setConfirmPin(['', '', '', '']);
      setStep(STEPS.PIN_CREATE);
    } else if (step === STEPS.PIN_CREATE && otpPurpose === 'NEW_DRIVER') {
      setStep(STEPS.EMAIL);
    } else if (step === STEPS.EMAIL) {
      setStep(STEPS.NAME);
    } else if (step === STEPS.NAME) {
      setStep(STEPS.OTP);
    } else {
      clearTempStorage();
      history.goBack();
    }
  };

  // ─── Render helpers ──────────────────────────────────────────────────────────

  const renderPinBoxes = (refs, pinState, setPinState) => (
    <div className="verify-otp-inputs" style={{ gap: '16px', marginBottom: '24px' }}>
      {[0, 1, 2, 3].map((i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="password"
          inputMode="numeric"
          maxLength={1}
          className="verify-otp-input-box"
          style={{ width: '64px', height: '64px', fontSize: '24px', fontWeight: '700' }}
          value={pinState[i]}
          onChange={(e) =>
            handlePinChange(refs, pinState, setPinState, i, e.target.value.replace(/\D/g, '').slice(-1))
          }
          onKeyDown={(e) => handlePinKeyDown(refs, pinState, i, e)}
          disabled={isLoading}
          autoFocus={i === 0}
        />
      ))}
    </div>
  );

  // ─── Pantalla: Nombre ────────────────────────────────────────────────────────

  if (step === STEPS.NAME) {
    return (
      <IonPage>
        <IonContent className="verify-otp-content">
          <div className="verify-otp-container">
            <button className="verify-otp-back" onClick={handleBack} disabled={isLoading}>
              <ArrowLeft size="24" color="#374151" />
            </button>
            <div className="verify-otp-icon">
              <Lock size="64" color="white" variant="Bulk" />
            </div>
            <h1 className="verify-otp-title">¿Cómo te llamas?</h1>
            <p className="verify-otp-description">
              Así te reconocerán los clientes cuando acepten tu cotización.
            </p>
            <input
              type="text"
              className="verify-otp-text-input"
              placeholder="Nombre completo"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              disabled={isLoading}
              autoFocus
            />
            {error && (
              <IonText color="danger" className="verify-otp-error">
                <small>{error}</small>
              </IonText>
            )}
            <button
              className="verify-otp-button"
              onClick={handleNameSubmit}
              disabled={isLoading || name.trim().length < 3}
            >
              Continuar
            </button>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // ─── Pantalla: Email ─────────────────────────────────────────────────────────

  if (step === STEPS.EMAIL) {
    return (
      <IonPage>
        <IonContent className="verify-otp-content">
          <div className="verify-otp-container">
            <button className="verify-otp-back" onClick={handleBack} disabled={isLoading}>
              <ArrowLeft size="24" color="#374151" />
            </button>
            <div className="verify-otp-icon">
              <Lock size="64" color="white" variant="Bulk" />
            </div>
            <h1 className="verify-otp-title">Tu correo electrónico</h1>
            <p className="verify-otp-description">
              Es opcional, pero te ayudará a recuperar tu cuenta si lo necesitas.
            </p>
            <input
              type="email"
              className="verify-otp-text-input"
              placeholder="ejemplo@email.com (opcional)"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              disabled={isLoading}
              autoFocus
            />
            {error && (
              <IonText color="danger" className="verify-otp-error">
                <small>{error}</small>
              </IonText>
            )}
            <button
              className="verify-otp-button"
              onClick={handleEmailSubmit}
              disabled={isLoading}
            >
              {isLoading ? <IonSpinner name="crescent" /> : 'Continuar'}
            </button>
            <button
              className="resend-active-btn"
              onClick={handleEmailSubmit}
              disabled={isLoading}
              style={{ marginTop: '12px' }}
            >
              Omitir por ahora
            </button>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // ─── Pantalla: Crear PIN ─────────────────────────────────────────────────────

  if (step === STEPS.PIN_CREATE) {
    return (
      <IonPage>
        <IonContent className="verify-otp-content">
          <div className="verify-otp-container">
            <button className="verify-otp-back" onClick={handleBack} disabled={isLoading}>
              <ArrowLeft size="24" color="#374151" />
            </button>
            <div className="verify-otp-icon">
              <Lock size="64" color="white" variant="Bulk" />
            </div>
            <h1 className="verify-otp-title">Crea tu clave de acceso</h1>
            <p className="verify-otp-description">
              Elige 4 dígitos que recuerdes fácilmente. Los usarás cada vez que ingreses a la app.
            </p>
            {renderPinBoxes(newPinRefs, newPin, setNewPin)}
            {error && (
              <IonText color="danger" className="verify-otp-error">
                <small>{error}</small>
              </IonText>
            )}
            <button
              className="verify-otp-button"
              onClick={handleConfirmPIN}
              disabled={isLoading || newPin.some(d => d === '')}
            >
              Continuar
            </button>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // ─── Pantalla: Confirmar PIN ─────────────────────────────────────────────────

  if (step === STEPS.PIN_CONFIRM) {
    return (
      <IonPage>
        <IonContent className="verify-otp-content">
          <div className="verify-otp-container">
            <button className="verify-otp-back" onClick={handleBack} disabled={isLoading}>
              <ArrowLeft size="24" color="#374151" />
            </button>
            <div className="verify-otp-icon">
              <Lock size="64" color="white" variant="Bulk" />
            </div>
            <h1 className="verify-otp-title">Confirma tu clave</h1>
            <p className="verify-otp-description">
              Ingresa los mismos 4 dígitos para confirmar.
            </p>
            {renderPinBoxes(confirmPinRefs, confirmPin, setConfirmPin)}
            {error && (
              <IonText color="danger" className="verify-otp-error">
                <small>{error}</small>
              </IonText>
            )}
            <button
              className="verify-otp-button"
              onClick={handleSavePin}
              disabled={isLoading || confirmPin.some(d => d === '')}
            >
              {isLoading ? <IonSpinner name="crescent" /> : 'Guardar clave'}
            </button>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // ─── Pantalla: OTP (default) ─────────────────────────────────────────────────

  return (
    <IonPage>
      <IonContent className="verify-otp-content">
        <div className="verify-otp-container">
          <button className="verify-otp-back" onClick={handleBack} disabled={isLoading}>
            <ArrowLeft size="24" color="#374151" />
          </button>

          <div className="verify-otp-icon">
            <Lock size="64" color="white" variant="Bulk" />
          </div>

          <h1 className="verify-otp-title">Verifica tu número</h1>
          <p className="verify-otp-description">
            Ingresa el código de 6 dígitos que enviamos al{' '}
            <strong>{formatPhone(phone)}</strong>
          </p>

          <div className="verify-otp-inputs">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <input
                key={index}
                ref={(el) => (otpRefs.current[index] = el)}
                type="number"
                inputMode="numeric"
                min="0"
                max="9"
                step="1"
                className="verify-otp-input-box"
                value={otp[index] || ''}
                onChange={(e) => {
                  const digit = e.target.value.replace(/\D/g, '').slice(-1);
                  handleOTPChange(index, digit);
                }}
                onKeyDown={(e) => handleOTPKeyDown(index, e)}
                disabled={isLoading}
                autoFocus={index === 0}
              />
            ))}
          </div>

          {error && (
            <IonText color="danger" className="verify-otp-error">
              <small>{error}</small>
            </IonText>
          )}

          <button
            className="verify-otp-button"
            onClick={handleVerifyOTP}
            disabled={isLoading || otp.length !== 6}
          >
            {isLoading ? <IonSpinner name="crescent" /> : 'Verificar código'}
          </button>

          <div className="verify-otp-resend">
            {canResend ? (
              <button
                className="resend-active-btn"
                onClick={handleResend}
                disabled={resendLoading}
              >
                {resendLoading
                  ? <IonSpinner name="crescent" className="resend-spinner" />
                  : '¿No recibiste el código? Reenviar'}
              </button>
            ) : (
              <p className="resend-countdown">
                Reenviar código en{' '}
                <strong>0:{String(countdown).padStart(2, '0')}</strong>
              </p>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default VerifyOTP;
