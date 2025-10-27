import { IonButton } from '@ionic/react';
import './Button.css';

/**
 * Componente Button compartido entre client-pwa y driver-app
 * 
 * @param {Object} props
 * @param {string} props.children - Texto o contenido del botón
 * @param {string} props.variant - Tipo de botón: 'primary', 'secondary', 'success', 'danger', 'warning'
 * @param {string} props.size - Tamaño: 'small', 'default', 'large'
 * @param {boolean} props.expand - Si el botón debe ocupar todo el ancho: 'block', 'full'
 * @param {boolean} props.disabled - Si el botón está deshabilitado
 * @param {boolean} props.loading - Si muestra estado de carga
 * @param {Function} props.onClick - Función al hacer clic
 * @param {string} props.type - Tipo de botón HTML: 'button', 'submit', 'reset'
 * @param {Object} props.icon - Ícono de Ionicons
 * @param {string} props.iconPosition - Posición del ícono: 'start', 'end'
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'default',
  expand = null,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  icon = null,
  iconPosition = 'start',
  className = '',
  ...props
}) => {
  // Mapear variantes a colores de Ionic
  const colorMap = {
    primary: 'primary',
    secondary: 'secondary',
    success: 'success',
    danger: 'danger',
    warning: 'warning',
    light: 'light',
    dark: 'dark',
  };

  // Mapear tamaños
  const sizeMap = {
    small: 'small',
    default: 'default',
    large: 'large',
  };

  return (
    <IonButton
      color={colorMap[variant] || 'primary'}
      size={sizeMap[size] || 'default'}
      expand={expand}
      disabled={disabled || loading}
      onClick={onClick}
      type={type}
      className={`shared-button ${className}`}
      {...props}
    >
      {icon && iconPosition === 'start' && (
        <ion-icon icon={icon} slot="start"></ion-icon>
      )}
      {loading ? 'Cargando...' : children}
      {icon && iconPosition === 'end' && (
        <ion-icon icon={icon} slot="end"></ion-icon>
      )}
    </IonButton>
  );
};

export { Button };
export default Button;

