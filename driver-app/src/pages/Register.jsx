import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonContent, IonButton, IonSpinner, IonText } from '@ionic/react';
import { Profile, Call, Sms } from 'iconsax-react';
import { authAPI } from '../services/api';
import { Input } from '../components/Input/Input';
import { PhoneInput } from '../components/PhoneInput/PhoneInput';
import './Register.css';

const Register = () => {
  const history = useHistory();
  
  // Estados del formulario
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados de error
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const validateForm = () => {
    let isValid = true;
    
    // Reset errors
    setNameError('');
    setPhoneError('');
    setEmailError('');
    setGeneralError('');

    // Validar nombre
    if (!name || name.trim().length < 3) {
      setNameError('Ingresa tu nombre completo');
      isValid = false;
    }

    // Validar teléfono
    if (!phone || phone.length !== 10) {
      setPhoneError('Ingresa un número válido de 10 dígitos');
      isValid = false;
    }

    // Validar email (opcional pero si lo ingresa debe ser válido)
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Ingresa un email válido');
      isValid = false;
    }

    return isValid;
  };

  const handleRegister = async () => {
    console.log('📝 Iniciando registro driver:', { name, phone, email });

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.registerDriverInitial({
        name: name.trim(),
        phone,
        email: email || undefined,
      });

      console.log('✅ Registro inicial exitoso:', response.data);

      // Guardar userId temporalmente y navegar a verificación OTP
      localStorage.setItem('tempDriverId', response.data.userId);
      localStorage.setItem('tempDriverPhone', phone);
      
      // Navegar a verificación OTP
      history.push('/verify-otp');
    } catch (error) {
      console.error('❌ Error en registro:', error);
      const errorMsg = error.response?.data?.error || 'Error al registrarte. Intenta de nuevo.';
      
      if (errorMsg.includes('ya está registrado')) {
        setGeneralError('Este número ya está registrado. Ve a "Ingresar" para continuar.');
      } else {
        setGeneralError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="register-content">
        <div className="register-container">

          {/* Título */}
          <h1 className="register-title">Crea tu cuenta y comenzemos a hacer plata</h1>
          <h2 className="register-subtitle">Completa la siguiente información para continuar.</h2>

          {/* Formulario */}
          <div className="register-form">
            <Input
              type="text"
              placeholder="Nombre completo"
              value={name}
              onChange={setName}
              error={nameError}
              disabled={isLoading}
              icon={<Profile size="24" color={nameError ? '#EF4444' : '#9CA3AF'} />}
            />

            <Input
              type="email"
              placeholder="ejemplo@email.com (opcional)"
              value={email}
              onChange={setEmail}
              error={emailError}
              disabled={isLoading}
              icon={<Sms size="24" color={emailError ? '#EF4444' : '#9CA3AF'} />}
            />

            <PhoneInput
              value={phone}
              onChange={setPhone}
              error={phoneError}
              disabled={isLoading}
            />

            {/* Error general */}
            {generalError && (
              <IonText color="danger" className="register-error">
                <small>{generalError}</small>
              </IonText>
            )}

            {/* Botón Crear cuenta */}
            <button
              expand="block"
              className="register-button"
              onClick={handleRegister}
              disabled={isLoading || !name || phone.length !== 10}
            >
              {isLoading ? <IonSpinner name="crescent" /> : 'Crear cuenta'}
            </button>

            {/* Link a Login */}
            <div className="register-footer">
              <button
                className="register-link"
                onClick={() => history.push('/login')}
                disabled={isLoading}
              >
                Ya tengo una cuenta
              </button>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Register;
