import React, { useState } from 'react';
import { IonText, IonSearchbar, IonSpinner, IonInput } from '@ionic/react';
import { Setting3 } from 'iconsax-react';
import './TruckModelSelector.css';

/**
 * Componente para seleccionar el modelo del vehículo base de la grúa
 * Incluye opción "Otro" para modelos no listados
 */
const TruckModelSelector = ({ 
  models = [], 
  selectedModel, 
  customModel,
  brandName,
  onSelect, 
  onCustomModelChange,
  isLoading,
  error 
}) => {
  const [searchText, setSearchText] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);

  // Filtrar modelos según búsqueda
  const filteredModels = models.filter(model =>
    model.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleModelSelect = (model) => {
    setShowOtherInput(false);
    onSelect(model);
    if (onCustomModelChange) {
      onCustomModelChange(''); // Limpiar custom model si se selecciona del catálogo
    }
  };

  const handleOtherSelect = () => {
    setShowOtherInput(true);
    onSelect({ id: 'OTHER', name: 'Otro' });
  };

  return (
    <div className="truck-model-selector">
      <div className="selector-header">
        <Setting3 size="32" color="#667eea" variant="Bold" />
        <IonText>
          <h2>Modelo del vehículo</h2>
          <p>Selecciona el modelo de {brandName || 'tu vehículo'}</p>
        </IonText>
      </div>

      {/* Buscador */}
      <IonSearchbar
        value={searchText}
        onIonInput={(e) => setSearchText(e.detail.value)}
        placeholder="Buscar modelo..."
        className="model-searchbar"
        animated
      />

      {isLoading ? (
        <div className="loading-container">
          <IonSpinner name="crescent" color="primary" />
          <IonText color="medium">
            <p>Cargando modelos...</p>
          </IonText>
        </div>
      ) : (
        <>
          {/* Lista de modelos */}
          <div className="models-list">
            {filteredModels.map((model) => (
              <div
                key={model.id}
                className={`model-item ${selectedModel?.id === model.id ? 'selected' : ''}`}
                onClick={() => handleModelSelect(model)}
              >
                <div className="model-content">
                  <span className="model-name">{model.name}</span>
                </div>
                {selectedModel?.id === model.id && (
                  <div className="model-check">✓</div>
                )}
              </div>
            ))}

            {/* Opción "Otro" */}
            <div
              className={`model-item model-item-other ${selectedModel?.id === 'OTHER' ? 'selected' : ''}`}
              onClick={handleOtherSelect}
            >
              <div className="model-content">
                <span className="model-name">✏️ Otro (Escribir modelo)</span>
              </div>
              {selectedModel?.id === 'OTHER' && (
                <div className="model-check">✓</div>
              )}
            </div>

            {filteredModels.length === 0 && searchText && (
              <div className="no-results">
                <IonText color="medium">
                  <p>No se encontraron modelos con "{searchText}"</p>
                  <p>Puedes seleccionar "Otro" para escribirlo manualmente</p>
                </IonText>
              </div>
            )}
          </div>

          {/* Input para modelo personalizado */}
          {showOtherInput && selectedModel?.id === 'OTHER' && (
            <div className="custom-model-input">
              <IonText>
                <label>Escribe el modelo de tu vehículo:</label>
              </IonText>
              <IonInput
                value={customModel}
                onIonInput={(e) => onCustomModelChange && onCustomModelChange(e.detail.value)}
                placeholder="Ej: NPR 4.5, FRR, etc."
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

export default TruckModelSelector;

