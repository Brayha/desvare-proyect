import React from "react";
import {
  IonList,
  IonItem,
  IonLabel,
  IonText,
  IonButton,
  IonIcon,
  IonSpinner,
  IonCard,
  IonCardContent,
} from "@ionic/react";
import { addOutline, trashOutline, add } from "ionicons/icons";
import { getVehicleImage } from "../../../client-pwa/src/utils/vehicleImages";
import "./VehicleList.css";

/**
 * VehicleList - Lista de vehículos guardados del usuario
 * Permite seleccionar un vehículo existente o agregar uno nuevo
 *
 * @param {Array} vehicles - Lista de vehículos del usuario
 * @param {Object} selectedVehicle - Vehículo seleccionado
 * @param {Function} onSelect - Callback cuando se selecciona un vehículo
 * @param {Function} onAddNew - Callback para agregar nuevo vehículo
 * @param {Function} onDelete - Callback para eliminar un vehículo (opcional)
 * @param {Boolean} loading - Estado de carga
 * @param {Boolean} showDelete - Mostrar botón de eliminar (default: false)
 */
const VehicleList = ({
  vehicles,
  selectedVehicle,
  onSelect,
  onAddNew,
  onDelete,
  loading = false,
  showDelete = false,
}) => {
  // Obtener imagen SVG según la categoría
  const getCategoryImage = (categoryId) => {
    return getVehicleImage(categoryId);
  };

  // Obtener etiquetas adicionales del vehículo
  const getVehicleBadges = (vehicle) => {
    const badges = [];

    // Blindado
    if (vehicle.isArmored) {
      badges.push({ text: "Blindado", color: "warning" });
    }

    // Camión
    if (vehicle.truckData) {
      badges.push({ text: vehicle.truckData.trailerType, color: "medium" });
      badges.push({ text: `${vehicle.truckData.length}m`, color: "medium" });
    }

    // Bus
    if (vehicle.busData) {
      badges.push({
        text: `${vehicle.busData.passengerCapacity} pasajeros`,
        color: "medium",
      });
    }

    return badges;
  };

  if (loading) {
    return (
      <div className="vehicle-list-loading">
        <IonSpinner name="crescent" />
        <IonText color="medium">
          <p>Cargando vehículos...</p>
        </IonText>
      </div>
    );
  }

  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="vehicle-list-empty">
        <div className="empty-icon">🚗</div>
        <IonText>
          <h2>No tienes vehículos guardados</h2>
          <p>Agrega tu primer vehículo para comenzar</p>
        </IonText>
        <IonButton
          expand="block"
          onClick={onAddNew}
          className="add-vehicle-button"
        >
          <IonIcon icon={addOutline} slot="start" />
          Agregar vehículo
        </IonButton>
      </div>
    );
  }

  return (
    <div className="vehicle-list">
      <IonList className="vehicles-list-container">
        {vehicles.map((vehicle) => {
          const isSelected =
            selectedVehicle?.id === vehicle.id ||
            selectedVehicle?._id === vehicle._id;
          const badges = getVehicleBadges(vehicle);

          return (
            <div
              key={vehicle.id || vehicle._id}
              button
              className="vehicle-added-card-content"
              onClick={() => onSelect(vehicle)}
            >
                  <div className="vehicle-added-card-content-image-container">
                    <div className="vehicle-icon">
                      <img
                        src={getCategoryImage(vehicle.category?.id)}
                        alt={vehicle.category?.name || "Vehículo"}
                        style={{
                          width: "60px",
                          height: "60px",
                          objectFit: "contain",
                        }}
                      />
                    </div>

                        <div className="vehicle-added-card-content-text">
                    <h3 className="vehicle-brand-name">
                      {vehicle.brand?.name} {vehicle.model?.name}
                    </h3>
                    <p className="vehicle-plate">{vehicle.licensePlate}</p>
                    {badges.length > 0 && (
                      <div className="vehicle-badges">
                        {badges.map((badge, index) => (
                          <span
                            key={index}
                            className={`vehicle-badge badge-${badge.color}`}
                          >
                            {badge.text}
                          </span>
                        ))}
                      </div>
                    )}
                    </div>
                  </div>

                  <div className="placa">
                    <p>{vehicle.licensePlate}</p>
                  </div>

                {showDelete && onDelete && (
                  <IonButton
                    fill="clear"
                    color="danger"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(vehicle);
                    }}
                    className="vehicle-delete-button"
                  >
                    <IonIcon icon={trashOutline} slot="icon-only" />
                  </IonButton>
                )}
            </div>
          );
        })}

        <div className="search-button" onClick={onAddNew}>
          <div className="search-button-content">
            <h2>Agrega tu vehículo</h2>
            <p>Moto, carro, camioneta, bus o camión?</p>
          </div>

          <div className="add-button">
            <IonIcon icon={add} />
          </div>
        </div>
      </IonList>
    </div>
  );
};

export { VehicleList };
export default VehicleList;
