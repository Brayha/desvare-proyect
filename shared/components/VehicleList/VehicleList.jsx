import React from 'react';
import {
  IonList,
  IonItem,
  IonLabel,
  IonText,
  IonButton,
  IonIcon,
  IonSpinner,
  IonCard,
  IonCardContent
} from '@ionic/react';
import { addOutline, trashOutline } from 'ionicons/icons';
import './VehicleList.css';

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
  showDelete = false
}) => {
  // Obtener icono según la categoría
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

  // Obtener etiquetas adicionales del vehículo
  const getVehicleBadges = (vehicle) => {
    const badges = [];

    // Blindado
    if (vehicle.isArmored) {
      badges.push({ text: 'Blindado', color: 'warning' });
    }

    // Camión
    if (vehicle.truckData) {
      badges.push({ text: vehicle.truckData.trailerType, color: 'medium' });
      badges.push({ text: `${vehicle.truckData.length}m`, color: 'medium' });
    }

    // Bus
    if (vehicle.busData) {
      badges.push({ text: `${vehicle.busData.passengerCapacity} pasajeros`, color: 'medium' });
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
          const isSelected = selectedVehicle?.id === vehicle.id || selectedVehicle?._id === vehicle._id;
          const badges = getVehicleBadges(vehicle);

          return (
            <IonCard
              key={vehicle.id || vehicle._id}
              button
              className={`vehicle-card ${isSelected ? 'vehicle-card-selected' : ''}`}
              onClick={() => onSelect(vehicle)}
            >
              <IonCardContent className="vehicle-card-content">
                <div className="vehicle-info">
                  <div className="vehicle-icon">
                    {getCategoryIcon(vehicle.category?.id)}
                  </div>
                  
                  <div className="vehicle-details">
                    <div className="vehicle-header">
                      <h3 className="vehicle-name">
                        {vehicle.brand?.name} {vehicle.model?.name}
                      </h3>
                      {isSelected && (
                        <div className="vehicle-check">✓</div>
                      )}
                    </div>
                    
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
              </IonCardContent>
            </IonCard>
          );
        })}
      </IonList>

      {/* Botón para agregar nuevo vehículo */}
      <div className="vehicle-list-footer">
        <IonButton
          expand="block"
          fill="outline"
          onClick={onAddNew}
          className="add-vehicle-button"
        >
          <IonIcon icon={addOutline} slot="start" />
          Agregar otro vehículo
        </IonButton>
      </div>
    </div>
  );
};

export { VehicleList };
export default VehicleList;

