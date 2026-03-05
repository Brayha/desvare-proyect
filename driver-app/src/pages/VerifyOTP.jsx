import React, { useState, useRef, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonContent, IonButton, IonSpinner, IonText } from '@ionic/react';
import { Lock, ArrowLeft } from 'iconsax-react';
import { authAPI } from '../services/api';
import './VerifyOTP.css';

const VerifyOTP = () => {
  const history = useHistory();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const otpRefs = useRef([]);

  // Obtener datos temporales del registro
  const userId = localStorage.getItem('tempDriverId');
  const phone = localStorage.getItem('tempDriverPhone');

  useEffect(() => {
    // Si no hay userId o phone Y no acabamos de verificar exitosamente, redirigir a registro
    if (!userId || !phone) {
      if (!verificationSuccess) {
        console.warn('⚠️ No hay datos de registro. Redirigiendo...');
        history.replace('/register');
      }
    }
  }, [userId, phone, history, verificationSuccess]);

  const formatPhone = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    } else if (cleaned.length <= 8) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    } else {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
    }
  };

  const handleOTPChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = otp.split('');
    newOtp[index] = value;
    setOtp(newOtp.join(''));
    setError('');

    // Auto focus siguiente input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    console.log('🔐 Verificando OTP:', otp);

    if (otp.length !== 6) {
      setError('Ingresa el código de 6 dígitos');
      return;
    }

    if (!userId) {
      setError('Error: No se encontró el ID de usuario. Intenta de nuevo.');
      history.replace('/register');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await authAPI.verifyDriverOTP({
        userId,
        otp,
      });

      console.log('✅ OTP verificado:', response.data);

      const { token, user } = response.data;

      // Marcar verificación como exitosa ANTES de limpiar datos
      setVerificationSuccess(true);

      // Guardar token y usuario
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Limpiar datos temporales
      localStorage.removeItem('tempDriverId');
      localStorage.removeItem('tempDriverPhone');

      // Verificar estado del conductor
      const driverStatus = user.driverProfile?.status;

      console.log('📊 Estado del conductor:', driverStatus);

      // Pequeño delay para asegurar que el estado se actualizó
      setTimeout(() => {
        // Navegar según el estado
        if (driverStatus === 'pending_documents') {
          // Nuevo conductor: ir a completar registro
          console.log('🚀 Navegando a complete-registration...');
          history.replace('/complete-registration');
        } else if (driverStatus === 'pending_review') {
          // Documentos enviados: mostrar vista de revisión
          console.log('🚀 Navegando a under-review...');
          history.replace('/under-review');
        } else if (driverStatus === 'approved') {
          // Aprobado: verificar permisos antes de ir a home
          console.log('🚀 Navegando a permissions...');
          history.replace('/permissions');
        } else if (driverStatus === 'rejected') {
          // Rechazado: mostrar mensaje y permitir re-envío
          console.log('🚀 Navegando a rejected...');
          history.replace('/rejected');
        } else {
          // Estado desconocido: verificar permisos antes de ir a home
          console.warn('⚠️ Estado desconocido:', driverStatus);
          history.replace('/permissions');
        }
      }, 100);
    } catch (error) {
      console.error('❌ Error al verificar OTP:', error);
      const errorMsg = error.response?.data?.error || 'Código inválido o expirado';
      setError(errorMsg);
      setOtp('');
      // Auto focus primer input
      otpRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    // Limpiar datos temporales
    localStorage.removeItem('tempDriverId');
    localStorage.removeItem('tempDriverPhone');
    history.goBack();
  };

  return (
    <IonPage>
      <IonContent className="verify-otp-content">
        <div className="verify-otp-container">
          {/* Botón Volver */}
          <button className="verify-otp-back" onClick={handleBack} disabled={isLoading}>
            <ArrowLeft size="24" color="white" />
          </button>

          {/* Ícono */}
          <div className="verify-otp-icon">
            <Lock size="64" color="white" variant="Bulk" />
          </div>

          {/* Título */}
          <h1 className="verify-otp-title">Verifica tu código</h1>
          <p className="verify-otp-description">
            Ingresa el código de 6 dígitos enviado a tu número de celular{' '}
            <strong>{formatPhone(phone)}</strong>
          </p>

          {/* OTP Inputs */}
          <div className="verify-otp-inputs">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <input
                key={index}
                ref={(el) => (otpRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className="verify-otp-input-box"
                value={otp[index] || ''}
                onChange={(e) => handleOTPChange(index, e.target.value)}
                onKeyDown={(e) => handleOTPKeyDown(index, e)}
                disabled={isLoading}
                autoFocus={index === 0}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <IonText color="danger" className="verify-otp-error">
              <small>{error}</small>
            </IonText>
          )}

          {/* Botón Validar */}
          <button
            expand="block"
            className="verify-otp-button"
            onClick={handleVerifyOTP}
            disabled={isLoading || otp.length !== 6}
          >
            {isLoading ? <IonSpinner name="crescent" /> : 'Validar código'}
          </button>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default VerifyOTP;

