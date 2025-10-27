import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonText, useIonLoading } from '@ionic/react';
import { AuthLayout } from '@layouts/AuthLayout';
import { Button } from '@components';
import { Input } from '@components';
import { Card } from '@components';
import { authAPI } from '@services/api';
import { useToast } from '@hooks/useToast';
import storage from '@services/storage';

const Login = () => {
  const history = useHistory();
  const { showSuccess, showWarning, showError } = useToast();
  const [presentLoading, dismissLoading] = useIonLoading();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      showWarning('Por favor completa todos los campos');
      return;
    }

    await presentLoading('Iniciando sesión...');

    try {
      const response = await authAPI.login({
        email,
        password,
        userType: 'driver',
      });

      storage.setSession(response.data.token, response.data.user);

      await dismissLoading();
      showSuccess('¡Bienvenido!');
      history.push('/home');
    } catch (error) {
      await dismissLoading();
      showError(error.response?.data?.error || 'Error al iniciar sesión');
    }
  };

  return (
    <AuthLayout title="Desvare - Conductor" toolbarColor="secondary">
      <Card title="Iniciar Sesión como Conductor">
        <form onSubmit={handleLogin}>
          <Input
            label="Email"
            type="email"
            value={email}
            onIonInput={(e) => setEmail(e.detail.value)}
            placeholder="tu@email.com"
            required
          />

          <Input
            label="Contraseña"
            type="password"
            value={password}
            onIonInput={(e) => setPassword(e.detail.value)}
            placeholder="••••••••"
            required
          />

          <Button 
            expand="block" 
            type="submit" 
            size="large"
            variant="secondary"
            className="mt-md"
          >
            Iniciar Sesión
          </Button>

          <div className="text-center mt-md">
            <IonText>
              ¿No tienes cuenta?{' '}
              <a onClick={() => history.push('/register')}>
                Regístrate aquí
              </a>
            </IonText>
          </div>
        </form>
      </Card>
    </AuthLayout>
  );
};

export default Login;
