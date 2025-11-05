import React from 'react';
import { IonItem, IonLabel, IonInput } from '@ionic/react';
import './PhoneInput.css';

/**
 * Componente PhoneInput para números de teléfono colombianos
 * Formato automático: 319 257 95 62
 * Prefijo fijo: 🇨🇴 +57
 * 
 * @param {string} value - Valor del teléfono (solo números, sin espacios)
 * @param {function} onChange - Callback cuando cambia el valor
 * @param {string} error - Mensaje de error (opcional)
 * @param {string} label - Label del input (opcional)
 * @param {string} placeholder - Placeholder (default: "319 257 95 62")
 */
const PhoneInput = ({ 
  value, 
  onChange, 
  error, 
  label,
  placeholder = "319 257 95 62"
}) => {
  const handleInput = (e) => {
    const rawValue = e.detail.value || '';
    // Solo números, máximo 10 dígitos
    const cleaned = rawValue.replace(/\D/g, '').slice(0, 10);
    onChange(cleaned);
  };

  // Formatear con espacios: 319 257 95 62
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
    <div className="phone-input-wrapper">
      {label && (
        <IonLabel className="phone-input-label">{label}</IonLabel>
      )}
      <IonItem 
        className={`phone-input-item ${error ? 'ion-invalid' : ''}`}
        lines="none"
      >
        <div className="phone-prefix">🇨🇴 +57</div>
        <IonInput
          type="tel"
          inputmode="numeric"
          maxlength={13} // "319 257 95 62" = 13 caracteres con espacios
          placeholder={placeholder}
          value={formatPhone(value)}
          onIonInput={handleInput}
          className="phone-input-field"
        />
      </IonItem>
      {error && (
        <div className="phone-input-error">
          {error}
        </div>
      )}
    </div>
  );
};

export { PhoneInput };
export default PhoneInput;

