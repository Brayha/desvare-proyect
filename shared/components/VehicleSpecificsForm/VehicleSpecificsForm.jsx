import React, { useState } from 'react';
import {
  IonItem,
  IonLabel,
  IonToggle,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonText
} from '@ionic/react';
import './VehicleSpecificsForm.css';

/**
 * VehicleSpecificsForm - Formulario dinámico según tipo de vehículo
 * Muestra campos específicos según la categoría seleccionada
 * 
 * @param {Object} category - Categoría del vehículo { id, name }
 * @param {Object} initialData - Datos iniciales del formulario
 * @param {Function} onDataChange - Callback cuando cambian los datos
 * @param {Object} errors - Objeto con errores de validación
 */
const VehicleSpecificsForm = ({ category, initialData = {}, onDataChange, errors = {} }) => {
  const categoryId = category?.id;
  const [data, setData] = useState(initialData);

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

  // Renderizar campos según la categoría
  const renderFields = () => {
    // Para AUTOS, CAMIONETAS, ELECTRICOS
    if (['AUTOS', 'CAMIONETAS', 'ELECTRICOS'].includes(categoryId)) {
      return (
        <div className="vehicle-specifics-section">
          <IonItem lines="none" className="specifics-item">
            <IonLabel>¿El vehículo es blindado?</IonLabel>
            <IonToggle
              checked={data?.isArmored || false}
              onIonChange={(e) => handleChange('isArmored', e.detail.checked)}
              color="primary"
            />
          </IonItem>
          <IonText className="specifics-helper">
            <p>Los vehículos blindados tienen un costo adicional en el servicio</p>
          </IonText>
        </div>
      );
    }

    // Para CAMIONES
    if (categoryId === 'CAMIONES') {
      return (
        <div className="vehicle-specifics-section">
          {/* Tipo de furgón */}
          <div className="specifics-field">
            <IonLabel className="specifics-label">
              Tipo de furgón <span className="required">*</span>
            </IonLabel>
            <IonItem lines="none" className={`specifics-item ${errors.trailerType ? 'ion-invalid' : ''}`}>
              <IonSelect
                value={data?.truckData?.trailerType}
                onIonChange={(e) => handleChange('truckData', { 
                  ...data?.truckData, 
                  trailerType: e.detail.value 
                })}
                placeholder="Seleccionar tipo"
                interface="action-sheet"
              >
                <IonSelectOption value="varillaje">Varillaje</IonSelectOption>
                <IonSelectOption value="caja_metalica">Caja metálica</IonSelectOption>
              </IonSelect>
            </IonItem>
            {errors.trailerType && (
              <IonText color="danger" className="specifics-error">
                <p>{errors.trailerType}</p>
              </IonText>
            )}
          </div>

          {/* Largo */}
          <div className="specifics-field">
            <IonLabel className="specifics-label">
              Largo (metros) <span className="required">*</span>
            </IonLabel>
            <IonItem lines="none" className={`specifics-item ${errors.length ? 'ion-invalid' : ''}`}>
              <IonInput
                type="number"
                step="0.1"
                min="1"
                max="20"
                value={data?.truckData?.length}
                onIonInput={(e) => handleChange('truckData', { 
                  ...data?.truckData, 
                  length: parseFloat(e.detail.value) 
                })}
                placeholder="Ej: 8.5"
              />
              <IonLabel slot="end">m</IonLabel>
            </IonItem>
            {errors.length && (
              <IonText color="danger" className="specifics-error">
                <p>{errors.length}</p>
              </IonText>
            )}
          </div>

          {/* Alto */}
          <div className="specifics-field">
            <IonLabel className="specifics-label">
              Alto (metros) <span className="required">*</span>
            </IonLabel>
            <IonItem lines="none" className={`specifics-item ${errors.height ? 'ion-invalid' : ''}`}>
              <IonInput
                type="number"
                step="0.1"
                min="1"
                max="6"
                value={data?.truckData?.height}
                onIonInput={(e) => handleChange('truckData', { 
                  ...data?.truckData, 
                  height: parseFloat(e.detail.value) 
                })}
                placeholder="Ej: 3.2"
              />
              <IonLabel slot="end">m</IonLabel>
            </IonItem>
            {errors.height && (
              <IonText color="danger" className="specifics-error">
                <p>{errors.height}</p>
              </IonText>
            )}
          </div>

          {/* Pacha */}
          <div className="specifics-field">
            <IonLabel className="specifics-label">
              Pacha (llantas traseras) <span className="required">*</span>
            </IonLabel>
            <IonItem lines="none" className={`specifics-item ${errors.axleType ? 'ion-invalid' : ''}`}>
              <IonSelect
                value={data?.truckData?.axleType}
                onIonChange={(e) => handleChange('truckData', { 
                  ...data?.truckData, 
                  axleType: e.detail.value 
                })}
                placeholder="Seleccionar tipo"
                interface="action-sheet"
              >
                <IonSelectOption value="sencilla">Sencilla</IonSelectOption>
                <IonSelectOption value="doble">Doble</IonSelectOption>
              </IonSelect>
            </IonItem>
            {errors.axleType && (
              <IonText color="danger" className="specifics-error">
                <p>{errors.axleType}</p>
              </IonText>
            )}
          </div>
        </div>
      );
    }

    // Para BUSES
    if (categoryId === 'BUSES') {
      return (
        <div className="vehicle-specifics-section">
          {/* Largo */}
          <div className="specifics-field">
            <IonLabel className="specifics-label">
              Largo (metros) <span className="required">*</span>
            </IonLabel>
            <IonItem lines="none" className={`specifics-item ${errors.length ? 'ion-invalid' : ''}`}>
              <IonInput
                type="number"
                step="0.1"
                min="5"
                max="20"
                value={data?.busData?.length}
                onIonInput={(e) => handleChange('busData', { 
                  ...data?.busData, 
                  length: parseFloat(e.detail.value) 
                })}
                placeholder="Ej: 12.0"
              />
              <IonLabel slot="end">m</IonLabel>
            </IonItem>
            {errors.length && (
              <IonText color="danger" className="specifics-error">
                <p>{errors.length}</p>
              </IonText>
            )}
          </div>

          {/* Alto */}
          <div className="specifics-field">
            <IonLabel className="specifics-label">
              Alto (metros) <span className="required">*</span>
            </IonLabel>
            <IonItem lines="none" className={`specifics-item ${errors.height ? 'ion-invalid' : ''}`}>
              <IonInput
                type="number"
                step="0.1"
                min="2"
                max="5"
                value={data?.busData?.height}
                onIonInput={(e) => handleChange('busData', { 
                  ...data?.busData, 
                  height: parseFloat(e.detail.value) 
                })}
                placeholder="Ej: 3.5"
              />
              <IonLabel slot="end">m</IonLabel>
            </IonItem>
            {errors.height && (
              <IonText color="danger" className="specifics-error">
                <p>{errors.height}</p>
              </IonText>
            )}
          </div>

          {/* Pacha */}
          <div className="specifics-field">
            <IonLabel className="specifics-label">
              Pacha (llantas traseras) <span className="required">*</span>
            </IonLabel>
            <IonItem lines="none" className={`specifics-item ${errors.axleType ? 'ion-invalid' : ''}`}>
              <IonSelect
                value={data?.busData?.axleType}
                onIonChange={(e) => handleChange('busData', { 
                  ...data?.busData, 
                  axleType: e.detail.value 
                })}
                placeholder="Seleccionar tipo"
                interface="action-sheet"
              >
                <IonSelectOption value="sencilla">Sencilla</IonSelectOption>
                <IonSelectOption value="doble">Doble</IonSelectOption>
              </IonSelect>
            </IonItem>
            {errors.axleType && (
              <IonText color="danger" className="specifics-error">
                <p>{errors.axleType}</p>
              </IonText>
            )}
          </div>

          {/* Capacidad de pasajeros */}
          <div className="specifics-field">
            <IonLabel className="specifics-label">
              Capacidad de pasajeros <span className="required">*</span>
            </IonLabel>
            <IonItem lines="none" className={`specifics-item ${errors.passengerCapacity ? 'ion-invalid' : ''}`}>
              <IonInput
                type="number"
                min="10"
                max="100"
                value={data?.busData?.passengerCapacity}
                onIonInput={(e) => handleChange('busData', { 
                  ...data?.busData, 
                  passengerCapacity: parseInt(e.detail.value) 
                })}
                placeholder="Ej: 50"
              />
              <IonLabel slot="end">pasajeros</IonLabel>
            </IonItem>
            {errors.passengerCapacity && (
              <IonText color="danger" className="specifics-error">
                <p>{errors.passengerCapacity}</p>
              </IonText>
            )}
          </div>
        </div>
      );
    }

    // Para MOTOS no hay campos específicos
    return (
      <div className="vehicle-specifics-empty">
        <IonText color="medium" className="empty-message">
          <p>Las motocicletas no requieren información adicional específica.</p>
          <p>Presiona "Siguiente" para continuar.</p>
        </IonText>
      </div>
    );
  };

  return (
    <div className="vehicle-specifics-form">
      {renderFields()}
    </div>
  );
};

export { VehicleSpecificsForm };
export default VehicleSpecificsForm;

