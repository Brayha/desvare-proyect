import React from 'react';
import { IonText } from '@ionic/react';
import { Truck } from 'iconsax-react';
import './TruckTypeSelector.css';

/**
 * Componente para seleccionar el tipo de grúa (Liviana o Pesada)
 */
const TruckTypeSelector = ({ selectedType, onSelect, error }) => {
  const truckTypes = [
    {
      id: 'GRUA_LIVIANA',
      name: 'Grúa Liviana',
      icon: '🚙',
      description: 'Camionetas, pickups y vehículos pequeños modificados',
      examples: 'Ej: Toyota Hilux, Chevrolet D-MAX, Nissan Frontier',
      canPickup: 'Puede cargar: Motos, Autos pequeños'
    },
    {
      id: 'GRUA_PESADA',
      name: 'Grúa Pesada',
      icon: '🚚',
      description: 'Camiones, cabezotes y vehículos de carga modificados',
      examples: 'Ej: Chevrolet NPR, Hino, Mitsubishi Canter, Isuzu',
      canPickup: 'Puede cargar: Autos, Camionetas, Camiones, Buses'
    }
  ];

  return (
    <div className="truck-type-selector">
      <div className="selector-header">
        <Truck size="32" color="#667eea" variant="Bold" />
        <IonText>
          <h2>¿Qué tipo de grúa tienes?</h2>
          <p>Selecciona el tipo de vehículo base de tu grúa</p>
        </IonText>
      </div>

      <div className="truck-type-options">
        {truckTypes.map((type) => (
          <div
            key={type.id}
            className={`truck-type-card ${selectedType === type.id ? 'selected' : ''}`}
            onClick={() => onSelect(type.id)}
          >
            <div className="truck-type-icon">{type.icon}</div>
            <div className="truck-type-content">
              <h3>{type.name}</h3>
              <p className="truck-type-description">{type.description}</p>
              <p className="truck-type-examples">{type.examples}</p>
              <p className="truck-type-capacity">{type.canPickup}</p>
            </div>
            {selectedType === type.id && (
              <div className="truck-type-check">✓</div>
            )}
          </div>
        ))}
      </div>

      {error && (
        <IonText color="danger" className="error-message">
          <small>{error}</small>
        </IonText>
      )}
    </div>
  );
};

export default TruckTypeSelector;

