/**
 * Servicio de enrutamiento vial real por calles para San Juan de Pasto
 * utilizando la API pública de OSRM (Open Source Routing Machine).
 */

export interface StreetRouteResponse {
  coordinates: [number, number][];
  distanceMeters?: number;
  durationSeconds?: number;
}

/**
 * Calcula la ruta exacta a pie por la malla vial de Pasto usando OSRM con timeout seguro y fallback en línea recta.
 * @param start Coordenadas de inicio [latitud, longitud]
 * @param end Coordenadas de destino [latitud, longitud]
 * @returns Promesa con array de coordenadas [latitud, longitud] formateadas para Leaflet
 */
export async function getStreetRoute(start: [number, number], end: [number, number]): Promise<[number, number][]> {
  const userLng = start[1];
  const userLat = start[0];
  const destLng = end[1];
  const destLat = end[0];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);
    // Request pedestrian walking path from OSRM
    const walkingUrl = `https://router.project-osrm.org/route/v1/walking/${userLng},${userLat};${destLng},${destLat}?overview=full&geometries=geojson`;
    let res = await fetch(walkingUrl, { signal: controller.signal });
    if (!res.ok) {
      const footUrl = `https://router.project-osrm.org/route/v1/foot/${userLng},${userLat};${destLng},${destLat}?overview=full&geometries=geojson`;
      res = await fetch(footUrl, { signal: controller.signal });
    }
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes[0]?.geometry?.coordinates) {
        // Parse GeoJSON coordinates [lng, lat] into Leaflet format [lat, lng]
        return data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
      }
    }
    return [start, end];
  } catch (err) {
    console.warn('Fallback de ruta activado:', err);
    return [start, end];
  }
}

export default getStreetRoute;
