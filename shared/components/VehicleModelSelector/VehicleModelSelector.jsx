import React, { useState } from 'react';
import {
  IonList,
  IonItem,
  IonLabel,
  IonSearchbar,
  IonText,
  IonSpinner
} from '@ionic/react';
import './VehicleModelSelector.css';

/**
 * VehicleModelSelector - Selector de modelo de vehículo
 * Lista de modelos con búsqueda
 * 
 * @param {Array} models - Lista de modelos desde la API
 * @param {Object} selectedModel - Modelo seleccionado
 * @param {Function} onSelect - Callback cuando se selecciona un modelo
 * @param {Boolean} loading - Estado de carga
 */
const VehicleModelSelector = ({ models, selectedModel, onSelect, loading }) => {
  const [searchText, setSearchText] = useState('');

  // Filtrar modelos por búsqueda
  const filteredModels = models?.filter((model) =>
    model.name.toLowerCase().includes(searchText.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="vehicle-model-loading">
        <IonSpinner name="crescent" />
        <IonText color="medium">
          <p>Cargando modelos...</p>
        </IonText>
      </div>
    );
  }

  if (!models || models.length === 0) {
    return (
      <div className="vehicle-model-empty">
        <IonText color="medium">
          <p>No hay modelos disponibles para esta marca</p>
        </IonText>
      </div>
    );
  }

  return (
    <div className="vehicle-model-selector">
      <IonSearchbar
        value={searchText}
        onIonInput={(e) => setSearchText(e.detail.value)}
        placeholder="Buscar modelo..."
        debounce={300}
        className="model-searchbar"
      />

      {filteredModels.length === 0 ? (
        <div className="vehicle-model-empty">
          <IonText color="medium">
            <p>No se encontraron modelos con "{searchText}"</p>
          </IonText>
        </div>
      ) : (
        <IonList className="model-list">
          {filteredModels.map((model) => (
            <IonItem
              key={model.id}
              button
              className={`model-item ${
                selectedModel?.id === model.id ? 'model-item-selected' : ''
              }`}
              onClick={() => onSelect(model)}
            >
              <IonLabel>
                <h3 className="model-name">{model.name}</h3>
              </IonLabel>
              {selectedModel?.id === model.id && (
                <div className="model-check" slot="end">✓</div>
              )}
            </IonItem>
          ))}
        </IonList>
      )}
    </div>
  );
};

export { VehicleModelSelector };
export default VehicleModelSelector;

