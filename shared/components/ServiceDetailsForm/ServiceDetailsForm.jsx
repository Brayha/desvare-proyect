import React from 'react';
import {
  IonItem,
  IonLabel,
  IonTextarea,
  IonCheckbox,
  IonInput,
  IonToggle,
  IonText
} from '@ionic/react';
import './ServiceDetailsForm.css';

/**
 * ServiceDetailsForm - Formulario para detalles del servicio actual
 * Pregunta cosas que cambian por servicio: problema, sótano, peso
 * 
 * @param {Object} vehicleCategory - Categoría del vehículo { id, name }
 * @param {Object} initialData - Datos iniciales del formulario
 * @param {Function} onDataChange - Callback cuando cambian los datos
 * @param {Object} errors - Objeto con errores de validación
 */
const ServiceDetailsForm = ({ vehicleCategory, initialData = {}, onDataChange, errors = {} }) => {
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
  const canBeInBasement = ['MOTOS', 'AUTOS', 'CAMIONETAS', 'ELECTRICOS'].includes(categoryId);

  // Verificar si es camión (pregunta peso)
  const isTruck = categoryId === 'CAMIONES';

  return (
    <div className="service-details-form">
      {/* Problema actual - TODOS los vehículos */}
      <div className="service-field">
        <IonLabel className="service-label">
          ¿Cuál es el problema? <span className="required">*</span>
        </IonLabel>
        <IonItem 
          lines="none" 
          className={`service-item textarea-item ${errors.problem ? 'ion-invalid' : ''}`}
        >
          <IonTextarea
            value={data?.problem || ''}
            onIonInput={(e) => handleChange('problem', e.detail.value)}
            placeholder="Ej: Se descompuso la batería del carro"
            rows={4}
            maxlength={500}
          />
        </IonItem>
        <div className="service-field-footer">
          {errors.problem ? (
            <IonText color="danger" className="service-error">
              <p>{errors.problem}</p>
            </IonText>
          ) : (
            <IonText className="service-helper">
              <p>{(data?.problem?.length || 0)}/500 caracteres</p>
            </IonText>
          )}
        </div>
      </div>

      {/* Sótano - Para MOTOS, AUTOS, CAMIONETAS, ELECTRICOS */}
      {canBeInBasement && (
        <div className="service-field">
          <div className="service-checkbox-wrapper">
            <IonCheckbox
              checked={data?.basement?.isInBasement || false}
              onIonChange={(e) => handleChange('basement', {
                ...data?.basement,
                isInBasement: e.detail.checked,
                level: e.detail.checked ? data?.basement?.level : null
              })}
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
                className={`service-item ${errors.basementLevel ? 'ion-invalid' : ''}`}
              >
                <IonInput
                  type="number"
                  min="-10"
                  max="-1"
                  value={data?.basement?.level}
                  onIonInput={(e) => handleChange('basement', {
                    ...data?.basement,
                    level: parseInt(e.detail.value)
                  })}
                  placeholder="-1, -2, -3..."
                />
              </IonItem>
              {errors.basementLevel ? (
                <IonText color="danger" className="service-error">
                  <p>{errors.basementLevel}</p>
                </IonText>
              ) : (
                <IonText className="service-helper">
                  <p>Los niveles inferiores incrementan el costo del servicio</p>
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
              onIonChange={(e) => handleChange('truckCurrentState', {
                ...data?.truckCurrentState,
                isLoaded: e.detail.checked,
                currentWeight: e.detail.checked ? data?.truckCurrentState?.currentWeight : null
              })}
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
                className={`service-item ${errors.weight ? 'ion-invalid' : ''}`}
              >
                <IonInput
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="50"
                  value={data?.truckCurrentState?.currentWeight}
                  onIonInput={(e) => handleChange('truckCurrentState', {
                    ...data?.truckCurrentState,
                    currentWeight: parseFloat(e.detail.value)
                  })}
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

