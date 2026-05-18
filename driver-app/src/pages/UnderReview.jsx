import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonContent, IonButton, IonToast } from '@ionic/react';
import { Clock, SecurityUser, TickCircle, Check } from 'iconsax-react';
import { io } from 'socket.io-client';
import DesvareLogoWhite from '../assets/img/Desvare.svg';
import './UnderReview.css';

/**
 * Vista "En Revisión"
 * Se muestra cuando el conductor ha completado el registro
 * y está esperando la aprobación del administrador.
 * 
 * 🆕 Ahora escucha notificaciones en tiempo real vía Socket.IO
 * para redirigir automáticamente cuando el admin aprueba/rechaza
 */

const UnderReview = () => {
  const history = useHistory();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 🆕 SOCKET.IO: Conectar y escuchar notificaciones de aprobación/rechazo
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user._id;

    if (!userId) {
      console.warn('⚠️ No se encontró ID de usuario, no se puede conectar Socket.IO');
      return;
    }

    // Conectar al servidor Socket.IO
    const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Evento: Conexión exitosa
    socket.on('connect', () => {
      console.log('✅ Socket.IO conectado:', socket.id);
      // Registrar al conductor en su sala personal
      socket.emit('driver:register', userId);
      console.log(`📡 Conductor ${userId} registrado en Socket.IO`);
    });

    // Evento: Cuenta APROBADA
    socket.on('account:approved', (data) => {
      console.log('🎉 ¡Cuenta aprobada!', data);
      setToastMessage('¡Tu cuenta ha sido aprobada! Redirigiendo...');
      setShowToast(true);
      
      // Redirigir al home después de 1.5 segundos
      setTimeout(() => {
        history.replace('/home');
      }, 1500);
    });

    // Evento: Cuenta RECHAZADA
    socket.on('account:rejected', (data) => {
      console.log('❌ Cuenta rechazada:', data);
      setToastMessage('Tu cuenta ha sido rechazada.');
      setShowToast(true);
      
      // Redirigir a la página de rechazo después de 1.5 segundos
      setTimeout(() => {
        history.replace('/rejected');
      }, 1500);
    });

    // Evento: Error de conexión
    socket.on('connect_error', (error) => {
      console.error('❌ Error conectando Socket.IO:', error.message);
    });

    // Cleanup: Desconectar al desmontar el componente
    return () => {
      console.log('🔌 Desconectando Socket.IO');
      socket.disconnect();
    };
  }, [history]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    history.replace('/splash');
  };

  return (
    <IonPage>
      <IonContent className="under-review-content">
        <div className="under-review-container">
          {/* Logo */}
          <div className="under-review-logo-container">
            <img src={DesvareLogoWhite} alt="Desvare" className="under-review-logo" />
          </div>

          {/* Ícono principal */}
          <div className="under-review-icon">
            <TickCircle size="32" color="green" variant="Bulk" />
          </div>

          {/* Título */}
          <h1 className="under-review-title">¡Registro Completo!</h1>
          <p className="under-review-subtitle">
            Tu perfil está en revisión
          </p>

          {/* Descripción */}
          <div className="under-review-card">
            <p className="under-review-description">
              Nuestro equipo está revisando tus documentos y datos. 
              Este proceso puede tardar <strong>24 a 48 horas</strong>.
            </p>
          </div>

          {/* Checklist */}
          <div className="review-checklist">
            <div className="checklist-item">
              <TickCircle size="24" color="#10B981" variant="Bold" />
              <span>Documentos recibidos</span>
            </div>
            <div className="checklist-item">
              <SecurityUser size="24" color="#10B981" variant="Bold" />
              <span>Verificación en proceso</span>
            </div>
            <div className="checklist-item">
              <Clock size="24" color="#F59E0B" variant="Bold" />
              <span>Esperando aprobación</span>
            </div>
          </div>

          {/* Mensaje de notificación */}
          <div className="under-review-notice">
            <p>
              🔔 Te notificaremos cuando tu perfil sea aprobado y puedas empezar a recibir servicios.
            </p>
          </div>

          {/* Botón Cerrar Sesión */}
          <IonButton
            expand="block"
            fill="outline"
            className="logout-button"
            onClick={handleLogout}
          >
            Cerrar Sesión
          </IonButton>
        </div>

        {/* 🆕 Toast para notificaciones */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={1500}
          position="top"
          color="success"
        />
      </IonContent>
    </IonPage>
  );
};

export default UnderReview;

