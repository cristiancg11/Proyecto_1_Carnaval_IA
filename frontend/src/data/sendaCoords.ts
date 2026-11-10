/**
 * Trazado de la Senda del Carnaval de San Juan de Pasto ajustado a la malla vial real.
 *
 * Recorrido (Alcaldía de Pasto / Corpocarnaval 2025):
 *   Av. Carrera 27 (inmediaciones I.E.M. Normal Superior) -> Calle 19 -> Plaza del Carnaval
 *   -> Calle 18 (San Juan Bosco) -> Av. Champagnat -> Estadio Departamental Libertad.
 *
 * Geometría obtenida de OpenStreetMap (© colaboradores de OpenStreetMap, ODbL):
 * el tramo de la Av. Carrera 27 sigue la calzada norte de la vía y el resto fue trazado
 * con el perfil peatonal de OSRM sobre las calles indicadas. Ordenado de salida a llegada.
 */

export type LatLngTuple = [number, number];

export const SENDA_OFICIAL_COORDS: [number, number][] = [
  // 1. Salida: Av. Carrera 27, inmediaciones de la Normal Superior
  [1.212641, -77.285765], [1.212885, -77.285528], [1.213256, -77.285318], [1.213309, -77.285285],
  [1.213424, -77.285212], [1.213625, -77.285034], [1.213805, -77.284894], [1.213818, -77.284885],
  [1.214029, -77.284655], [1.214247, -77.284425], [1.214694, -77.283935], [1.215100, -77.282964],
  [1.215480, -77.282151], [1.215836, -77.281329], [1.216206, -77.280466], [1.216587, -77.279659],
  // 2. Av. Carrera 27 con Calle 19 -> Calle 19 hacia la Plaza del Carnaval
  [1.216975, -77.278810], [1.216066, -77.278438], [1.215266, -77.278093], [1.215190, -77.278065],
  [1.214382, -77.277689], [1.213547, -77.277321], [1.212692, -77.276976], [1.212146, -77.276718],
  [1.211843, -77.276598], [1.211404, -77.276423], [1.210869, -77.276168], [1.210039, -77.275870],
  [1.209724, -77.275710], [1.209167, -77.275450], [1.209104, -77.275414], [1.208998, -77.275368],
  // 3. Paso a la Calle 18 (sector San Juan Bosco)
  [1.207755, -77.274821], [1.207332, -77.275716], [1.206044, -77.275165], [1.206032, -77.275161],
  [1.205987, -77.275145], [1.205526, -77.274936], [1.205442, -77.274892], [1.205405, -77.274965],
  [1.205374, -77.274993], [1.204889, -77.275108], [1.204294, -77.275306], [1.204216, -77.275331],
  // 4. Avenida Champagnat
  [1.204136, -77.275366], [1.204050, -77.275544], [1.203493, -77.277468], [1.203396, -77.277777],
  [1.203311, -77.278084], [1.203140, -77.278663], [1.203104, -77.278740], [1.203047, -77.278817],
  [1.202951, -77.278871], [1.202882, -77.278898], [1.202823, -77.278943], [1.202780, -77.279004],
  // 5. Glorieta y llegada al Estadio Libertad
  [1.202653, -77.279041], [1.202376, -77.278962], [1.201603, -77.278802], [1.201552, -77.278789],
  [1.201472, -77.278736], [1.201239, -77.278657], [1.200342, -77.278475], [1.200133, -77.278438],
  [1.200045, -77.278402], [1.199985, -77.278351], [1.199573, -77.277829], [1.199464, -77.277766],
  [1.199438, -77.277725], [1.199366, -77.277637], [1.199053, -77.277341], [1.198552, -77.276982],
  [1.198369, -77.276805],
];

export interface HitoSenda {
  id: string;
  name: string;
  nombre?: string;
  coords: [number, number];
  tipo?: 'inicio' | 'intermedio' | 'fin';
  type?: 'inicio' | 'intermedio' | 'fin';
  desc?: string;
}

export const HITOS_SENDA = [
  { id: '1', name: 'Salida: Normal Superior', nombre: 'Salida: Normal Superior', coords: [1.212641, -77.285765] as [number, number], tipo: 'inicio' as const, type: 'inicio' as const, desc: 'Av. Carrera 27. Concentración de carrozas gigantes, murgas y comparsas.' },
  { id: '2', name: 'Plaza de Nariño', nombre: 'Plaza de Nariño', coords: [1.21461, -77.27829] as [number, number], tipo: 'intermedio' as const, type: 'intermedio' as const, desc: 'Centro histórico de la ciudad y tarimas de transmisión.' },
  { id: '3', name: 'Plaza del Carnaval', nombre: 'Plaza del Carnaval', coords: [1.21056, -77.27655] as [number, number], tipo: 'intermedio' as const, type: 'intermedio' as const, desc: 'Tarima principal de jurados y graderías sobre la Calle 19.' },
  { id: '4', name: 'Llegada: Estadio Libertad', nombre: 'Llegada: Estadio Libertad', coords: [1.198369, -77.276805] as [number, number], tipo: 'fin' as const, type: 'fin' as const, desc: 'Desmonte y finalización oficial del desfile.' }
];

// Aliases para retrocompatibilidad
export const SENDA_CARNAVAL_COORDS: LatLngTuple[] = SENDA_OFICIAL_COORDS;
export const SENDA_DEL_CARNAVAL_COORDS: LatLngTuple[] = SENDA_OFICIAL_COORDS;

export default SENDA_OFICIAL_COORDS;
