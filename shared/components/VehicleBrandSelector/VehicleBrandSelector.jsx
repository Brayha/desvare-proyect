import React, { useState } from 'react';
import {
  IonList,
  IonItem,
  IonLabel,
  IonSearchbar,
  IonText,
  IonSpinner
} from '@ionic/react';
import './VehicleBrandSelector.css';

/**
 * VehicleBrandSelector - Selector de marca de vehículo
 * Lista de marcas con búsqueda
 * 
 * @param {Array} brands - Lista de marcas desde la API
 * @param {Object} selectedBrand - Marca seleccionada
 * @param {Function} onSelect - Callback cuando se selecciona una marca
 * @param {Boolean} loading - Estado de carga
 */
const VehicleBrandSelector = ({ brands, selectedBrand, onSelect, loading }) => {
  const [searchText, setSearchText] = useState('');

  // Filtrar marcas por búsqueda
  const filteredBrands = brands?.filter((brand) =>
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
      <IonSearchbar
        value={searchText}
        onIonInput={(e) => setSearchText(e.detail.value)}
        placeholder="Buscar marca..."
        debounce={300}
        className="brand-searchbar"
      />

      {filteredBrands.length === 0 ? (
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
                selectedBrand?.id === brand.id ? 'brand-item-selected' : ''
              }`}
              onClick={() => onSelect(brand)}
            >
              <IonLabel>
                <h3 className="brand-name">{brand.name}</h3>
              </IonLabel>
              {selectedBrand?.id === brand.id && (
                <div className="brand-check" slot="end">✓</div>
              )}
            </IonItem>
          ))}
        </IonList>
      )}
    </div>
  );
};

export { VehicleBrandSelector };
export default VehicleBrandSelector;

