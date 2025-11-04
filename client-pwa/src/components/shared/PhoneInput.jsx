import React from 'react';
import { IonItem, IonLabel, IonInput } from '@ionic/react';
import './PhoneInput.css';

const PhoneInput = ({ value, onChange, error }) => {
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
      <IonItem 
        className={`phone-input-item ${error ? 'ion-invalid' : ''}`}
        lines="none"
      >
        <div className="phone-prefix">🇨🇴 +57</div>
        <IonInput
          type="tel"
          inputmode="numeric"
          maxlength={13} // "319 257 95 62" = 13 caracteres con espacios
          placeholder="319 257 95 62"
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

export default PhoneInput;

