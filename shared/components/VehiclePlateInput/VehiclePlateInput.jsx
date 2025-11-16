import React from 'react';
import { IonItem, IonLabel, IonInput, IonText } from '@ionic/react';
import './VehiclePlateInput.css';

/**
 * VehiclePlateInput - Input para placa de vehículo
 * Validación flexible: ABC-123, GIQ-79F, AB2-123
 * Auto-uppercase y formato automático
 * 
 * @param {string} value - Valor de la placa
 * @param {function} onChange - Callback cuando cambia el valor
 * @param {string} error - Mensaje de error (opcional)
 * @param {string} label - Label del input (opcional)
 * @param {string} placeholder - Placeholder (default: "ABC-123")
 */
const VehiclePlateInput = ({ 
  value, 
  onChange, 
  error, 
  label = "Placa del vehículo",
  placeholder = "ABC-123"
}) => {
  // Validación de formato de placa
  const validatePlate = (plate) => {
    if (!plate) return true; // Permitir vacío para validación en tiempo real
    
    // Formato flexible: 2-3 caracteres alfanuméricos, guión opcional, 2-4 caracteres alfanuméricos
    const plateRegex = /^[A-Z0-9]{2,3}-?[A-Z0-9]{2,4}$/;
    return plateRegex.test(plate);
  };

  const handleInput = (e) => {
    let rawValue = e.detail.value || '';
    
    // Convertir a mayúsculas automáticamente
    rawValue = rawValue.toUpperCase();
    
    // Permitir solo letras, números y guión
    rawValue = rawValue.replace(/[^A-Z0-9-]/g, '');
    
    // Limitar longitud máxima (ABC-123F = 8 caracteres)
    rawValue = rawValue.slice(0, 8);
    
    onChange(rawValue);
  };

  const isValid = !value || validatePlate(value);
  const showError = error || (!isValid && value && value.length >= 5);

  return (
    <div className="vehicle-plate-input-wrapper">
      {label && (
        <IonLabel className="plate-input-label">{label}</IonLabel>
      )}
      
      <IonItem 
        className={`plate-input-item ${showError ? 'ion-invalid' : ''} ${isValid && value ? 'ion-valid' : ''}`}
        lines="none"
      >
        <IonInput
          type="text"
          inputmode="text"
          maxlength={8}
          placeholder={placeholder}
          value={value}
          onIonInput={handleInput}
          className="plate-input-field"
        />
        {isValid && value && value.length >= 5 && (
          <div className="plate-valid-icon" slot="end">✓</div>
        )}
      </IonItem>
      
      {showError ? (
        <div className="plate-input-error">
          {error || 'Formato inválido. Ejemplos: ABC-123, GIQ-79F, AB2-123'}
        </div>
      ) : (
        <IonText className="plate-input-helper">
          <p>Ejemplos: ABC-123, GIQ-79F, AB2-123</p>
        </IonText>
      )}
    </div>
  );
};

export { VehiclePlateInput };
export default VehiclePlateInput;

