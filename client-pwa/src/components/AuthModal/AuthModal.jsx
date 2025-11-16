import React, { useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonItem,
  IonInput,
  IonText,
  IonSpinner,
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { PhoneInput, OTPInput } from '@components';
import { authAPI } from '../../services/api';
import { useToast } from '@hooks/useToast';
import './AuthModal.css';

const AuthModal = ({ isOpen, onDismiss, onSuccess }) => {
  const { showSuccess, showError } = useToast();

  const [authMode, setAuthMode] = useState('login'); // "login" o "register"
  const [step, setStep] = useState(1); // 1: formulario, 2: OTP
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Formulario de login
  const [loginPhone, setLoginPhone] = useState('');

  // Formulario de registro
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');

  // OTP
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  const handleLoginSubmit = async () => {
    console.log('📱 Iniciando login con teléfono:', loginPhone);

    if (!loginPhone || loginPhone.length !== 10) {
      showError('Ingresa un número de teléfono válido');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.loginOTP({ phone: loginPhone });
      console.log('✅ Login OTP - Respuesta:', response.data);

      setUserId(response.data.userId);
      setStep(2);
      showSuccess('Te enviamos un código de verificación');
    } catch (error) {
      console.error('❌ Error en login OTP:', error);
      const errorMsg = error.response?.data?.error || 'Error al iniciar sesión';
      showError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async () => {
    console.log('📱 Iniciando registro:', { registerName, registerPhone, registerEmail });

    if (!registerName || !registerPhone || registerPhone.length !== 10) {
      showError('Nombre y teléfono válido son requeridos');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.registerOTP({
        name: registerName,
        phone: registerPhone,
        email: registerEmail || undefined,
      });
      console.log('✅ Registro OTP - Respuesta:', response.data);

      setUserId(response.data.userId);
      setStep(2);
      showSuccess('Te enviamos un código de verificación');
    } catch (error) {
      console.error('❌ Error en registro OTP:', error);
      const errorMsg = error.response?.data?.error || 'Error al registrarte';

      if (errorMsg.includes('ya está registrado')) {
        showError('Este número ya está registrado. Usa "Iniciar Sesión" en su lugar.');
      } else {
        showError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    console.log('🔐 Verificando OTP:', otp);

    if (otp.length !== 4) {
      setOtpError('Ingresa el código de 4 dígitos');
      return;
    }

    if (!userId) {
      setOtpError('Error: No se encontró el ID de usuario. Intenta de nuevo.');
      setStep(1);
      return;
    }

    setIsLoading(true);
    setOtpError('');

    try {
      const response = await authAPI.verifyOTP({
        userId: userId,
        otp: otp,
      });
      console.log('✅ OTP verificado - Respuesta:', response.data);

      const { token, user } = response.data;

      // Guardar token y usuario
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      console.log('💾 Token y usuario guardados');

      // Llamar al callback de éxito
      if (onSuccess) {
        onSuccess(user);
      }

      // Resetear el modal
      handleResetModal();
    } catch (error) {
      console.error('❌ Error al verificar OTP:', error);
      const errorMsg = error.response?.data?.error || 'Código inválido o expirado';
      setOtpError(errorMsg);
      setOtp('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetModal = () => {
    setAuthMode('login');
    setStep(1);
    setUserId(null);
    setLoginPhone('');
    setRegisterName('');
    setRegisterPhone('');
    setRegisterEmail('');
    setOtp('');
    setOtpError('');
  };

  const handleDismiss = () => {
    handleResetModal();
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setOtp('');
      setOtpError('');
    } else {
      handleDismiss();
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleDismiss} className="auth-modal">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={handleBack}>
              {step === 2 ? 'Atrás' : <IonIcon icon={closeOutline} />}
            </IonButton>
          </IonButtons>
          <IonTitle>{step === 1 ? 'Autenticación' : 'Verificación'}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* PASO 1: Formulario de Login o Registro */}
        {step === 1 && (
          <>
            <IonSegment
              value={authMode}
              onIonChange={(e) => setAuthMode(e.detail.value)}
              className="auth-segment"
            >
              <IonSegmentButton value="login">
                <IonLabel>Iniciar Sesión</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="register">
                <IonLabel>Registrarse</IonLabel>
              </IonSegmentButton>
            </IonSegment>

            {authMode === 'login' ? (
              <div className="auth-form">
                <IonText color="medium" className="auth-subtitle">
                  Ingresa tu número de teléfono
                </IonText>

                <PhoneInput value={loginPhone} onChange={setLoginPhone} />

                <IonButton
                  expand="block"
                  onClick={handleLoginSubmit}
                  disabled={isLoading || loginPhone.length !== 10}
                  className="auth-button"
                >
                  {isLoading ? <IonSpinner /> : 'Continuar'}
                </IonButton>
              </div>
            ) : (
              <div className="auth-form">
                <IonText color="medium" className="auth-subtitle">
                  Crea tu cuenta
                </IonText>

                <IonItem lines="none" className="custom-input-item">
                  <IonLabel position="stacked">Nombre completo</IonLabel>
                  <IonInput
                    type="text"
                    placeholder="Juan Pérez"
                    value={registerName}
                    onIonInput={(e) => setRegisterName(e.detail.value)}
                  />
                </IonItem>

                <PhoneInput value={registerPhone} onChange={setRegisterPhone} />

                <IonItem lines="none" className="custom-input-item">
                  <IonLabel position="stacked">Email (opcional)</IonLabel>
                  <IonInput
                    type="email"
                    placeholder="juan@ejemplo.com"
                    value={registerEmail}
                    onIonInput={(e) => setRegisterEmail(e.detail.value)}
                  />
                </IonItem>

                <IonButton
                  expand="block"
                  onClick={handleRegisterSubmit}
                  disabled={isLoading || !registerName || registerPhone.length !== 10}
                  className="auth-button"
                >
                  {isLoading ? <IonSpinner /> : 'Crear Cuenta'}
                </IonButton>
              </div>
            )}
          </>
        )}

        {/* PASO 2: Verificación OTP */}
        {step === 2 && (
          <div className="otp-form">
            <IonText color="medium" className="otp-subtitle">
              Ingresa el código de 4 dígitos
            </IonText>
            <IonText color="medium" className="otp-hint">
              (Para pruebas usa: 0000)
            </IonText>

            <OTPInput
              value={otp}
              onChange={(value) => {
                setOtp(value);
                setOtpError('');
              }}
              error={otpError}
            />

            <IonButton
              expand="block"
              onClick={handleVerifyOTP}
              disabled={isLoading || otp.length !== 4}
              className="auth-button"
            >
              {isLoading ? <IonSpinner /> : 'Verificar'}
            </IonButton>

            <IonButton
              expand="block"
              fill="clear"
              onClick={() => {
                setStep(1);
                setOtp('');
                setOtpError('');
              }}
              disabled={isLoading}
            >
              Cambiar número
            </IonButton>
          </div>
        )}
      </IonContent>
    </IonModal>
  );
};

export default AuthModal;

