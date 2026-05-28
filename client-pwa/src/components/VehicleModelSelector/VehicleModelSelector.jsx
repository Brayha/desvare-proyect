import React, { useState } from "react";
import {
  IonList,
  IonItem,
  IonLabel,
  IonSearchbar,
  IonText,
  IonSpinner,
  IonIcon,
} from "@ionic/react";
import { helpCircleOutline, arrowForwardOutline, closeCircleOutline } from "ionicons/icons";
import { getVehicleImage } from "../../utils/vehicleImages";
import "./VehicleModelSelector.css";

/**
 * VehicleModelSelector - Selector de modelo de vehículo
 * Lista de modelos con búsqueda
 *
 * @param {Array} models - Lista de modelos desde la API
 * @param {Object} selectedModel - Modelo seleccionado
 * @param {Object} selectedCategory - Categoría seleccionada en pasos anteriores
 * @param {Object} selectedBrand - Marca seleccionada en el paso anterior
 * @param {Function} onSelect - Callback cuando se selecciona un modelo
 * @param {Boolean} loading - Estado de carga
 */
const VehicleModelSelector = ({
  models,
  selectedModel,
  selectedCategory,
  selectedBrand,
  onSelect,
  loading,
  isCustomBrand,
}) => {
  const [searchText, setSearchText] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(isCustomBrand || false);
  const [customModelName, setCustomModelName] = useState("");

  // Filtrar modelos por búsqueda
  const filteredModels =
    models?.filter((model) =>
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

  // Si la marca es custom o no hay modelos disponibles, mostrar directamente el formulario custom
  if (isCustomBrand || (!loading && (!models || models.length === 0))) {
    return (
      <div className="vehicle-brand-selector">
        {selectedCategory && selectedBrand && (
          <div className="vehicle-list-type">
            <div className="select-vehicle-added-card-content">
              <div className="vehicle-added-card-content-image-container">
                <img
                  src={getVehicleImage(selectedCategory.id)}
                  alt={selectedCategory.name}
                  style={{ width: "48px", height: "48px", objectFit: "contain" }}
                />
              </div>
              <div className="vehicle-added-card-content-text">
                <h3 className="vehicle-brand-name">{selectedBrand.name}</h3>
              </div>
            </div>
          </div>
        )}
        <div className="filter-container">
          <div className="other-option-form" style={{ marginTop: '8px' }}>
            <div className="other-option-form-header">
              <IonText><p className="other-option-form-title">
                {isCustomBrand ? 'Escribe el modelo o referencia' : 'No hay modelos — escribe el tuyo'}
              </p></IonText>
            </div>
            <input
              className="other-option-input"
              type="text"
              placeholder="Ej: Corolla, Civic, 208, Actros..."
              value={customModelName}
              onChange={(e) => setCustomModelName(e.target.value)}
              autoFocus
              maxLength={60}
            />
            <button
              className="other-option-confirm"
              disabled={!customModelName.trim()}
              onClick={() => {
                if (customModelName.trim()) {
                  onSelect({ id: '__OTHER__', name: customModelName.trim(), isCustom: true });
                  setCustomModelName("");
                }
              }}
            >
              Usar este modelo
              <IonIcon icon={arrowForwardOutline} style={{ marginLeft: '6px' }} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vehicle-brand-selector">
      {selectedCategory && selectedBrand && (
        <div className="vehicle-list-type">
          <div className="select-vehicle-added-card-content">
            <div className="vehicle-added-card-content-image-container">
              <img
                src={getVehicleImage(selectedCategory.id)}
                alt={selectedCategory.name}
                style={{ width: "48px", height: "48px", objectFit: "contain" }}
              />
            </div>
            <div className="vehicle-added-card-content-text">
              <h3 className="vehicle-brand-name">{selectedBrand.name}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="filter-container">
        <IonSearchbar
          value={searchText}
          onIonInput={(e) => setSearchText(e.detail.value)}
          placeholder="Buscar modelo..."
          debounce={300}
          className="brand-searchbar"
        />

        {filteredModels.length === 0 && !showCustomInput ? (
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
                  selectedModel?.id === model.id ? "model-item-selected" : ""
                }`}
                onClick={() => onSelect(model)}
              >
                <IonLabel>
                  <h3 className="model-name">{model.name}</h3>
                </IonLabel>
                {selectedModel?.id === model.id && (
                  <div className="model-check" slot="end">
                    ✓
                  </div>
                )}
              </IonItem>
            ))}
          </IonList>
        )}

        {/* Opción: No encuentro el modelo */}
        {!showCustomInput ? (
          <div className="other-option-trigger" onClick={() => setShowCustomInput(true)}>
            <IonIcon icon={helpCircleOutline} className="other-option-icon" />
            <span>No encuentro el modelo / referencia</span>
          </div>
        ) : (
          <div className="other-option-form">
            <div className="other-option-form-header">
              <IonText><p className="other-option-form-title">Escribe el modelo o referencia</p></IonText>
              <IonIcon
                icon={closeCircleOutline}
                className="other-option-close"
                onClick={() => { setShowCustomInput(false); setCustomModelName(""); }}
              />
            </div>
            <input
              className="other-option-input"
              type="text"
              placeholder="Ej: Corolla, Civic, 208, Actros..."
              value={customModelName}
              onChange={(e) => setCustomModelName(e.target.value)}
              autoFocus
              maxLength={60}
            />
            <button
              className="other-option-confirm"
              disabled={!customModelName.trim()}
              onClick={() => {
                if (customModelName.trim()) {
                  onSelect({ id: '__OTHER__', name: customModelName.trim(), isCustom: true });
                  setShowCustomInput(false);
                  setCustomModelName("");
                }
              }}
            >
              Usar este modelo
              <IonIcon icon={arrowForwardOutline} style={{ marginLeft: '6px' }} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export { VehicleModelSelector };
export default VehicleModelSelector;
