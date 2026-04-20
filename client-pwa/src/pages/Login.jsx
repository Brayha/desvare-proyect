import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonContent } from '@ionic/react';
import AuthModal from '../components/AuthModal/AuthModal';
import mapBg from '../assets/img/map-home-responsive.webp';
import logo from '../assets/img/Desvare.svg';
import './Login.css';

/**
 * Página de autenticación standalone.
 * Muestra el nuevo modal unificado (teléfono → PIN) sobre un fondo del mapa.
 * Reemplaza el antiguo flujo de email + contraseña.
 */
const Login = () => {
  const history = useHistory();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Redirigir si ya hay sesión activa
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      history.replace('/tabs/desvare');
      return;
    }
    // Abrir modal inmediatamente
    const t = setTimeout(() => setIsModalOpen(true), 80);
    return () => clearTimeout(t);
  }, [history]);

  const handleSuccess = () => {
    // Después del login exitoso: ir a la app principal
    history.replace('/tabs/desvare');
  };

  const handleDismiss = () => {
    setIsModalOpen(false);
    // Si cierra el modal sin autenticarse, volver al home
    setTimeout(() => history.replace('/home'), 250);
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        {/* Fondo del mapa (decorativo) */}
        <div className="login-bg">
          <img src={mapBg} alt="" className="login-bg__img" />
          <div className="login-bg__overlay" />
          <div className="login-bg__logo-wrap">
            <img src={logo} alt="Desvare" className="login-bg__logo" />
          </div>
        </div>

        {/* Modal de autenticación unificado */}
        <AuthModal
          isOpen={isModalOpen}
          onDismiss={handleDismiss}
          onSuccess={handleSuccess}
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;
