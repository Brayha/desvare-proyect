import React from 'react';
import { IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonText } from '@ionic/react';
import './VehicleCategorySelector.css';

/**
 * VehicleCategorySelector - Selector de categoría de vehículo
 * Muestra un grid con las categorías disponibles y sus iconos
 * 
 * @param {Array} categories - Lista de categorías desde la API
 * @param {Object} selectedCategory - Categoría seleccionada
 * @param {Function} onSelect - Callback cuando se selecciona una categoría
 */
const VehicleCategorySelector = ({ categories, selectedCategory, onSelect }) => {
  // Mapeo de iconos según la categoría (usando iconsax-react)
  const getCategoryIcon = (categoryId) => {
    const icons = {
      'MOTOS': '🏍️',
      'AUTOS': '🚗',
      'CAMIONETAS': '🚙',
      'CAMIONES': '🚚',
      'BUSES': '🚌',
      'ELECTRICOS': '⚡'
    };
    return icons[categoryId] || '🚗';
  };

  if (!categories || categories.length === 0) {
    return (
      <div className="vehicle-category-empty">
        <IonText color="medium">
          <p>No hay categorías disponibles</p>
        </IonText>
      </div>
    );
  }

  return (
    <div className="vehicle-category-selector">
      <IonGrid>
        <IonRow>
          {categories.map((category) => (
            <IonCol size="6" size-md="4" key={category.id}>
              <IonCard
                button
                className={`category-card ${
                  selectedCategory?.id === category.id ? 'category-card-selected' : ''
                }`}
                onClick={() => onSelect(category)}
              >
                <IonCardContent className="category-card-content">
                  <div className="category-icon">
                    {getCategoryIcon(category.id)}
                  </div>
                  <IonText>
                    <h3 className="category-name">{category.name}</h3>
                  </IonText>
                </IonCardContent>
              </IonCard>
            </IonCol>
          ))}
        </IonRow>
      </IonGrid>
    </div>
  );
};

export { VehicleCategorySelector };
export default VehicleCategorySelector;

