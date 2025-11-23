import { IonInput, IonItem, IonLabel, IonText, IonIcon } from '@ionic/react';
import './Input.css';

/**
 * Componente Input compartido entre client-pwa y driver-app
 * Soporta AMBOS estilos: Ionic nativo (legacy) y moderno
 * 
 * @param {Object} props
 * @param {string} props.label - Etiqueta del input
 * @param {string} props.type - Tipo de input: 'text', 'email', 'password', 'number', 'tel'
 * @param {string} props.value - Valor del input
 * @param {Function} props.onIonInput - Función cuando cambia el valor (Ionic)
 * @param {Function} props.onChange - Función cuando cambia el valor (HTML nativo)
 * @param {string} props.placeholder - Placeholder
 * @param {boolean} props.required - Si es requerido
 * @param {boolean} props.disabled - Si está deshabilitado
 * @param {string} props.error - Mensaje de error
 * @param {string} props.helper - Texto de ayuda
 * @param {string} props.labelPosition - Posición del label: 'floating', 'fixed', 'stacked'
 * @param {string} props.icon - Ícono de ionicons (string)
 * @param {Component} props.iconComponent - Componente de ícono (Iconsax React)
 * @param {boolean} props.modern - Si usar el estilo moderno (default: false para compatibilidad)
 * 
 */
const Input = ({
  label,
  type = 'text',
  value,
  onIonInput,
  onChange,
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
  modern = false,        // Nuevo: activar estilo moderno
  maxLength,
  ...props
}) => {
  // Si se usa el estilo moderno, renderizar HTML nativo
  if (modern) {
    const handleChange = (e) => {
      if (onChange) {
        onChange(e.target.value);
      }
      if (onIonInput) {
        onIonInput({ detail: { value: e.target.value } });
      }
    };

    return (
      <div className={`modern-input-wrapper ${className}`}>
        <div className={`modern-input-group ${error ? 'has-error' : ''} ${disabled ? 'is-disabled' : ''}`}>
          {iconComponent && (
            <div className="modern-input-icon">
              {iconComponent}
            </div>
          )}
          <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            maxLength={maxLength}
            className="modern-input-field"
            {...props}
          />
        </div>
        {error && (
          <span className="modern-input-error">{error}</span>
        )}
        {helper && !error && (
          <span className="modern-input-helper">{helper}</span>
        )}
      </div>
    );
  }

  // Estilo Ionic legacy (mantener compatibilidad)
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
