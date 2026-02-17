/**
 * Utilidad para obtener la imagen SVG correspondiente a cada categoría de vehículo
 */

// Importar todas las imágenes SVG de vehículos
import motoSvg from '../assets/img/vehicles/moto.svg';
import carSvg from '../assets/img/vehicles/car.svg';
import camionetaSvg from '../assets/img/vehicles/camioneta.svg';
import camionSvg from '../assets/img/vehicles/camion.svg';
import busSvg from '../assets/img/vehicles/bus.svg';

/**
 * Mapa de categoryId a imagen SVG
 */
const VEHICLE_IMAGES = {
  'MOTOS': motoSvg,
  'AUTOS': carSvg,
  'CAMIONETAS': camionetaSvg,
  'CAMIONES': camionSvg,
  'BUSES': busSvg,
  'ELECTRICOS': carSvg, // Usan la misma imagen que autos
};

/**
 * Obtiene la imagen SVG correspondiente a una categoría de vehículo
 * 
 * @param {string} categoryId - ID de la categoría (MOTOS, AUTOS, CAMIONETAS, etc.)
 * @returns {string} - URL de la imagen SVG
 */
export const getVehicleImage = (categoryId) => {
  if (!categoryId) {
    return carSvg; // Imagen por defecto
  }

  // Convertir a mayúsculas por si acaso
  const normalizedId = categoryId.toUpperCase();
  
  return VEHICLE_IMAGES[normalizedId] || carSvg;
};

/**
 * Obtiene la imagen SVG directamente desde un objeto de vehículo
 * 
 * @param {Object} vehicle - Objeto vehículo con category.id
 * @returns {string} - URL de la imagen SVG
 */
export const getVehicleImageFromVehicle = (vehicle) => {
  const categoryId = vehicle?.category?.id;
  return getVehicleImage(categoryId);
};

export default {
  getVehicleImage,
  getVehicleImageFromVehicle,
  VEHICLE_IMAGES,
};

