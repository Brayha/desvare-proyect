import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import './AuthLayout.css';

/**
 * Layout compartido para páginas de autenticación (Login, Register)
 * 
 * @param {Object} props
 * @param {string} props.title - Título que aparece en el toolbar
 * @param {React.ReactNode} props.children - Contenido de la página
 * @param {string} props.toolbarColor - Color del toolbar (por defecto 'primary')
 * @param {boolean} props.showHeader - Si muestra o no el header (por defecto true)
 */
const AuthLayout = ({
  title,
  children,
  toolbarColor = 'primary',
  showHeader = true,
}) => {
  return (
    <IonPage>
      {showHeader && (
        <IonHeader>
          <IonToolbar color={toolbarColor}>
            <IonTitle>{title}</IonTitle>
          </IonToolbar>
        </IonHeader>
      )}
      <IonContent className="ion-padding auth-content">
        <div className="auth-container">
          <div className="auth-card-wrapper">
            {children}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export { AuthLayout };
export default AuthLayout;

