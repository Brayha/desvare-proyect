import React, { useState } from 'react';
import { IonText, IonSearchbar, IonSpinner, IonInput } from '@ionic/react';
import { SearchNormal1, Car } from 'iconsax-react';
import './TruckBrandSelector.css';

/**
 * Componente para seleccionar la marca del vehículo base de la grúa
 * Incluye opción "Otro" para marcas no listadas
 */
const TruckBrandSelector = ({ 
  brands = [], 
  selectedBrand, 
  customBrand,
  onSelect, 
  onCustomBrandChange,
  isLoading,
  error 
}) => {
  const [searchText, setSearchText] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);

  // Filtrar marcas según búsqueda
  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleBrandSelect = (brand) => {
    setShowOtherInput(false);
    onSelect(brand);
    if (onCustomBrandChange) {
      onCustomBrandChange(''); // Limpiar custom brand si se selecciona del catálogo
    }
  };

  const handleOtherSelect = () => {
    setShowOtherInput(true);
    onSelect({ id: 'OTHER', name: 'Otro' });
  };

  return (
    <div className="truck-brand-selector">
      <div className="selector-header">
        <IonText>
          <h2>Marca de la grúa</h2>
          <p>Selecciona la marca de la grúa que usarás para recoger los vehículos de los clientes</p>
        </IonText>
      </div>

      {/* Buscador */}
      <IonSearchbar
        value={searchText}
        onIonInput={(e) => setSearchText(e.detail.value)}
        placeholder="Buscar marca..."
        className="brand-searchbar"
        animated
      />

      {isLoading ? (
        <div className="loading-container">
          <IonSpinner name="crescent" color="primary" />
          <IonText color="medium">
            <p>Cargando marcas...</p>
          </IonText>
        </div>
      ) : (
        <>
          {/* Lista de marcas */}
          <div className="brands-list">
            {filteredBrands.map((brand) => (
              <div
                key={brand.id}
                className={`brand-item ${selectedBrand?.id === brand.id ? 'selected' : ''}`}
                onClick={() => handleBrandSelect(brand)}
              >
                <div className="brand-content">
                  <span className="brand-name">{brand.name}</span>
                </div>
                {selectedBrand?.id === brand.id && (
                  <div className="brand-check">✓</div>
                )}
              </div>
            ))}

            {/* Opción "Otro" */}
            <div
              className={`brand-item brand-item-other ${selectedBrand?.id === 'OTHER' ? 'selected' : ''}`}
              onClick={handleOtherSelect}
            >
              <div className="brand-content">
                <span className="brand-name">✏️ Otro (Escribir marca)</span>
              </div>
              {selectedBrand?.id === 'OTHER' && (
                <div className="brand-check">✓</div>
              )}
            </div>

            {filteredBrands.length === 0 && searchText && (
              <div className="no-results">
                <IonText color="medium">
                  <p>No se encontraron marcas con "{searchText}"</p>
                  <p>Puedes seleccionar "Otro" para escribirla manualmente</p>
                </IonText>
              </div>
            )}
          </div>

          {/* Input para marca personalizada */}
          {showOtherInput && selectedBrand?.id === 'OTHER' && (
            <div className="custom-brand-input">
              <IonText>
                <label>Escribe la marca de tu vehículo:</label>
              </IonText>
              <IonInput
                value={customBrand}
                onIonInput={(e) => onCustomBrandChange && onCustomBrandChange(e.detail.value)}
                placeholder="Ej: JAC, Dongfeng, etc."
                className="custom-input"
                clearInput
              />
            </div>
          )}
        </>
      )}

      {error && (
        <IonText color="danger" className="error-message">
          <small>{error}</small>
        </IonText>
      )}
    </div>
  );
};

export default TruckBrandSelector;

