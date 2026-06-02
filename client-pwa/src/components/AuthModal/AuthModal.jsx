import React, { useState, useRef, useEffect } from 'react';
import { IonModal, IonContent, IonSpinner } from '@ionic/react';
import { Call, Lock, Profile, Sms, Message } from 'iconsax-react';
import { authAPI } from '../../services/api';
import { useToast } from '@hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';
import './AuthModal.css';
import logo from '../../assets/img/Desvare.svg';

// ─── Constantes de pasos y propósito ─────────────────────────────────────────

const S = {
  PHONE:        'phone',
  PIN_LOGIN:    'pin-login',
  OTP_SENT:     'otp-sent',
  OTP_FORGOT:   'otp-forgot',
  REG_NAME:     'reg-name',
  REG_EMAIL:    'reg-email',
  PIN_CREATE:   'pin-create',
  PIN_CONFIRM:  'pin-confirm',
};

const PURPOSE = {
  NEW_REGISTER:    'new-register',
  EXISTING_SETUP:  'existing-setup',
  FORGOT_PIN:      'forgot-pin',
};

// ─── Componente ──────────────────────────────────────────────────────────────

const AuthModal = ({ isOpen, onDismiss, onSuccess }) => {
  const { login: authLogin } = useAuth();
  const { showSuccess, showError } = useToast();

  // Pasos y propósito
  const [step, setStep] = useState(S.PHONE);
  const [otpPurpose, setOtpPurpose] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Datos de sesión intermedios
  const [phone, setPhone]                   = useState('');
  const [userId, setUserId]                 = useState(null);
  const [existingUserName, setExistingUserName] = useState('');

  // Formulario de registro
  const [userName, setUserName]   = useState('');
  const [userEmail, setUserEmail] = useState('');

  // PIN (arrays de 4 posiciones para evitar problemas con sparse strings)
  const [pin, setPin]               = useState(['', '', '', '']);
  const [pinConfirm, setPinConfirm] = useState(['', '', '', '']);

  // OTP (string de 6 dígitos)
  const [otp, setOtp] = useState('');

  // Errores
  const [phoneError, setPhoneError] = useState('');
  const [pinError, setPinError]     = useState('');
  const [otpError, setOtpError]     = useState('');

  // Cooldown para reenvío OTP
  const [resendCooldown, setResendCooldown] = useState(0);
  const resendTimer = useRef(null);

  // Refs para inputs
  const otpRefs        = useRef([]);
  const pinRefs        = useRef([]);
  const pinConfirmRefs = useRef([]);

  // ─── Cooldown ──────────────────────────────────────────────────────────────

  const startCooldown = (secs = 60) => {
    setResendCooldown(secs);
    if (resendTimer.current) clearInterval(resendTimer.current);
    resendTimer.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(resendTimer.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => () => { if (resendTimer.current) clearInterval(resendTimer.current); }, []);

  // ─── Reset ─────────────────────────────────────────────────────────────────

  const handleReset = () => {
    setStep(S.PHONE);
    setOtpPurpose(null);
    setIsLoading(false);
    setPhone('');
    setUserId(null);
    setExistingUserName('');
    setUserName('');
    setUserEmail('');
    setPin(['', '', '', '']);
    setPinConfirm(['', '', '', '']);
    setOtp('');
    setPhoneError('');
    setPinError('');
    setOtpError('');
    setResendCooldown(0);
    if (resendTimer.current) clearInterval(resendTimer.current);
  };

  const handleDismiss = () => {
    handleReset();
    if (onDismiss) onDismiss();
  };

  // ─── Finalizar autenticación ───────────────────────────────────────────────

  const authFinalize = async (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    await authLogin(user);
    if (onSuccess) onSuccess(user);
    handleReset();
  };

  // ─── Helpers de formato ────────────────────────────────────────────────────

  const formatPhone = (raw) => {
    if (!raw) return '';
    const c = raw.replace(/\D/g, '');
    if (c.length <= 3) return c;
    if (c.length <= 6) return `${c.slice(0, 3)} ${c.slice(3)}`;
    if (c.length <= 8) return `${c.slice(0, 3)} ${c.slice(3, 6)} ${c.slice(6)}`;
    return `${c.slice(0, 3)} ${c.slice(3, 6)} ${c.slice(6, 8)} ${c.slice(8, 10)}`;
  };

  const pinString = (arr) => arr.join('');
  const isPinFull  = (arr) => arr.every(d => d !== '');

  // ─── Handlers de OTP (6 dígitos) ──────────────────────────────────────────

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const digit = value.slice(-1);
    const arr = otp.split('');
    arr[index] = digit;
    setOtp(arr.join(''));
    setOtpError('');
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // ─── Handlers de PIN (4 dígitos, array) ───────────────────────────────────

  const makePinHandlers = (getter, setter, refs) => ({
    onChange: (index, value) => {
      const digit = value.replace(/\D/g, '').slice(-1);
      const next = [...getter];
      next[index] = digit;
      setter(next);
      setPinError('');
      if (digit && index < 3) refs.current[index + 1]?.focus();
    },
    onKeyDown: (index, e) => {
      if (e.key === 'Backspace' && !getter[index] && index > 0) {
        refs.current[index - 1]?.focus();
      }
    },
  });

  const pinHandlers        = makePinHandlers(pin, setPin, pinRefs);
  const pinConfirmHandlers = makePinHandlers(pinConfirm, setPinConfirm, pinConfirmRefs);

  // ─── STEP: phone → check-phone ────────────────────────────────────────────

  const handlePhoneSubmit = async () => {
    const clean = phone.replace(/\D/g, '');
    if (!clean || clean.length !== 10) {
      setPhoneError('Ingresa un número celular válido de 10 dígitos');
      return;
    }
    setIsLoading(true);
    setPhoneError('');
    try {
      const res = await authAPI.checkPhone({ phone: clean });
      const { exists, userId: uid, name, hasPIN } = res.data;

      if (exists) {
        setUserId(uid);
        setExistingUserName(name || '');
        if (hasPIN) {
          setPin(['', '', '', '']);
          setStep(S.PIN_LOGIN);
        } else {
          // Usuario existente sin PIN → enviar OTP para configurarlo
          await authAPI.loginOTP({ phone: clean });
          setOtpPurpose(PURPOSE.EXISTING_SETUP);
          setOtp('');
          startCooldown();
          setStep(S.OTP_SENT);
          showSuccess('Enviamos un código para activar tu clave de acceso');
        }
      } else {
        // Usuario nuevo → registrar con OTP
        const regRes = await authAPI.registerOTP({ phone: clean });
        setUserId(regRes.data.userId);
        setOtpPurpose(PURPOSE.NEW_REGISTER);
        setOtp('');
        startCooldown();
        setStep(S.OTP_SENT);
        showSuccess('Te enviamos un código de verificación por SMS');
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al verificar el número. Intenta de nuevo.';
      setPhoneError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── STEP: pin-login → login-pin ──────────────────────────────────────────

  const handlePinLogin = async () => {
    if (!isPinFull(pin)) {
      setPinError('Ingresa tu clave de 4 dígitos');
      return;
    }
    setIsLoading(true);
    setPinError('');
    try {
      const res = await authAPI.loginPin({ userId, pin: pinString(pin) });
      await authFinalize(res.data.token, res.data.user);
    } catch (err) {
      const msg = err.response?.data?.error || 'Clave incorrecta. Inténtalo de nuevo.';
      setPinError(msg);
      setPin(['', '', '', '']);
      setTimeout(() => pinRefs.current[0]?.focus(), 50);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── STEP: pin-login → "¿Olvidaste?" → OTP ────────────────────────────────

  const handleForgotPin = async () => {
    setIsLoading(true);
    try {
      const clean = phone.replace(/\D/g, '');
      await authAPI.loginOTP({ phone: clean });
      setOtpPurpose(PURPOSE.FORGOT_PIN);
      setOtp('');
      setOtpError('');
      startCooldown();
      setStep(S.OTP_FORGOT);
      showSuccess('Enviamos un código de recuperación a tu celular');
    } catch {
      showError('No se pudo enviar el código. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── STEP: otp → verify-otp ───────────────────────────────────────────────

  const handleOtpVerify = async () => {
    if (otp.length !== 6) {
      setOtpError('Ingresa el código completo de 6 dígitos');
      return;
    }
    if (!userId) {
      setOtpError('Error de sesión. Recarga la página e intenta de nuevo.');
      return;
    }
    setIsLoading(true);
    setOtpError('');
    try {
      await authAPI.verifyOTP({ userId, otp });

      if (otpPurpose === PURPOSE.NEW_REGISTER) {
        setStep(S.REG_NAME);
      } else {
        // EXISTING_SETUP o FORGOT_PIN → ir directo a crear PIN
        setPin(['', '', '', '']);
        setStep(S.PIN_CREATE);
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Código inválido o expirado. Solicita uno nuevo.';
      setOtpError(msg);
      setOtp('');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Reenviar OTP ─────────────────────────────────────────────────────────

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setIsLoading(true);
    try {
      const clean = phone.replace(/\D/g, '');
      await authAPI.loginOTP({ phone: clean });
      setOtp('');
      setOtpError('');
      startCooldown();
      showSuccess('Código reenviado correctamente');
    } catch {
      showError('No se pudo reenviar. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── STEP: pin-create → pin-confirm ───────────────────────────────────────

  const handlePinCreate = () => {
    if (!isPinFull(pin)) {
      setPinError('Ingresa tu clave de 4 dígitos');
      return;
    }
    setPinError('');
    setPinConfirm(['', '', '', '']);
    setStep(S.PIN_CONFIRM);
    setTimeout(() => pinConfirmRefs.current[0]?.focus(), 100);
  };

  // ─── STEP: pin-confirm → finalizar ────────────────────────────────────────

  const handlePinConfirm = async () => {
    if (!isPinFull(pinConfirm)) {
      setPinError('Confirma tu clave de 4 dígitos');
      return;
    }
    if (pinString(pin) !== pinString(pinConfirm)) {
      setPinError('Las claves no coinciden. Intenta de nuevo.');
      setPinConfirm(['', '', '', '']);
      setTimeout(() => pinConfirmRefs.current[0]?.focus(), 50);
      return;
    }
    setIsLoading(true);
    setPinError('');
    try {
      let token, user;
      if (otpPurpose === PURPOSE.NEW_REGISTER) {
        const res = await authAPI.completeRegistration({
          userId,
          name: userName.trim(),
          email: userEmail.trim() || undefined,
          pin: pinString(pin),
        });
        token = res.data.token;
        user  = res.data.user;
      } else {
        // EXISTING_SETUP o FORGOT_PIN
        const res = await authAPI.setPin({ userId, pin: pinString(pin) });
        token = res.data.token;
        user  = res.data.user;
      }
      await authFinalize(token, user);
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al guardar la clave. Intenta de nuevo.';
      setPinError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Render helpers ───────────────────────────────────────────────────────

  const renderPinBoxes = (digits, handlers, refs) => (
    <div className="am-pin-boxes">
      {[0, 1, 2, 3].map(i => (
        <input
          key={i}
          ref={el => (refs.current[i] = el)}
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          className={`am-pin-box ${digits[i] ? 'am-pin-box--filled' : ''}`}
          value={digits[i]}
          onChange={e => handlers.onChange(i, e.target.value)}
          onKeyDown={e => handlers.onKeyDown(i, e)}
          maxLength={1}
          disabled={isLoading}
          autoComplete="off"
        />
      ))}
    </div>
  );

  const renderOtpBoxes = () => (
    <div className="am-otp-boxes">
      {[0, 1, 2, 3, 4, 5].map(i => (
        <input
          key={i}
          ref={el => (otpRefs.current[i] = el)}
          type="number"
          inputMode="numeric"
          min="0"
          max="9"
          className="am-otp-box"
          value={otp[i] || ''}
          onChange={e => handleOtpChange(i, e.target.value.replace(/\D/g, '').slice(-1))}
          onKeyDown={e => handleOtpKeyDown(i, e)}
          disabled={isLoading}
        />
      ))}
    </div>
  );

  // Indicador de progreso (solo flujo de usuario nuevo)
  const progressInfo = {
    [S.OTP_SENT]:   otpPurpose === PURPOSE.NEW_REGISTER ? { step: 1, total: 4 } : null,
    [S.REG_NAME]:   { step: 2, total: 4 },
    [S.REG_EMAIL]:  { step: 3, total: 4 },
    [S.PIN_CREATE]: otpPurpose === PURPOSE.NEW_REGISTER ? { step: 4, total: 4 } : null,
    [S.PIN_CONFIRM]:otpPurpose === PURPOSE.NEW_REGISTER ? { step: 4, total: 4 } : null,
  };
  const progress = progressInfo[step] ?? null;

  const firstName = existingUserName ? existingUserName.split(' ')[0] : '';

  // ─── Render ───────────────────────────────────────────────────────────────

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
        <div className="am-logo-container">
          <img src={logo} alt="Desvare" className="am-logo" />
        </div>

        {/* Indicador de progreso (solo registro nuevo) */}
        {progress && (
          <div className="am-progress">
            {Array.from({ length: progress.total }).map((_, i) => (
              <div
                key={i}
                className={`am-progress-dot ${i < progress.step ? 'am-progress-dot--active' : ''}`}
              />
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════
            STEP: PHONE
        ══════════════════════════════════════════ */}
        {step === S.PHONE && (
          <div className="am-form">
            <h2 className="am-title">Ingresa tu número</h2>
            <p className="am-desc">
              Con tu número celular te identificamos y te enviamos las cotizaciones
            </p>

            <div className={`am-input-group ${phoneError ? 'am-input-group--error' : ''}`}>
              <span className="am-input-icon"><Call size="22" color="#9CA3AF" /></span>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="300 000 00 00"
                value={formatPhone(phone)}
                onChange={e => {
                  setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                  setPhoneError('');
                }}
                className="am-input"
                maxLength={13}
                disabled={isLoading}
                onKeyDown={e => { if (e.key === 'Enter') handlePhoneSubmit(); }}
              />
            </div>
            {phoneError && <p className="am-error">{phoneError}</p>}

            <button
              className="am-btn-primary"
              onClick={handlePhoneSubmit}
              disabled={isLoading || phone.replace(/\D/g, '').length !== 10}
            >
              {isLoading ? <IonSpinner name="crescent" /> : 'Continuar'}
            </button>

            <p className="am-terms">
              Al continuar aceptas nuestros{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer">términos y condiciones</a>
              {' '}y{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer">política de privacidad</a>
            </p>
          </div>
        )}

        {/* ══════════════════════════════════════════
            STEP: PIN LOGIN
        ══════════════════════════════════════════ */}
        {step === S.PIN_LOGIN && (
          <div className="am-form">
            {firstName && (
              <p className="am-greeting">Hola de nuevo, {firstName} 👋</p>
            )}
            <h2 className="am-title">Ingresa tu clave</h2>
            <p className="am-desc">Número: <strong>{formatPhone(phone)}</strong></p>

            {renderPinBoxes(pin, pinHandlers, pinRefs)}

            {pinError && <p className="am-error am-error--center">{pinError}</p>}

            <button
              className="am-btn-primary"
              onClick={handlePinLogin}
              disabled={isLoading || !isPinFull(pin)}
            >
              {isLoading ? <IonSpinner name="crescent" /> : 'Ingresar'}
            </button>

            <button
              className="am-btn-link"
              onClick={handleForgotPin}
              disabled={isLoading}
            >
              ¿Olvidaste tu clave?
            </button>

            <button
              className="am-btn-ghost"
              onClick={() => { setPin(['', '', '', '']); setPinError(''); setStep(S.PHONE); }}
              disabled={isLoading}
            >
              ← Cambiar número
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════
            STEP: OTP (nuevo usuario o setup existente)
        ══════════════════════════════════════════ */}
        {(step === S.OTP_SENT || step === S.OTP_FORGOT) && (
          <div className="am-form">
            <div className="am-icon-container">
              <Message size="48" color="#0055FF" variant="Bulk" />
            </div>
            <h2 className="am-title">
              {step === S.OTP_FORGOT ? 'Código de recuperación' : 'Verifica tu número'}
            </h2>
            <p className="am-desc">
              Enviamos un código de 6 dígitos a <strong>{formatPhone(phone)}</strong>
            </p>

            {renderOtpBoxes()}

            {otpError && <p className="am-error am-error--center">{otpError}</p>}

            <button
              className="am-btn-primary"
              onClick={handleOtpVerify}
              disabled={isLoading || otp.length !== 6}
            >
              {isLoading ? <IonSpinner name="crescent" /> : 'Verificar código'}
            </button>

            <div className="am-resend">
              {resendCooldown > 0 ? (
                <p className="am-resend-text">
                  Reenviar en <strong>{resendCooldown}s</strong>
                </p>
              ) : (
                <button className="am-btn-link" onClick={handleResendOtp} disabled={isLoading}>
                  Reenviar código
                </button>
              )}
            </div>

            <button
              className="am-btn-ghost"
              onClick={() => {
                setOtp('');
                setOtpError('');
                setStep(step === S.OTP_FORGOT ? S.PIN_LOGIN : S.PHONE);
              }}
              disabled={isLoading}
            >
              ← Volver
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════
            STEP: REG_NAME
        ══════════════════════════════════════════ */}
        {step === S.REG_NAME && (
          <div className="am-form">
            <h2 className="am-title">¿Cómo te llamas?</h2>
            <p className="am-desc">Así te identificarán los conductores cuando lleguen</p>

            <div className="am-input-group">
              <span className="am-input-icon"><Profile size="22" color="#9CA3AF" /></span>
              <input
                type="text"
                placeholder="Juan Pérez"
                value={userName}
                onChange={e => setUserName(e.target.value)}
                className="am-input"
                disabled={isLoading}
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter' && userName.trim().length >= 2) setStep(S.REG_EMAIL);
                }}
              />
            </div>

            <button
              className="am-btn-primary"
              onClick={() => setStep(S.REG_EMAIL)}
              disabled={isLoading || userName.trim().length < 2}
            >
              Continuar
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════
            STEP: REG_EMAIL
        ══════════════════════════════════════════ */}
        {step === S.REG_EMAIL && (
          <div className="am-form">
            <h2 className="am-title">¿Cuál es tu correo?</h2>
            <p className="am-desc">Te enviaremos el resumen de tus servicios (opcional)</p>

            <div className="am-input-group">
              <span className="am-input-icon"><Sms size="22" color="#9CA3AF" /></span>
              <input
                type="email"
                placeholder="ejemplo@email.com"
                value={userEmail}
                onChange={e => setUserEmail(e.target.value)}
                className="am-input"
                disabled={isLoading}
                autoFocus
              />
            </div>

            <button
              className="am-btn-primary"
              onClick={() => { setPin(['', '', '', '']); setStep(S.PIN_CREATE); }}
              disabled={isLoading}
            >
              {userEmail.trim() ? 'Continuar' : 'Continuar sin correo'}
            </button>

            <button
              className="am-btn-ghost"
              onClick={() => setStep(S.REG_NAME)}
              disabled={isLoading}
            >
              ← Volver
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════
            STEP: PIN_CREATE
        ══════════════════════════════════════════ */}
        {step === S.PIN_CREATE && (
          <div className="am-form">
            <div className="am-icon-container">
              <Lock size="48" color="#0055FF" variant="Bulk" />
            </div>
            <h2 className="am-title">
              {otpPurpose === PURPOSE.FORGOT_PIN ? 'Nueva clave' : 'Crea tu clave'}
            </h2>
            <p className="am-desc">
              {otpPurpose === PURPOSE.FORGOT_PIN
                ? 'Elige una nueva clave de 4 dígitos'
                : 'La usarás cada vez que ingreses a Desvare'}
            </p>

            {renderPinBoxes(pin, pinHandlers, pinRefs)}

            {pinError && <p className="am-error am-error--center">{pinError}</p>}

            <button
              className="am-btn-primary"
              onClick={handlePinCreate}
              disabled={isLoading || !isPinFull(pin)}
            >
              Continuar
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════
            STEP: PIN_CONFIRM
        ══════════════════════════════════════════ */}
        {step === S.PIN_CONFIRM && (
          <div className="am-form">
            <div className="am-icon-container">
              <Lock size="48" color="#10B981" variant="Bulk" />
            </div>
            <h2 className="am-title">Confirma tu clave</h2>
            <p className="am-desc">Ingresa los mismos 4 dígitos que elegiste</p>

            {renderPinBoxes(pinConfirm, pinConfirmHandlers, pinConfirmRefs)}

            {pinError && <p className="am-error am-error--center">{pinError}</p>}

            <button
              className="am-btn-primary"
              onClick={handlePinConfirm}
              disabled={isLoading || !isPinFull(pinConfirm)}
            >
              {isLoading
                ? <IonSpinner name="crescent" />
                : otpPurpose === PURPOSE.NEW_REGISTER
                  ? 'Crear cuenta'
                  : 'Guardar y continuar'}
            </button>

            {otpPurpose === PURPOSE.NEW_REGISTER && (
              <p className="am-terms">
                Al crear tu cuenta aceptas nuestros{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer">términos y condiciones</a>
                {' '}y la{' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer">política de privacidad</a>.
              </p>
            )}

            <button
              className="am-btn-ghost"
              onClick={() => { setPinConfirm(['', '', '', '']); setPinError(''); setStep(S.PIN_CREATE); }}
              disabled={isLoading}
            >
              ← Cambiar clave
            </button>
          </div>
        )}

      </IonContent>
    </IonModal>
  );
};

export default AuthModal;
