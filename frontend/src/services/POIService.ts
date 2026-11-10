/**
 * POIService provides a centralized, Object-Oriented service for querying,
 * filtering, and spatial indexing of Points of Interest along the Senda del Carnaval.
 * Implements the Singleton pattern and integrates with SpatialIndex.
 */

import { CarnivalPOI, IPOIData, LatLngTuple, POICategory, POIType } from '../models/CarnivalPOI';
import { SpatialIndex, SpatialSearchResult } from '../models/SpatialIndex';

export interface IntentMatchResult {
  poi: IPOIData;
  category: POICategory;
  type: POIType;
  matchedIntent: boolean;
  reply: string;
}

export class POIService {
  private static instance: POIService | null = null;
  private readonly pois: CarnivalPOI[] = [];
  private readonly spatialIndex: SpatialIndex;

  constructor(initialData: IPOIData[] = []) {
    this.spatialIndex = new SpatialIndex();
    if (initialData.length > 0) {
      this.loadPOIs(initialData);
    }
  }

  /**
   * Returns the singleton instance of POIService.
   */
  public static getInstance(initialData?: IPOIData[]): POIService {
    if (!POIService.instance) {
      POIService.instance = new POIService(initialData);
    } else if (initialData && initialData.length > 0 && POIService.instance.size === 0) {
      POIService.instance.loadPOIs(initialData);
    }
    return POIService.instance;
  }

  /**
   * Loads or reloads an array of POIs into memory and updates the spatial index.
   */
  public loadPOIs(data: IPOIData[]): void {
    this.pois.length = 0;
    for (const item of data) {
      this.pois.push(new CarnivalPOI(item));
    }
    this.spatialIndex.build(this.pois);
  }

  /**
   * Returns the count of managed POIs.
   */
  public get size(): number {
    return this.pois.length;
  }

  /**
   * Returns all managed CarnivalPOI domain entities.
   */
  public getAll(): CarnivalPOI[] {
    return [...this.pois];
  }

  /**
   * Returns a POI by its unique identifier.
   */
  public getById(id: string): CarnivalPOI | undefined {
    return this.pois.find((p) => p.id === id);
  }

  /**
   * Returns POIs filtered by category.
   */
  public getByCategory(category: string): CarnivalPOI[] {
    if (!category || category === 'todos' || category === 'all') {
      return [...this.pois];
    }
    return this.pois.filter((p) => p.matchesCategory(category));
  }

  /**
   * Returns POIs located in a specific sector of the Senda.
   */
  public getBySector(sector: string): CarnivalPOI[] {
    return this.pois.filter((p) => p.matchesSector(sector));
  }

  /**
   * Finds the closest POI to user coordinates with an optional category filter.
   */
  public findClosest(coords: LatLngTuple, category?: string): SpatialSearchResult | null {
    const filter = category ? (poi: CarnivalPOI) => poi.matchesCategory(category) : undefined;
    return this.spatialIndex.findNearest(coords, 20.0, filter);
  }

  /**
   * Searches POIs matching a text query, optionally sorted by proximity to user coordinates.
   */
  public search(query: string, userCoords?: LatLngTuple): CarnivalPOI[] {
    const matched = this.pois.filter((p) => p.matchesQuery(query));
    if (userCoords) {
      return matched.sort((a, b) => a.distanceTo(userCoords) - b.distanceTo(userCoords));
    }
    return matched;
  }

  /**
   * Evaluates natural language user queries to detect spatial intent
   * (restaurantes/cuy, baños, seguridad/CAI, salud/urgencias, tarimas)
   * and selects the most relevant POI along the Senda.
   */
  public findBestForIntent(query: string, userCoords?: LatLngTuple): IntentMatchResult | null {
    if (!query || !query.trim()) return null;
    const q = CarnivalPOI.normalizeString(query);

    let matchedCategory: POICategory | null = null;
    let matchedType: POIType = 'restaurante';

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

    if (!matchedCategory) return null;

    const candidates = this.getByCategory(matchedCategory);
    if (candidates.length === 0) return null;

    // Check if the user specified a known sector in their prompt
    let selectedPoi: CarnivalPOI | null = null;
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

    // If no explicit sector was stated, use spatial indexing to select the closest POI to userCoords
    if (!selectedPoi && userCoords && Array.isArray(userCoords) && userCoords.length === 2) {
      const nearestResult = this.spatialIndex.findNearest(
        userCoords,
        25.0,
        (p) => p.matchesCategory(matchedCategory as string)
      );
      if (nearestResult) {
        selectedPoi = nearestResult.poi;
      }
    }

    // Fallback to first available POI in category
    if (!selectedPoi) {
      selectedPoi = candidates[0];
    }

    // Generate authentic friendly Pastuso confirmation response
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

    return {
      poi: selectedPoi.toJSON(),
      category: matchedCategory,
      type: matchedType,
      matchedIntent: true,
      reply,
    };
  }

  /**
   * Returns the raw POI data objects for serialization or legacy consumers.
   */
  public toRawArray(): IPOIData[] {
    return this.pois.map((p) => p.toJSON());
  }

  /**
   * Returns the underlying SpatialIndex instance.
   */
  public getSpatialIndex(): SpatialIndex {
    return this.spatialIndex;
  }
}

export default POIService;
