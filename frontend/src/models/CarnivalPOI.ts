/**
 * CarnivalPOI domain model representing an official Point of Interest (POI)
 * for the Carnaval de Negros y Blancos GIS platform in San Juan de Pasto.
 * Encapsulates spatial geometry, categorization, and domain behaviors.
 */

export type LatLngTuple = [number, number];

export type POICategory = 'restaurante' | 'bano' | 'cai' | 'salud' | 'tarima';
export type POIType = 'banos' | 'restaurante' | 'salud' | 'seguridad' | 'tarima';

export interface IPOIData {
  id: string;
  name: string;
  category: POICategory;
  type?: POIType;
  coords: LatLngTuple;
  address: string;
  sector: string;
  description: string;
  schedule?: string;
  phone?: string;
}

export class CarnivalPOI implements IPOIData {
  public readonly id: string;
  public readonly name: string;
  public readonly category: POICategory;
  public readonly type: POIType;
  public readonly coords: LatLngTuple;
  public readonly address: string;
  public readonly sector: string;
  public readonly description: string;
  public readonly schedule?: string;
  public readonly phone?: string;

  constructor(data: IPOIData) {
    this.id = data.id;
    this.name = data.name;
    this.category = data.category;
    this.type = data.type || (data.category === 'bano' ? 'banos' : data.category === 'cai' ? 'seguridad' : data.category);
    this.coords = [data.coords[0], data.coords[1]];
    this.address = data.address;
    this.sector = data.sector;
    this.description = data.description;
    this.schedule = data.schedule;
    this.phone = data.phone;
  }

  /**
   * Returns the coordinates tuple [latitude, longitude].
   */
  public getCoordinates(): LatLngTuple {
    return [this.coords[0], this.coords[1]];
  }

  /**
   * Returns the latitude component.
   */
  public get latitude(): number {
    return this.coords[0];
  }

  /**
   * Returns the longitude component.
   */
  public get longitude(): number {
    return this.coords[1];
  }

  /**
   * Calculates the Haversine distance in kilometers from this POI to target coordinates.
   * Optimized for low computational latency and numerical stability.
   */
  public distanceTo(targetCoords: LatLngTuple): number {
    return CarnivalPOI.calculateHaversine(this.coords, targetCoords);
  }

  /**
   * Checks whether this POI matches a search query against its name, description, address, or sector.
   */
  public matchesQuery(query: string): boolean {
    if (!query || !query.trim()) return true;
    const normalizedQuery = CarnivalPOI.normalizeString(query);
    const searchSpace = CarnivalPOI.normalizeString(
      `${this.name} ${this.description} ${this.address} ${this.sector} ${this.category} ${this.type}`
    );
    return searchSpace.includes(normalizedQuery);
  }

  /**
   * Checks whether this POI matches a specific category or equivalent type.
   */
  public matchesCategory(category: string): boolean {
    if (!category || category === 'todos' || category === 'all') return true;
    const normalized = category.toLowerCase().trim();
    if (normalized === 'banio' || normalized === 'banos' || normalized === 'bano') {
      return this.category === 'bano' || this.type === 'banos';
    }
    if (normalized === 'seguridad' || normalized === 'cai' || normalized === 'policia') {
      return this.category === 'cai' || this.type === 'seguridad';
    }
    if (normalized === 'restaurantes' || normalized === 'restaurante' || normalized === 'gastronomia') {
      return this.category === 'restaurante' || this.type === 'restaurante';
    }
    if (normalized === 'salud' || normalized === 'emergencia' || normalized === 'hospital') {
      return this.category === 'salud' || this.type === 'salud';
    }
    if (normalized === 'tarimas' || normalized === 'tarima' || normalized === 'escenario') {
      return this.category === 'tarima' || this.type === 'tarima';
    }
    return this.category === normalized || this.type === normalized;
  }

  /**
   * Checks whether this POI matches a specific sector along the Senda del Carnaval.
   */
  public matchesSector(sector: string): boolean {
    if (!sector) return true;
    const normalizedSector = CarnivalPOI.normalizeString(sector);
    const thisSector = CarnivalPOI.normalizeString(this.sector);
    return thisSector.includes(normalizedSector);
  }

  /**
   * Serializes the domain object to a standard GeoJSON Feature for GIS renderers.
   */
  public toGeoJSON(): {
    type: 'Feature';
    geometry: { type: 'Point'; coordinates: [number, number] };
    properties: Record<string, any>;
  } {
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [this.coords[1], this.coords[0]], // GeoJSON is [longitude, latitude]
      },
      properties: {
        id: this.id,
        name: this.name,
        category: this.category,
        type: this.type,
        sector: this.sector,
        address: this.address,
        description: this.description,
        schedule: this.schedule,
        phone: this.phone,
      },
    };
  }

  /**
   * Serializes the domain model to a plain object.
   */
  public toJSON(): IPOIData {
    return {
      id: this.id,
      name: this.name,
      category: this.category,
      type: this.type,
      coords: [this.coords[0], this.coords[1]],
      address: this.address,
      sector: this.sector,
      description: this.description,
      schedule: this.schedule,
      phone: this.phone,
    };
  }

  /**
   * Static Haversine formula calculation between two coordinates in kilometers.
   */
  public static calculateHaversine(pointA: LatLngTuple, pointB: LatLngTuple): number {
    const [lat1, lon1] = pointA;
    const [lat2, lon2] = pointB;
    const R = 6371; // Earth's mean radius in km

    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const sinHalfLat = Math.sin(dLat / 2);
    const sinHalfLon = Math.sin(dLon / 2);

    const a =
      sinHalfLat * sinHalfLat +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        sinHalfLon *
        sinHalfLon;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Helper to normalize string for diacritic-insensitive comparisons.
   */
  public static normalizeString(value: string): string {
    return (value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}

export default CarnivalPOI;

