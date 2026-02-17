import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonContent, IonButton, IonSpinner, IonText } from '@ionic/react';
import { Lock, User } from 'iconsax-react';
import Input from '../components/Input/Input';
import { authAPI } from '../services/adminAPI';
import logo from '../assets/img/Desvare-white.svg';
import './Login.css';

const Login = () => {
  const history = useHistory();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Verificar si ya está autenticado
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      history.replace('/dashboard');
    }
  }, [history]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authAPI.login({ email, password });
      
      // Guardar token y datos del admin
      localStorage.setItem('adminToken', response.data.token);
      localStorage.setItem('admin', JSON.stringify(response.data.admin));
      
      console.log('✅ Login exitoso');
      
      // Redirigir al dashboard
      history.replace('/dashboard');
      
    } catch (err) {
      console.error('❌ Error en login:', err);
      setError(err.response?.data?.error || 'Credenciales inválidas');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="admin-login-content">
        <div className="admin-login-container">
          <div className="admin-login-logo">
            <img src={logo} alt="Desvare Admin" />
            <h1>Admin Dashboard</h1>
            <p>Panel de Administración</p>
          </div>

          <form onSubmit={handleLogin} className="admin-login-form">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={setEmail}
              icon={<User size="24" color="#9CA3AF" />}
              disabled={isLoading}
            />

            <Input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={setPassword}
              icon={<Lock size="24" color="#9CA3AF" />}
              disabled={isLoading}
            />

            {error && (
              <IonText color="danger" className="admin-error">
                <small>{error}</small>
              </IonText>
            )}

            <IonButton 
              expand="block" 
              type="submit" 
              disabled={isLoading}
              className="admin-login-button"
            >
              {isLoading ? (
                <>
                  <IonSpinner name="crescent" />
                  <span style={{ marginLeft: '8px' }}>Ingresando...</span>
                </>
              ) : (
                'Ingresar al Dashboard'
              )}
            </IonButton>
          </form>

          <p className="admin-login-footer">
            🔒 Acceso exclusivo para administradores de Desvare
          </p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;

