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
import "./VehicleBrandSelector.css";

/**
 * VehicleBrandSelector - Selector de marca de vehículo
 * Lista de marcas con búsqueda
 *
 * @param {Array} brands - Lista de marcas desde la API
 * @param {Object} selectedBrand - Marca seleccionada
 * @param {Object} selectedCategory - Categoría seleccionada en el paso anterior
 * @param {Function} onSelect - Callback cuando se selecciona una marca
 * @param {Boolean} loading - Estado de carga
 */
const VehicleBrandSelector = ({ brands, selectedBrand, selectedCategory, onSelect, loading }) => {
  const [searchText, setSearchText] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customBrandName, setCustomBrandName] = useState("");

  // Filtrar marcas por búsqueda
  const filteredBrands =
    brands?.filter((brand) =>
      brand.name.toLowerCase().includes(searchText.toLowerCase())
    ) || [];

  if (loading) {
    return (
      <div className="vehicle-brand-loading">
        <IonSpinner name="crescent" />
        <IonText color="medium">
          <p>Cargando marcas...</p>
        </IonText>
      </div>
    );
  }

  if (!brands || brands.length === 0) {
    return (
      <div className="vehicle-brand-empty">
        <IonText color="medium">
          <p>No hay marcas disponibles</p>
        </IonText>
      </div>
    );
  }

  return (
    <div className="vehicle-brand-selector">
      {selectedCategory && (
        <div className="vehicle-list-type">
          <div className="select-vehicle-added-card-content">
            <div className="vehicle-added-card-content-image-container">
              <img
                src={getVehicleImage(selectedCategory.id)}
                alt={selectedCategory.name}
                style={{ width: '48px', height: '48px', objectFit: 'contain' }}
              />
            </div>
            <div className="vehicle-added-card-content-text">
              <h3 className="vehicle-brand-name">
                {selectedCategory.name}
              </h3>
            </div>
          </div>
        </div>
      )}

      <div className="filter-container">
        <IonSearchbar
          value={searchText}
          onIonInput={(e) => setSearchText(e.detail.value)}
          placeholder="Buscar marca..."
          debounce={300}
          className="brand-searchbar"
        />
        {filteredBrands.length === 0 && !showCustomInput ? (
          <div className="vehicle-brand-empty">
            <IonText color="medium">
              <p>No se encontraron marcas con "{searchText}"</p>
            </IonText>
          </div>
        ) : (
          <IonList className="brand-list">
            {filteredBrands.map((brand) => (
              <IonItem
                key={brand.id}
                button
                className={`brand-item ${
                  selectedBrand?.id === brand.id ? "brand-item-selected" : ""
                }`}
                onClick={() => onSelect(brand)}
              >
                <IonLabel>
                  <h3 className="brand-name">{brand.name}</h3>
                </IonLabel>
                {selectedBrand?.id === brand.id && (
                  <div className="brand-check" slot="end">
                    ✓
                  </div>
                )}
              </IonItem>
            ))}
          </IonList>
        )}

        {/* Opción: No encuentro mi marca */}
        {!showCustomInput ? (
          <div className="other-option-trigger" onClick={() => setShowCustomInput(true)}>
            <IonIcon icon={helpCircleOutline} className="other-option-icon" />
            <span>No encuentro mi marca</span>
          </div>
        ) : (
          <div className="other-option-form">
            <div className="other-option-form-header">
              <IonText><p className="other-option-form-title">Escribe el nombre de la marca</p></IonText>
              <IonIcon
                icon={closeCircleOutline}
                className="other-option-close"
                onClick={() => { setShowCustomInput(false); setCustomBrandName(""); }}
              />
            </div>
            <input
              className="other-option-input"
              type="text"
              placeholder="Ej: Toyota, Renault, BMW..."
              value={customBrandName}
              onChange={(e) => setCustomBrandName(e.target.value)}
              autoFocus
              maxLength={50}
            />
            <button
              className="other-option-confirm"
              disabled={!customBrandName.trim()}
              onClick={() => {
                if (customBrandName.trim()) {
                  onSelect({ id: '__OTHER__', name: customBrandName.trim(), isCustom: true });
                  setShowCustomInput(false);
                  setCustomBrandName("");
                }
              }}
            >
              Usar esta marca
              <IonIcon icon={arrowForwardOutline} style={{ marginLeft: '6px' }} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export { VehicleBrandSelector };
export default VehicleBrandSelector;
