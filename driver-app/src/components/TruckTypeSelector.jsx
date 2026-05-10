import React from 'react';
import { IonText } from '@ionic/react';
import { Truck } from 'iconsax-react';
import './TruckTypeSelector.css';

/**
 * Componente para seleccionar el tipo de grúa
 * 3 categorías basadas en el mercado colombiano:
 *  - GRUA_MOTO:    furgones y pickups pequeños para motos
 *  - GRUA_LIVIANA: camiones medianos para autos y camionetas
 *  - GRUA_PESADA:  camiones grandes para camiones, buses y tractomulas
 */
const TruckTypeSelector = ({ selectedType, onSelect, onAutoAdvance, error }) => {
  const truckTypes = [
    {
      id: 'GRUA_MOTO',
      name: 'Grúa para Moto',
      icon: '🛵',
      description: 'Furgones o pickups pequeños adaptados para transportar motos',
      examples: 'Ej: Suzuki Carry, Kia Bongo, Hyundai H100 Porter, DFSK, Chevrolet N300',
      canPickup: 'Carga: Motos y ciclomotores',
      badge: 'Liviana',
    },
    {
      id: 'GRUA_LIVIANA',
      name: 'Grúa Liviana',
      icon: '🚙',
      description: 'Camiones medianos con planchón o gancho para autos y camionetas',
      examples: 'Ej: Chevrolet NPR, Isuzu NQR, Hino 300, Mitsubishi Canter, Foton Aumark',
      canPickup: 'Carga: Autos y camionetas',
      badge: 'Mediana',
    },
    {
      id: 'GRUA_PESADA',
      name: 'Grúa Pesada',
      icon: '🚚',
      description: 'Camiones grandes o cabezotes para recuperación de vehículos pesados',
      examples: 'Ej: Hino 500/700, Volvo FH, Kenworth T440, Mercedes-Benz Actros, Scania',
      canPickup: 'Carga: Camiones, buses y tractomulas',
      badge: 'Pesada',
    },
  ];

  return (
    <div className="truck-type-selector">
      <div className="selector-header">
        <Truck size="32" color="#0055ff" variant="Bold" />
        <IonText>
          <h2>¿Qué tipo de grúa tienes?</h2>
          <p>Selecciona según el vehículo base que usas para trabajar</p>
        </IonText>
      </div>

      <div className="truck-type-options">
        {truckTypes.map((type) => (
          <div
            key={type.id}
            className={`truck-type-card ${selectedType === type.id ? 'selected' : ''}`}
            onClick={() => {
              onSelect(type.id);
              if (onAutoAdvance) setTimeout(onAutoAdvance, 200);
            }}
          >
            <div className="truck-type-icon">{type.icon}</div>
            <div className="truck-type-content">
              <div className="truck-type-name-row">
                <h3>{type.name}</h3>
                <span className="truck-type-badge">{type.badge}</span>
              </div>
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
