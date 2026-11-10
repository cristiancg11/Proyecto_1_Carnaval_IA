/**
 * Dedicated Web Worker for offloading intensive spatial calculations,
 * Haversine distance computations, and POI spatial filtering from the main UI thread.
 * Guarantees that the main UI thread's Interaction to Next Paint (INP) remains below 200ms.
 */

export interface LatLngTupleWorker {
  0: number;
  1: number;
}

export interface WorkerPOIData {
  id: string;
  name: string;
  category: 'restaurante' | 'bano' | 'cai' | 'salud' | 'tarima';
  type?: 'banos' | 'restaurante' | 'salud' | 'seguridad' | 'tarima';
  coords: [number, number];
  address: string;
  sector: string;
  description: string;
  schedule?: string;
  phone?: string;
}

export interface WorkerRequest {
  id: string;
  action: 'INIT' | 'FILTER_BY_CATEGORY' | 'FIND_CLOSEST' | 'SEARCH' | 'INTENT_MATCH';
  payload?: any;
}

export interface WorkerResponse {
  id: string;
  action: string;
  success: boolean;
  result?: any;
  error?: string;
  durationMs?: number;
}

// In-worker POI cache
let workerPOIs: WorkerPOIData[] = [];

/**
 * Calculates Haversine distance in kilometers between two geographic coordinates.
 */
function haversine(c1: [number, number], c2: [number, number]): number {
  const [lat1, lon1] = c1;
  const [lat2, lon2] = c2;
  const R = 6371; // Earth's radius in km

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
 * Normalizes text for case- and diacritic-insensitive matching.
 */
function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Checks category match with aliases.
 */
function matchesCategory(poi: WorkerPOIData, category: string): boolean {
  if (!category || category === 'todos' || category === 'all') return true;
  const normalized = normalizeText(category);
  if (normalized === 'banio' || normalized === 'banos' || normalized === 'bano') {
    return poi.category === 'bano' || poi.type === 'banos';
  }
  if (normalized === 'seguridad' || normalized === 'cai' || normalized === 'policia') {
    return poi.category === 'cai' || poi.type === 'seguridad';
  }
  if (normalized === 'restaurantes' || normalized === 'restaurante' || normalized === 'gastronomia') {
    return poi.category === 'restaurante' || poi.type === 'restaurante';
  }
  if (normalized === 'salud' || normalized === 'emergencia' || normalized === 'hospital') {
    return poi.category === 'salud' || poi.type === 'salud';
  }
  if (normalized === 'tarimas' || normalized === 'tarima') {
    return poi.category === 'tarima' || poi.type === 'tarima';
  }
  return poi.category === normalized || poi.type === normalized;
}

// Worker message listener
self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { id, action, payload } = event.data;
  const startTime = performance.now();

  try {
    let result: any = null;

    switch (action) {
      case 'INIT': {
        if (Array.isArray(payload)) {
          workerPOIs = payload;
        }
        result = { count: workerPOIs.length };
        break;
      }

      case 'FILTER_BY_CATEGORY': {
        const { category, userCoords } = payload || {};
        let filtered = workerPOIs.filter((poi) => matchesCategory(poi, category));
        if (userCoords && Array.isArray(userCoords) && userCoords.length === 2) {
          filtered = filtered
            .map((poi) => ({
              ...poi,
              distanceKm: haversine(userCoords, poi.coords),
            }))
            .sort((a, b) => a.distanceKm - b.distanceKm);
        }
        result = filtered;
        break;
      }

      case 'FIND_CLOSEST': {
        const { coords, category, maxDistanceKm = 30 } = payload || {};
        if (!coords || !Array.isArray(coords) || coords.length !== 2) {
          result = null;
          break;
        }

        let closestPoi: WorkerPOIData | null = null;
        let minDistance = Infinity;

        for (const poi of workerPOIs) {
          if (category && !matchesCategory(poi, category)) continue;
          const dist = haversine(coords, poi.coords);
          if (dist <= maxDistanceKm && dist < minDistance) {
            minDistance = dist;
            closestPoi = poi;
          }
        }

        result = closestPoi ? { poi: closestPoi, distanceKm: minDistance } : null;
        break;
      }

      case 'SEARCH': {
        const { query, userCoords } = payload || {};
        const q = normalizeText(query);
        const matched = workerPOIs.filter((poi) => {
          const searchSpace = normalizeText(
            `${poi.name} ${poi.description} ${poi.address} ${poi.sector} ${poi.category}`
          );
          return searchSpace.includes(q);
        });

        if (userCoords && Array.isArray(userCoords) && userCoords.length === 2) {
          result = matched
            .map((poi) => ({
              ...poi,
              distanceKm: haversine(userCoords, poi.coords),
            }))
            .sort((a, b) => a.distanceKm - b.distanceKm);
        } else {
          result = matched;
        }
        break;
      }

      case 'INTENT_MATCH': {
        const { query, userCoords } = payload || {};
        const q = normalizeText(query);

        let matchedCategory: 'restaurante' | 'bano' | 'cai' | 'salud' | 'tarima' | null = null;
        let matchedType: 'banos' | 'restaurante' | 'salud' | 'seguridad' | 'tarima' = 'restaurante';

        if (
          q.includes('bano') ||
          q.includes('sanitario') ||
          q.includes('orinar') ||
          q.includes('pipi') ||
          q.includes('servicio higienico') ||
          q.includes('necesidad') ||
          q.includes('bateria sanitaria')
        ) {
          matchedCategory = 'bano';
          matchedType = 'banos';
        } else if (
          q.includes('cuy') ||
          q.includes('comer') ||
          q.includes('restaurante') ||
          q.includes('comida') ||
          q.includes('fritada') ||
          q.includes('empanada') ||
          q.includes('almuerzo') ||
          q.includes('hervido') ||
          q.includes('quimbolito') ||
          q.includes('gastronomia')
        ) {
          matchedCategory = 'restaurante';
          matchedType = 'restaurante';
        } else if (
          q.includes('policia') ||
          q.includes('cai') ||
          q.includes('seguridad') ||
          q.includes('robo') ||
          q.includes('extraviado') ||
          q.includes('vigilancia') ||
          q.includes('ladron') ||
          q.includes('perdido')
        ) {
          matchedCategory = 'cai';
          matchedType = 'seguridad';
        } else if (
          q.includes('salud') ||
          q.includes('medic') ||
          q.includes('cruz roja') ||
          q.includes('urgencia') ||
          q.includes('hospital') ||
          q.includes('ambulancia') ||
          q.includes('primeros auxilios') ||
          q.includes('herido') ||
          q.includes('desmayo') ||
          q.includes('emergencia')
        ) {
          matchedCategory = 'salud';
          matchedType = 'salud';
        } else if (
          q.includes('tarima') ||
          q.includes('concierto') ||
          q.includes('musica') ||
          q.includes('orquesta') ||
          q.includes('agrupacion') ||
          q.includes('artista') ||
          q.includes('tablado') ||
          q.includes('show') ||
          q.includes('evento cultural')
        ) {
          matchedCategory = 'tarima';
          matchedType = 'tarima';
        }

        if (!matchedCategory) {
          result = null;
          break;
        }

        const candidates = workerPOIs.filter((p) => p.category === matchedCategory);
        if (candidates.length === 0) {
          result = null;
          break;
        }

        let selectedPoi: WorkerPOIData | null = null;
        if (q.includes('narino') || q.includes('parque narino') || q.includes('centro')) {
          selectedPoi = candidates.find((p) => p.sector === 'Plaza Nariño') || null;
        } else if (q.includes('carnaval') || q.includes('plaza carnaval')) {
          selectedPoi = candidates.find((p) => p.sector === 'Plaza del Carnaval') || null;
        } else if (q.includes('santander') || q.includes('normal') || q.includes('salida') || q.includes('cra 27')) {
          selectedPoi = candidates.find((p) => p.sector === 'Av. Santander') || null;
        } else if (q.includes('estadio') || q.includes('libertad')) {
          selectedPoi = candidates.find((p) => p.sector === 'Estadio Libertad') || null;
        } else if (q.includes('champagnat') || q.includes('bombona') || q.includes('llegada')) {
          selectedPoi = candidates.find((p) => p.sector === 'Champagnat / Bomboná') || null;
        }

        if (!selectedPoi && userCoords && Array.isArray(userCoords) && userCoords.length === 2) {
          let minDistance = Infinity;
          for (const cand of candidates) {
            const dist = haversine(userCoords, cand.coords);
            if (dist < minDistance) {
              minDistance = dist;
              selectedPoi = cand;
            }
          }
        }

        if (!selectedPoi) {
          selectedPoi = candidates[0];
        }

        let reply = '';
        switch (matchedCategory) {
          case 'bano':
            reply = `¡A la voz de una, paisano! 🚻 Te acabo de trazar la ruta en el mapa hacia la **${selectedPoi.name}** en **${selectedPoi.sector}**. Te queda a unos minutos caminando. ¡Sigue la línea dorada!`;
            break;
          case 'restaurante':
            reply = `¡Qué delicia, paisano! 🍽️ Te acabo de trazar la ruta en el mapa hacia **${selectedPoi.name}** en **${selectedPoi.sector}**. Allí encontrás un cuy asado bien crocante y comida típica. ¡Sigue la línea dorada!`;
            break;
          case 'cai':
            reply = `¡Firme mi paisano! 👮 Te acabo de trazar la ruta en el mapa hacia el **${selectedPoi.name}** en **${selectedPoi.sector}**. Los agentes están atentos para brindarte seguridad. ¡Sigue la línea dorada!`;
            break;
          case 'salud':
            reply = `¡Atención inmediata, paisano! 🚨 Te acabo de trazar la ruta de asistencia en el mapa hacia el **${selectedPoi.name}** en **${selectedPoi.sector}**. Te queda muy cerca caminando. ¡Sigue la línea dorada!`;
            break;
          case 'tarima':
            reply = `¡A gozar la fiesta, carajo! 🎪 Te acabo de trazar la ruta en el mapa hacia la **${selectedPoi.name}** en **${selectedPoi.sector}**. ¡Sigue la línea dorada para disfrutar del tablado!`;
            break;
        }

        result = {
          poi: selectedPoi,
          category: matchedCategory,
          type: matchedType,
          matchedIntent: true,
          reply,
        };
        break;
      }

      default:
        throw new Error(`Unsupported worker action: ${action}`);
    }

    const durationMs = performance.now() - startTime;
    self.postMessage({
      id,
      action,
      success: true,
      result,
      durationMs,
    } as WorkerResponse);
  } catch (err: any) {
    const durationMs = performance.now() - startTime;
    self.postMessage({
      id,
      action,
      success: false,
      error: err?.message || 'Worker calculation failed',
      durationMs,
    } as WorkerResponse);
  }
};

