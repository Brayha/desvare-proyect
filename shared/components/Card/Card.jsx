import { IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent } from '@ionic/react';
import './Card.css';

/**
 * Componente Card compartido entre client-pwa y driver-app
 * 
 * @param {Object} props
 * @param {string} props.title - Título del card
 * @param {string} props.subtitle - Subtítulo del card
 * @param {React.ReactNode} props.children - Contenido del card
 * @param {boolean} props.elevated - Si tiene elevación/sombra
 * @param {Function} props.onClick - Función al hacer clic en el card
 * @param {string} props.className - Clases adicionales
 */
const Card = ({
  title,
  subtitle,
  children,
  elevated = true,
  onClick,
  className = '',
  ...props
}) => {
  return (
    <IonCard
      className={`shared-card ${elevated ? 'card-elevated' : ''} ${onClick ? 'card-clickable' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {(title || subtitle) && (
        <IonCardHeader>
          {title && <IonCardTitle>{title}</IonCardTitle>}
          {subtitle && <IonCardSubtitle>{subtitle}</IonCardSubtitle>}
        </IonCardHeader>
      )}
      {children && <IonCardContent>{children}</IonCardContent>}
    </IonCard>
  );
};

export { Card };
export default Card;

