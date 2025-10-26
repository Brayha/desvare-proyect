import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonInput,
  IonButton,
  IonItem,
  IonLabel,
  IonText,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  useIonToast,
  useIonLoading,
} from '@ionic/react';
import { authAPI } from '../services/api';

const Login = () => {
  const history = useHistory();
  const [present] = useIonToast();
  const [presentLoading, dismissLoading] = useIonLoading();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      present({
        message: 'Por favor completa todos los campos',
        duration: 2000,
        color: 'warning',
      });
      return;
    }

    await presentLoading('Iniciando sesión...');

    try {
      const response = await authAPI.login({
        email,
        password,
        userType: 'client',
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      await dismissLoading();
      
      present({
        message: '¡Bienvenido!',
        duration: 2000,
        color: 'success',
      });

      history.push('/home');
    } catch (error) {
      await dismissLoading();
      
      present({
        message: error.response?.data?.error || 'Error al iniciar sesión',
        duration: 3000,
        color: 'danger',
      });
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Desvare - Cliente</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
          <IonCard style={{ width: '100%', maxWidth: '400px' }}>
            <IonCardHeader>
              <IonCardTitle>Iniciar Sesión</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <form onSubmit={handleLogin}>
                <IonItem>
                  <IonLabel position="floating">Email</IonLabel>
                  <IonInput
                    type="email"
                    value={email}
                    onIonInput={(e) => setEmail(e.detail.value)}
                    required
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="floating">Contraseña</IonLabel>
                  <IonInput
                    type="password"
                    value={password}
                    onIonInput={(e) => setPassword(e.detail.value)}
                    required
                  />
                </IonItem>

                <IonButton expand="block" type="submit" style={{ marginTop: '20px' }}>
                  Iniciar Sesión
                </IonButton>

                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <IonText>
                    ¿No tienes cuenta?{' '}
                    <a onClick={() => history.push('/register')} style={{ cursor: 'pointer', color: 'var(--ion-color-primary)' }}>
                      Regístrate aquí
                    </a>
                  </IonText>
                </div>
              </form>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;

