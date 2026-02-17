import React from "react";
import { IonItem, IonLabel, IonInput, IonText } from "@ionic/react";
import "./VehiclePlateInput.css";
import { getVehicleImage } from "../../utils/vehicleImages";
/**
 * VehiclePlateInput - Input para placa de vehículo
 * Formato automático con guión: ABC-123, GIQ-79F, AB2-123
 * Auto-uppercase y formato automático
 *
 * @param {string} value - Valor de la placa (string)
 * @param {function} onChange - Callback cuando cambia el valor
 * @param {object} vehicleData - Datos del vehículo (category, brand, model)
 * @param {string} placeholder - Placeholder (default: "ABC-123")
 */
const VehiclePlateInput = ({
  value,
  onChange,
  vehicleData,
  placeholder = "ABC-123",
}) => {
  // Función para formatear la placa con guión automático (ABC-123)
  const formatPlate = (plate) => {
    if (!plate) return '';
    
    // Remover guiones existentes para trabajar con caracteres limpios
    const cleanPlate = plate.replace(/-/g, '');
    
    // Si tiene más de 3 caracteres, agregar guión automáticamente
    if (cleanPlate.length > 3) {
      return cleanPlate.slice(0, 3) + '-' + cleanPlate.slice(3);
    }
    
    return cleanPlate;
  };

  const handleInput = (e) => {
    let rawValue = e.detail.value || "";

    // Convertir a mayúsculas automáticamente
    rawValue = rawValue.toUpperCase();

    // Permitir solo letras, números y guión
    rawValue = rawValue.replace(/[^A-Z0-9-]/g, "");
    
    // Remover guiones para contar solo caracteres reales
    const cleanValue = rawValue.replace(/-/g, "");
    
    // Limitar longitud máxima (7 caracteres alfanuméricos)
    const limitedValue = cleanValue.slice(0, 7);

    // Formatear con guión automático y enviar al padre
    const formattedValue = formatPlate(limitedValue);
    onChange(formattedValue);
  };

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
          className="plate-input-item"
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
            aria-label="Placa del vehículo"
          />
        </IonItem>
      </div>
    </div>
  );
};

export { VehiclePlateInput };
export default VehiclePlateInput;
