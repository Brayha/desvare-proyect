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

const Register = () => {
  const history = useHistory();
  const { showSuccess, showWarning, showError } = useToast();
  const [presentLoading, dismissLoading] = useIonLoading();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      showWarning('Por favor completa todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      showWarning('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      showWarning('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    await presentLoading('Registrando...');

    try {
      const response = await authAPI.register({
        name,
        email,
        password,
        userType: 'driver',
      });

      storage.setSession(response.data.token, response.data.user);

      await dismissLoading();
      showSuccess('¡Registro exitoso!');
      history.push('/home');
    } catch (error) {
      await dismissLoading();
      showError(error.response?.data?.error || 'Error al registrarse');
    }
  };

  return (
    <AuthLayout title="Registro - Conductor" toolbarColor="secondary">
      <Card title="Crear Cuenta de Conductor">
        <form onSubmit={handleRegister}>
          <Input
            label="Nombre Completo"
            type="text"
            value={name}
            onIonInput={(e) => setName(e.detail.value)}
            placeholder="Juan Pérez"
            required
          />

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
            placeholder="Mínimo 6 caracteres"
            helper="Debe tener al menos 6 caracteres"
            required
          />

          <Input
            label="Confirmar Contraseña"
            type="password"
            value={confirmPassword}
            onIonInput={(e) => setConfirmPassword(e.detail.value)}
            placeholder="Repite tu contraseña"
            error={
              confirmPassword && password !== confirmPassword
                ? 'Las contraseñas no coinciden'
                : ''
            }
            required
          />

          <Button 
            expand="block" 
            type="submit" 
            size="large"
            variant="secondary"
            className="mt-md"
          >
            Registrarse
          </Button>

          <div className="text-center mt-md">
            <IonText>
              ¿Ya tienes cuenta?{' '}
              <a onClick={() => history.push('/login')}>
                Inicia sesión aquí
              </a>
            </IonText>
          </div>
        </form>
      </Card>
    </AuthLayout>
  );
};

export default Register;
