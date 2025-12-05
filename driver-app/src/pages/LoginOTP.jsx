import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonContent, IonButton, IonSpinner, IonText } from '@ionic/react';
import { authAPI } from '../services/api';
import { PhoneInput } from '../../../shared/components';
import DesvareLogoWhite from '../../../shared/src/img/Desvare-white.svg';
import './LoginOTP.css';

const LoginOTP = () => {
  const history = useHistory();
  
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const validateForm = () => {
    setPhoneError('');
    setGeneralError('');

    if (!phone || phone.length !== 10) {
      setPhoneError('Ingresa un número válido de 10 dígitos');
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    console.log('📱 Iniciando login driver:', { phone });

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Intentar login con OTP
      const response = await authAPI.loginDriverOTP({ phone });

      console.log('✅ Login OTP enviado:', response.data);

      // Guardar userId temporalmente y navegar a verificación OTP
      localStorage.setItem('tempDriverId', response.data.userId);
      localStorage.setItem('tempDriverPhone', phone);
      
      // Navegar a verificación OTP
      history.push('/verify-otp');
    } catch (error) {
      console.error('❌ Error en login:', error);
      const errorMsg = error.response?.data?.error || 'Error al iniciar sesión. Intenta de nuevo.';
      
      if (errorMsg.includes('no encontrado') || errorMsg.includes('no existe')) {
        setGeneralError('Este número no está registrado. Crea una cuenta primero.');
      } else {
        setGeneralError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="login-otp-content">
        <div className="login-otp-container">
          {/* Logo */}
          <div className="login-otp-logo-container">
            <img src={DesvareLogoWhite} alt="Desvare" className="login-otp-logo" />
          </div>

          {/* Título */}
          <h1 className="login-otp-title">Ingresa a tu cuenta,</h1>
          <h2 className="login-otp-subtitle">nuevamente</h2>

          {/* Formulario */}
          <div className="login-otp-form">
            <PhoneInput
              value={phone}
              onChange={setPhone}
              error={phoneError}
              disabled={isLoading}
            />

            {/* Error general */}
            {generalError && (
              <IonText color="danger" className="login-otp-error">
                <small>{generalError}</small>
              </IonText>
            )}

            {/* Botón Ingresar */}
            <IonButton
              expand="block"
              className="login-otp-button"
              onClick={handleLogin}
              disabled={isLoading || phone.length !== 10}
            >
              {isLoading ? <IonSpinner name="crescent" /> : 'Ingresar'}
            </IonButton>

            {/* Link a Registro */}
            <div className="login-otp-footer">
              <button
                className="login-otp-link"
                onClick={() => history.push('/register')}
                disabled={isLoading}
              >
                ¿No tienes cuenta? Regístrate aquí
              </button>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default LoginOTP;
