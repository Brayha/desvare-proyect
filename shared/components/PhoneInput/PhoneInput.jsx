import React from 'react';
import { Call } from 'iconsax-react';
import './PhoneInput.css';

/**
 * Componente PhoneInput moderno para números de teléfono colombianos
 * Formato automático: 319 257 95 62
 * 
 * @param {string} value - Valor del teléfono (solo números, sin espacios)
 * @param {function} onChange - Callback cuando cambia el valor
 * @param {string} error - Mensaje de error (opcional)
 * @param {boolean} disabled - Si está deshabilitado
 */
const PhoneInput = ({ 
  value, 
  onChange, 
  error,
  disabled = false
}) => {
  const handleInput = (e) => {
    const rawValue = e.target.value || '';
    const cleaned = rawValue.replace(/\D/g, '').slice(0, 10);
    onChange(cleaned);
  };

  const formatPhone = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    } else if (cleaned.length <= 8) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    } else {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
    }
  };

  return (
    <div className="modern-phone-input-wrapper">
      <div className={`modern-phone-input-group ${error ? 'has-error' : ''} ${disabled ? 'is-disabled' : ''}`}>
        <div className="modern-phone-input-icon">
          <Call size="24" color={error ? '#EF4444' : '#9CA3AF'} />
        </div>
        <input
          type="tel"
          inputMode="numeric"
          maxLength={13}
          placeholder="000 000 00 00"
          value={formatPhone(value)}
          onChange={handleInput}
          disabled={disabled}
          className="modern-phone-input-field"
        />
      </div>
      {error && (
        <span className="modern-phone-input-error">{error}</span>
      )}
    </div>
  );
};

export { PhoneInput };
export default PhoneInput;
