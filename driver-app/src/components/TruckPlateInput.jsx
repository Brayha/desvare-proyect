import React from "react";
import { IonText } from "@ionic/react";
import { DocumentText } from "iconsax-react";
import { Input } from "./Input/Input";
import "./TruckPlateInput.css";

/**
 * Componente para ingresar la placa de la grúa
 */
const TruckPlateInput = ({ plate, onPlateChange, plateError }) => {
  // Extrae solo alfanuméricos, uppercase, máx 6 chars — guarda SIN guion
  const handlePlateChange = (value) => {
    const raw = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
    onPlateChange(raw);
  };

  // Muestra CON guion: "ABC-123" (el guion se inserta solo después del 3er char)
  const displayValue = plate.length > 3
    ? `${plate.slice(0, 3)}-${plate.slice(3)}`
    : plate;

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
            placeholder="ABC-123"
            value={displayValue}
            onChange={handlePlateChange}
            error={plateError}
            maxLength={7}
            className="plate-input"
          />
          <IonText color="medium" className="input-hint">
              Formato colombiano: 3 letras + 3 números o 3 letras + 2 números +
              1 letra
          </IonText>
        </div>
        {/* Información adicional */}
        <div className="info-card">
          <div className="info-icon">⚠️</div>
          <IonText>
            <p className="info-text">
              <strong>Importante:</strong> Asegúrate de que la placa coincida
              con los documentos de tu vehículo. Esta información será
              verificada durante el proceso de aprobación.
            </p>
          </IonText>
        </div>
      </div>
    </div>
  );
};

export default TruckPlateInput;
