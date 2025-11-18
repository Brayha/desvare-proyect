import React from "react";
import {
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonText,
} from "@ionic/react";
import { getVehicleImage } from "../../../client-pwa/src/utils/vehicleImages";
import "./VehicleCategorySelector.css";

/**
 * VehicleCategorySelector - Selector de categoría de vehículo
 * Muestra un grid con las categorías disponibles y sus iconos
 *
 * @param {Array} categories - Lista de categorías desde la API
 * @param {Object} selectedCategory - Categoría seleccionada
 * @param {Function} onSelect - Callback cuando se selecciona una categoría
 */
const VehicleCategorySelector = ({
  categories,
  selectedCategory,
  onSelect,
}) => {
  // Obtener imagen SVG según la categoría
  const getCategoryImage = (categoryId) => {
    return getVehicleImage(categoryId);
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
      {categories.map((category) => (
        <div className="vehicle-list-type" key={category.id}>
          <div className="select-vehicle-added-card-content" onClick={() => onSelect(category)}>
            <div className="vehicle-added-card-content-image-container">
              <img src={getCategoryImage(category.id)} alt={category.name} style={{
                width: "60px",
                height: "60px",
                objectFit: "contain",
              }} />
            </div>
            <div className="vehicle-added-card-content-text">
              <h3 className="vehicle-brand-name">{category.name}</h3>
            </div>
          </div>
        </div>
      ))}

      {/* <IonGrid>
        <IonRow>
          {categories.map((category) => (
            <IonCol size="6" size-md="4" key={category.id}>
              <IonCard
                button
                className={`category-card ${
                  selectedCategory?.id === category.id
                    ? "category-card-selected"
                    : ""
                }`}
                onClick={() => onSelect(category)}
              >
                <IonCardContent className="category-card-content">
                  <div className="category-icon">
                    <img
                      src={getCategoryImage(category.id)}
                      alt={category.name}
                      style={{
                        width: "80px",
                        height: "80px",
                        objectFit: "contain",
                      }}
                    />
                  </div>
                  <IonText>
                    <h3 className="category-name">{category.name}</h3>
                  </IonText>
                </IonCardContent>
              </IonCard>
            </IonCol>
          ))}
        </IonRow>
      </IonGrid> */}
    </div>
  );
};

export { VehicleCategorySelector };
export default VehicleCategorySelector;
