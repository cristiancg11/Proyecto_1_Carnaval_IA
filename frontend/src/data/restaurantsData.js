/**
 * Base de datos oficial de restaurantes tradicionales y gastronomía típica
 * en San Juan de Pasto para el Carnaval de Negros y Blancos.
 */

export const RESTAURANTS_DATA = [
  {
    id: 'cuyquer',
    name: 'Cuyquer',
    sector: 'Sector Mijitayo',
    latitude: 1.2160,
    longitude: -77.2915,
    hours: '11:30 - 18:00',
    specialty: 'Cuy Asado y gastronomía típica',
    description: 'Tradicional asadero de cuy con preparaciones ancestrales nariñenses, ají de maní y papas al vapor.',
    phone: '+57 (2) 723-4567',
  },
  {
    id: 'rincon-del-cuy',
    name: 'El Rincón del Cuy',
    sector: 'Av. Mijitayo / Panamericana',
    latitude: 1.2140,
    longitude: -77.2870,
    hours: '11:00 - 19:00',
    specialty: 'Cuy asado al carbón',
    description: 'Especialistas en cuy asado al carbón en vara tradicional, frito pastuso y caldo de pajarilla.',
    phone: '+57 (2) 729-1234',
  },
  {
    id: 'cafe-san-sebastian',
    name: 'Café San Sebastián',
    sector: 'Centro Histórico',
    latitude: 1.2142,
    longitude: -77.2795,
    hours: '08:00 - 21:00',
    specialty: 'Café especial de Nariño y pasabocas',
    description: 'Café de origen de alta montaña, repostería artesanal, quimbolitos y ambiente cultural del centro.',
    phone: '+57 (2) 722-7890',
  },
  {
    id: 'parrilla-gourmet',
    name: 'Parrilla Gourmet',
    sector: 'Carrera 27 - Senda',
    latitude: 1.2125,
    longitude: -77.2770,
    hours: '12:00 - 22:00',
    specialty: 'Carnes a la brasa y almuerzos',
    description: 'Cortes seleccionados a la parrilla, almuerzos ejecutivos y vista directa al paso de los desfiles.',
    phone: '+57 (2) 731-5678',
  },
  {
    id: 'cabana-andina',
    name: 'La Cabaña Andina',
    sector: 'Plaza de Nariño',
    latitude: 1.2145,
    longitude: -77.2780,
    hours: '07:30 - 20:30',
    specialty: 'Empanadas de añejo y café nariñense',
    description: 'Icono del centro histórico. Famosas empanadas de añejo crocantes con pipián, ají de aguacate y café.',
    phone: '+57 (2) 720-3344',
  },
  {
    id: 'asadero-la-merced',
    name: 'Asadero La Merced',
    sector: 'Salida Obonuco',
    latitude: 1.1890,
    longitude: -77.2920,
    hours: '10:30 - 18:00',
    specialty: 'Cuy campesino y platos autóctonos',
    description: 'Ambiente campestre en la ruta tradicional de Obonuco. Cuy entero asado, envueltos y chicha tradicional.',
    phone: '+57 (2) 721-9988',
  },
];

/**
 * Calcula si un restaurante está abierto comparando la hora actual (o suministrada)
 * con el rango del horario (ej: "11:30 - 18:00").
 */
export function isRestaurantOpen(hoursStr, currentDate = new Date()) {
  if (!hoursStr || typeof hoursStr !== 'string') return false;

  const parts = hoursStr.split('-').map((p) => p.trim());
  if (parts.length !== 2) return false;

  const [startStr, endStr] = parts;
  const [startH, startM] = startStr.split(':').map(Number);
  const [endH, endM] = endStr.split(':').map(Number);

  if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return false;

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

/**
 * Retorna el estado formateado con badge visual para la interfaz
 */
export function getRestaurantStatus(hoursStr, currentDate = new Date()) {
  const open = isRestaurantOpen(hoursStr, currentDate);
  return {
    isOpen: open,
    badge: open ? '🟢 Abierto Ahora' : '🔴 Cerrado',
    className: open
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
      : 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  };
}

/**
 * Calcula la distancia en kilómetros entre dos coordenadas usando Haversine
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formatea una distancia en metros o kilómetros para el usuario
 */
export function formatDistance(distanceKm) {
  if (distanceKm == null || isNaN(distanceKm)) return null;
  const meters = distanceKm * 1000;
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

export default RESTAURANTS_DATA;
