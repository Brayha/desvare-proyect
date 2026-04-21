import React from "react";
import {
  IonItem,
  IonLabel,
  IonTextarea,
  IonCheckbox,
  IonInput,
  IonToggle,
  IonText,
} from "@ionic/react";
import { getVehicleImage } from "../../utils/vehicleImages";
import "./ServiceDetailsForm.css";

/**
 * ServiceDetailsForm - Formulario para detalles del servicio actual
 * Pregunta cosas que cambian por servicio: problema, sótano, peso
 *
 * @param {Object} vehicleCategory - Categoría del vehículo { id, name }
 * @param {Object} vehicleData - Datos completos del vehículo { category, brand, model, licensePlate }
 * @param {Object} initialData - Datos iniciales del formulario
 * @param {Function} onDataChange - Callback cuando cambian los datos
 * @param {Object} errors - Objeto con errores de validación
 */
const ServiceDetailsForm = ({
  vehicleCategory,
  vehicleData,
  initialData = {},
  onDataChange,
  errors = {},
}) => {
  const categoryId = vehicleCategory?.id;
  const [data, setData] = React.useState(initialData);

  // Actualizar datos cuando cambien desde fuera
  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // Handler para cambios en el formulario
  const handleChange = (field, value) => {
    const newData = { ...data, [field]: value };
    setData(newData);
    if (onDataChange) {
      onDataChange(newData);
    }
  };

  // Verificar si el vehículo puede estar en sótano
  const canBeInBasement = [
    "MOTOS",
    "AUTOS",
    "CAMIONETAS",
  ].includes(categoryId);

  // Verificar si es camión (pregunta peso)
  const isTruck = categoryId === "CAMIONES";

  return (
    <div className="service-details-form">
      {/* Tarjeta del vehículo */}
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
              <p className="placa-value">
                {vehicleData.licensePlate || "ABC-123"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Problema actual - TODOS los vehículos */}
      <div className="service-field ion-margin-top">
        <div className="plate-input-container-header">
          <IonText className="section-emoji-title">
            <h3>🪝 ¿Cuál es el problema?</h3>
          </IonText>
          <IonText color="medium" className="section-description">
            <p>Describe el problema de tú vehiculo, lo más claro posible</p>
          </IonText>
        </div>
        <IonItem
          lines="none"
          className={`service-item textarea-item ${
            errors.problem ? "ion-invalid" : ""
          }`}
        >
          <IonTextarea
            value={data?.problem || ""}
            onIonInput={(e) => handleChange("problem", e.detail.value)}
            placeholder="Ej: Se descompuso la batería del carro"
            rows={4}
          />
        </IonItem>
      </div>

      {/* Sótano - Para MOTOS, AUTOS y CAMIONETAS */}
      {canBeInBasement && (
        <div className="service-field">
          <div className="service-checkbox-wrapper">
            <IonCheckbox
              checked={data?.basement?.isInBasement || false}
              onIonChange={(e) =>
                handleChange("basement", {
                  ...data?.basement,
                  isInBasement: e.detail.checked,
                  level: e.detail.checked ? data?.basement?.level : null,
                })
              }
              labelPlacement="end"
              className="service-checkbox"
            >
              <IonLabel className="service-checkbox-label">
                ¿El vehículo está en un sótano?
              </IonLabel>
            </IonCheckbox>
          </div>

          {/* Input de nivel de sótano - solo si está marcado */}
          {data?.basement?.isInBasement && (
            <div className="service-field-nested">
              <IonLabel className="service-label">
                ¿En qué nivel? <span className="required">*</span>
              </IonLabel>
              <IonItem
                lines="none"
                className={`service-item ${
                  errors.basementLevel ? "ion-invalid" : ""
                }`}
              >
                <IonInput
                  type="number"
                  min="1"
                  max="10"
                  value={
                    data?.basement?.level ? Math.abs(data.basement.level) : ""
                  }
                  onIonInput={(e) => {
                    const positiveValue = parseInt(e.detail.value);
                    if (!isNaN(positiveValue) && positiveValue > 0) {
                      handleChange("basement", {
                        ...data?.basement,
                        level: -Math.abs(positiveValue), // Convertir a negativo
                      });
                    }
                  }}
                  placeholder="1, 2, 3... (nivel de sótano)"
                />
              </IonItem>
              {errors.basementLevel ? (
                <IonText color="danger" className="service-error">
                  <p>{errors.basementLevel}</p>
                </IonText>
              ) : (
                <IonText className="service-helper">
                  <p>
                    Ingresa el número del nivel (ej: 1 para sótano -1, 2 para
                    sótano -2)
                  </p>
                  <p>
                    <small>
                      Los niveles inferiores incrementan el costo del servicio
                    </small>
                  </p>
                </IonText>
              )}
            </div>
          )}
        </div>
      )}

      {/* Peso - Solo para CAMIONES */}
      {isTruck && (
        <div className="service-field">
          <IonItem lines="none" className="service-item toggle-item">
            <IonLabel>¿El camión está cargado?</IonLabel>
            <IonToggle
              checked={data?.truckCurrentState?.isLoaded || false}
              onIonChange={(e) =>
                handleChange("truckCurrentState", {
                  ...data?.truckCurrentState,
                  isLoaded: e.detail.checked,
                  currentWeight: e.detail.checked
                    ? data?.truckCurrentState?.currentWeight
                    : null,
                })
              }
              color="primary"
            />
          </IonItem>

          {/* Input de peso - solo si está cargado */}
          {data?.truckCurrentState?.isLoaded && (
            <div className="service-field-nested">
              <IonLabel className="service-label">
                Peso actual <span className="required">*</span>
              </IonLabel>
              <IonItem
                lines="none"
                className={`service-item ${errors.weight ? "ion-invalid" : ""}`}
              >
                <IonInput
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="50"
                  value={data?.truckCurrentState?.currentWeight}
                  onIonInput={(e) =>
                    handleChange("truckCurrentState", {
                      ...data?.truckCurrentState,
                      currentWeight: parseFloat(e.detail.value),
                    })
                  }
                  placeholder="Ej: 12.5"
                />
                <IonLabel slot="end">toneladas</IonLabel>
              </IonItem>
              {errors.weight && (
                <IonText color="danger" className="service-error">
                  <p>{errors.weight}</p>
                </IonText>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { ServiceDetailsForm };
export default ServiceDetailsForm;
