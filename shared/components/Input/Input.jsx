import { IonInput, IonItem, IonLabel, IonText } from '@ionic/react';
import './Input.css';

/**
 * Componente Input compartido entre client-pwa y driver-app
 * 
 * @param {Object} props
 * @param {string} props.label - Etiqueta del input
 * @param {string} props.type - Tipo de input: 'text', 'email', 'password', 'number', 'tel'
 * @param {string} props.value - Valor del input
 * @param {Function} props.onIonInput - Función cuando cambia el valor
 * @param {string} props.placeholder - Placeholder
 * @param {boolean} props.required - Si es requerido
 * @param {boolean} props.disabled - Si está deshabilitado
 * @param {string} props.error - Mensaje de error
 * @param {string} props.helper - Texto de ayuda
 * @param {string} props.labelPosition - Posición del label: 'floating', 'fixed', 'stacked'
 * @param {string} props.icon - Ícono de ionicons (ej: 'mail-outline', 'lock-closed-outline')
 * 
 */
const Input = ({
  label,
  type = 'text',
  value,
  onIonInput,
  placeholder = '',
  required = false,
  disabled = false,
  clearOnEdit = false,
  error = '',
  helper = '',
  labelPosition = 'stacked',
  className = '',
  icon = null,           // Para Ionicons (string)
  iconComponent = null,  // Para Iconsax (React component)
  ...props
}) => {
  return (
    <div className={`shared-input-wrapper ${className}`}>
      <IonItem
        className={`shared-input-item ${error ? 'input-error' : ''}`}
        lines="none"
      >
       {/* Soporte para ambos tipos de íconos */}
       {iconComponent && (
          <div slot="start" className="input-icon-wrapper">
            {iconComponent}
          </div>
        )}
        
        {!iconComponent && icon && (
          <IonIcon 
            icon={icon} 
            slot="start" 
            className="input-icon"
          />
        )}

        {label && (
          <IonLabel position={labelPosition}>
            {label}
            {required && <span className="required-asterisk"> *</span>}
          </IonLabel>
        )}
        <IonInput
          type={type}
          value={value}
          onIonInput={onIonInput}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="shared-input"
          {...props}
        />
      </IonItem>
      
      {/* Mensaje de error */}
      {error && (
        <IonText color="danger" className="input-message">
          <small>{error}</small>
        </IonText>
      )}
      
      {/* Texto de ayuda */}
      {helper && !error && (
        <IonText color="medium" className="input-message">
          <small>{helper}</small>
        </IonText>
      )}
    </div>
  );
};

export { Input };
export default Input;

