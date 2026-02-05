import React from 'react';
import { IonText } from '@ionic/react';
import { DocumentText } from 'iconsax-react';
import { Input } from '../../../shared/components';
import './TruckPlateInput.css';

/**
 * Componente para ingresar la placa de la grúa
 */
const TruckPlateInput = ({ 
  plate, 
  onPlateChange, 
  plateError
}) => {
  // Formatear placa automáticamente (mayúsculas, sin espacios)
  const handlePlateChange = (value) => {
    const formatted = value.toUpperCase().replace(/\s/g, '');
    onPlateChange(formatted);
  };

  return (
    <div className="truck-plate-input">
      <div className="selector-header">
        <IonText>
          <h2>Placa de tu grúa</h2>
          <p>Ingresa la placa con la cual el cliente identificará a tu grúa</p>
        </IonText>
      </div>

      <div className="input-section">
        <div className="plate-input-container">
          <IonText>
            <label className="input-label">Placa *</label>
          </IonText>
          <Input
            type="text"
            placeholder="ABC123 o ABC12D"
            value={plate}
            onChange={handlePlateChange}
            error={plateError}
            maxLength={6}
            className="plate-input"
          />
          <IonText color="medium" className="input-hint">
            <small>Formato colombiano: 3 letras + 3 números o 3 letras + 2 números + 1 letra</small>
          </IonText>
        </div>
      </div>

      {/* Información adicional */}
      <div className="info-card">
        <div className="info-icon">ℹ️</div>
        <IonText>
          <p className="info-text">
            <strong>Importante:</strong> Asegúrate de que la placa coincida con los documentos de tu vehículo. 
            Esta información será verificada durante el proceso de aprobación.
          </p>
        </IonText>
      </div>
    </div>
  );
};

export default TruckPlateInput;

