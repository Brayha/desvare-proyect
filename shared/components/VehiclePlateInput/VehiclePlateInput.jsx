import React from "react";
import { IonItem, IonLabel, IonInput, IonText } from "@ionic/react";
import "./VehiclePlateInput.css";
import { getVehicleImage } from "../../../client-pwa/src/utils/vehicleImages";
/**
 * VehiclePlateInput - Input para placa de vehículo
 * Validación flexible: ABC-123, GIQ-79F, AB2-123
 * Auto-uppercase y formato automático
 *
 * @param {string} value - Valor de la placa (string)
 * @param {function} onChange - Callback cuando cambia el valor
 * @param {object} vehicleData - Datos del vehículo (category, brand, model)
 * @param {string} error - Mensaje de error (opcional)
 * @param {string} placeholder - Placeholder (default: "ABC 123")
 */
const VehiclePlateInput = ({
  value,
  onChange,
  vehicleData,
  error,
  placeholder = "ABC 123",
}) => {
  // Validación de formato de placa
  const validatePlate = (plate) => {
    if (!plate) return true; // Permitir vacío para validación en tiempo real

    // Formato flexible: 2-3 caracteres alfanuméricos, guión opcional, 2-4 caracteres alfanuméricos
    const plateRegex = /^[A-Z0-9]{2,3}-?[A-Z0-9]{2,4}$/;
    return plateRegex.test(plate);
  };

  const handleInput = (e) => {
    let rawValue = e.detail.value || "";

    // Convertir a mayúsculas automáticamente
    rawValue = rawValue.toUpperCase();

    // Permitir solo letras, números y guión
    rawValue = rawValue.replace(/[^A-Z0-9-]/g, "");

    // Limitar longitud máxima (ABC-123F = 8 caracteres)
    rawValue = rawValue.slice(0, 8);

    onChange(rawValue);
  };

  const isValid = !value || validatePlate(value);
  const showError = error || (!isValid && value && value.length >= 5);

  return (
    <div className="vehicle-plate-container">
      {/* Tarjeta del vehículo seleccionado */}
      {vehicleData && (
        <div className="vehicle-added-card-content">
          <div className="vehicle-added-card-content-image-container">
            <img
              src={getVehicleImage(vehicleData.category?.id)}
              alt={vehicleData.category?.name || "Vehículo"}
            />
            <div className="vehicle-added-card-content-text">
              <h3 className="marca">{vehicleData.brand?.name}</h3>
              <p className="modelo">{vehicleData.model?.name}</p>
            </div>
          </div>

          <div className="vehicle-added-card-content-buttons">
            <div className="placa">
              <p className={value ? "placa-value" : "placa-disabled"}>
                {value || "ABC-123"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Input de la placa */}
      <div className="plate-input-container">
        <div className="plate-input-container-header">
          <IonText className="section-emoji-title">
            <h3>🚧 Placa del vehículo</h3>
          </IonText>
          <IonText color="medium" className="section-description">
            <p>Para que la grúa te identificará más rápido</p>
          </IonText>
        </div>
        <IonItem
          className={`plate-input-item ${showError ? "ion-invalid" : ""} ${
            isValid && value ? "ion-valid" : ""
          }`}
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
            <div className="plate-valid-icon" slot="end">
              ✓
            </div>
          )}
        </IonItem>

        {showError && (
          <IonText color="danger" className="plate-error-message">
            <p>{error || "Formato de placa inválido (ej: ABC-123)"}</p>
          </IonText>
        )}
      </div>
    </div>
  );
};

export { VehiclePlateInput };
export default VehiclePlateInput;
