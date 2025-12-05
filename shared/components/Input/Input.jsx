import React from 'react';
import './Input.css';

/**
 * Componente Input compartido entre client-pwa y driver-app
 * AHORA: Estilo moderno por defecto (igual que la PWA)
 * 
 * @param {Object} props
 * @param {string} props.type - Tipo de input: 'text', 'email', 'password', 'number', 'tel'
 * @param {string} props.value - Valor del input
 * @param {Function} props.onChange - Función cuando cambia el valor
 * @param {string} props.placeholder - Placeholder
 * @param {boolean} props.disabled - Si está deshabilitado
 * @param {string} props.error - Mensaje de error
 * @param {Component} props.icon - Componente de ícono (Iconsax React)
 * @param {number} props.maxLength - Longitud máxima
 */
const Input = ({
  type = 'text',
  value,
  onChange,
  placeholder = '',
  disabled = false,
  error = '',
  className = '',
  icon = null,
  maxLength,
  ...props
}) => {
  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <div className={`modern-input-wrapper ${className}`}>
      <div className={`modern-input-group ${error ? 'has-error' : ''} ${disabled ? 'is-disabled' : ''}`}>
        {icon && (
          <div className="modern-input-icon">
            {icon}
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
    </div>
  );
};

export { Input };
export default Input;
