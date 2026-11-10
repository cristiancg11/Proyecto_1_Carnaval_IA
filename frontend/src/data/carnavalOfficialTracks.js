/**
 * Coordenadas oficiales exactas esquina por esquina de San Juan de Pasto
 * para cada fecha oficial del Carnaval de Negros y Blancos.
 */

import { SENDA_OFICIAL_COORDS } from './sendaCoords';

// 1. Senda Oficial ajustada a las calles reales (Alcaldía de Pasto / Corpocarnaval 2025):
//    Av. Carrera 27 (Normal Superior) -> Calle 19 -> Plaza del Carnaval -> Calle 18 -> Av. Champagnat -> Estadio Libertad
export const TRACK_SENDA_MAGNA = SENDA_OFICIAL_COORDS;

// 2. Canto a la Tierra (3 de Enero): según la Alcaldía (2025) recorre la Senda en el mismo sentido
export const TRACK_CANTO_A_LA_TIERRA = TRACK_SENDA_MAGNA;

// 3. Arcoíris en el Asfalto (28 de Diciembre - Calle 18 y el Colorado)
export const TRACK_ARCOIRIS_ASFALTO = [
  [1.2142, -77.2760], // Calle 18 con Cra 29 (Sector Colorado)
  [1.2150, -77.2775], // Calle 18 con Cra 27
  [1.2160, -77.2792], // Calle 18 con Cra 25
  [1.2168, -77.2805]  // Plaza de Nariño
];

export const CARNAVAL_DAYS_MAP = {
  '28': {
    name: 'Arcoíris en el Asfalto (28 Dic)',
    track: TRACK_ARCOIRIS_ASFALTO,
    startName: 'Calle del Colorado',
    endName: 'Plaza de Nariño'
  },
  '3': {
    name: 'Canto a la Tierra (3 Ene)',
    track: TRACK_CANTO_A_LA_TIERRA,
    startName: 'Normal Superior',
    endName: 'Estadio Libertad'
  },
  '4': {
    name: 'Llegada de la Familia Castañeda (4 Ene)',
    track: TRACK_SENDA_MAGNA,
    startName: 'Normal Superior',
    endName: 'Estadio Libertad'
  },
  '6': {
    name: 'Desfile Magno - Día de Blancos (6 Ene)',
    track: TRACK_SENDA_MAGNA,
    startName: 'Normal Superior',
    endName: 'Estadio Libertad'
  }
};

export default {
  TRACK_SENDA_MAGNA,
  TRACK_CANTO_A_LA_TIERRA,
  TRACK_ARCOIRIS_ASFALTO,
  CARNAVAL_DAYS_MAP
};
