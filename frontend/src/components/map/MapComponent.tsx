import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PASTO_POIS, PointOfInterest, LatLngTuple, dispatchGuanenaAction } from '../../data/pastoPOIs';
import { SENDA_OFICIAL_COORDS, HITOS_SENDA } from '../../data/sendaCoords';
import { getStreetRoute } from '../../services/routingService';
import { scheduleNextFrame, scheduleMicrotask } from '../../utils/performance';

// Resuelve el error clásico de Leaflet con Vite donde las rutas de los iconos por defecto se rompen
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Constantes visuales y de posicionamiento robusto de MapComponent
export const DEFAULT_MAP_CENTER: [number, number] = [1.2140, -77.2820]; // Centro Histórico de Pasto
export const DEFAULT_MAP_ZOOM = 15;
export const DEFAULT_MAP_CONTAINER_CLASS = "relative w-full h-screen overflow-hidden bg-[#07090e]";
export const DEFAULT_MAP_CONTAINER_STYLE: React.CSSProperties = { minHeight: '100vh', width: '100%' };

/**
 * Hook de geolocalización segura para MapComponent que garantiza orden de declaración hoisted
 */
export function useMapUserGps() {
  const [userGps, setUserGps] = useState<[number, number] | null>(null);
  const originPoint: [number, number] = userGps || [1.2138, -77.2818]; // Fallback al Parque Nariño si no hay GPS activo
  return { userGps, setUserGps, originPoint };
}

/**
 * Componente blindado para renderizar el marcador de usuario GPS con punto azul y halo de radar
 */
export function GuardedUserMarker({ userGps }: { userGps: [number, number] | null }) {
  if (!userGps || isNaN(userGps[0]) || isNaN(userGps[1])) {
    return null;
  }
  return (
    <>
      <CircleMarker
        center={userGps}
        radius={20}
        pathOptions={{
          color: '#3b82f6',
          fillColor: '#60a5fa',
          fillOpacity: 0.25,
          weight: 1.5,
          className: 'animate-pulse',
        }}
      />
      <CircleMarker
        center={userGps}
        radius={8}
        pathOptions={{
          color: '#ffffff',
          fillColor: '#2563eb',
          fillOpacity: 1,
          weight: 3,
        }}
      >
        <Popup>Tu ubicación actual (GPS)</Popup>
      </CircleMarker>
    </>
  );
}

/**
 * Componente de navegación: Polilínea dinámica para rutas a pie (Cyan Neón)
 */
export function GuardedNavigationPolyline({ navigationPath }: { navigationPath: [number, number][] | null | undefined }) {
  if (!Array.isArray(navigationPath) || navigationPath.length < 2) {
    return null;
  }
  return (
    <>
      <Polyline
        positions={navigationPath}
        pathOptions={{ color: '#000000', weight: 9, opacity: 0.65, lineCap: 'round', lineJoin: 'round' }}
      />
      <Polyline
        positions={navigationPath}
        pathOptions={{ color: '#38bdf8', weight: 5, opacity: 0.9, dashArray: '8, 8', lineCap: 'round', lineJoin: 'round' }}
      />
    </>
  );
}

const getPoiCategoryBadge = (category: string) => {
  switch ((category || '').toLowerCase()) {
    case 'restaurante':
    case 'gastronomia':
      return { label: 'Gastronomía Andina', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: '🍴' };
    case 'bano':
    case 'banio':
      return { label: 'Baños Móviles', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', icon: '🚻' };
    case 'cai':
    case 'seguridad':
      return { label: 'Seguridad CAI', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40', icon: '👮' };
    case 'salud':
      return { label: 'Puesto de Salud', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40', icon: '🚑' };
    default:
      return { label: 'Punto de Interés', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', icon: '📍' };
  }
};

/**
 * Capa de marcadores interactivos georreferenciados para Pasto (Restaurantes, Baños, CAIs, Salud)
 */
export function PastoPoiMarkersLayer({
  activeCategory = 'todos',
  onSelectPoi,
}: {
  activeCategory?: string;
  onSelectPoi?: (poi: PointOfInterest) => void;
}) {
  const filtered = activeCategory === 'todos'
    ? PASTO_POIS
    : PASTO_POIS.filter((p) => p.category === activeCategory || (activeCategory === 'banio' && p.category === 'bano'));

  return (
    <>
      {filtered.map((poi) => {
        const badge = getPoiCategoryBadge(poi.category);
        return (
          <Marker
            key={poi.id}
            position={poi.coords}
            eventHandlers={{
              click: () => onSelectPoi && onSelectPoi(poi),
            }}
          >
            <Popup className="stitch-popup-custom">
              <div className="p-3.5 min-w-[220px] max-w-[280px] bg-slate-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl text-white font-sans">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${badge.color}`}>
                    {badge.icon} {badge.label}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Activo
                  </span>
                </div>
                <h4 className="font-bold text-white text-sm leading-snug mb-1">
                  {poi.name}
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed mb-2">
                  {poi.description}
                </p>
                {poi.address && (
                  <div className="text-[11px] text-amber-300/90 font-medium mb-2.5 flex items-center gap-1">
                    <span>📍</span>
                    <span className="truncate">{poi.address}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    dispatchGuanenaAction('NAVIGATE_TO', { targetCoords: poi.coords, name: poi.name });
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(
                        new CustomEvent('route-to-poi', {
                          detail: { targetCoords: poi.coords, targetName: poi.name },
                        })
                      );
                    }
                  }}
                  className="w-full py-2 px-3 rounded-full bg-gradient-to-r from-rose-600 via-amber-500 to-cyan-500 hover:brightness-110 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-[0_4px_16px_rgba(225,29,72,0.4)] transition cursor-pointer"
                >
                  <span>📍</span>
                  <span>Trazar ruta a pie</span>
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

/**
 * Hook para sincronizar comandos conversacionales de GuaneñaBot (FOCUS_CATEGORY, SHOW_SENDA, NAVIGATE_TO)
 */
export function useConversationalMapActions({
  onFilterCategory,
  onShowSenda,
}: {
  onFilterCategory?: (category: string) => void;
  onShowSenda?: () => void;
} = {}) {
  const map = useMap();

  useEffect(() => {
    const handleGuanena = (e: any) => {
      const detail = e.detail || {};
      const actionType = detail.type || e.type;

      if (actionType === 'FOCUS_CATEGORY') {
        const cat = detail.category || 'todos';
        if (onFilterCategory) onFilterCategory(cat);
        const target = PASTO_POIS.find((p) => p.category === cat || (cat === 'banio' && p.category === 'bano'));
        if (target && map?.flyTo) {
          map.flyTo(target.coords, 16, { animate: true, duration: 1.5 });
        }
      } else if (actionType === 'SHOW_SENDA') {
        if (onShowSenda) onShowSenda();
        if (map?.flyTo) {
          map.flyTo([1.2140, -77.2820], 15, { animate: true, duration: 1.5 });
        }
      } else if (actionType === 'NAVIGATE_TO') {
        const coords = detail.targetCoords || detail.coords;
        if (coords && map?.flyTo) {
          map.flyTo(coords, 17, { animate: true, duration: 1.5 });
        }
      }
    };

    window.addEventListener('FOCUS_CATEGORY', handleGuanena);
    window.addEventListener('SHOW_SENDA', handleGuanena);
    window.addEventListener('NAVIGATE_TO', handleGuanena);
    window.addEventListener('guanena-action', handleGuanena);

    return () => {
      window.removeEventListener('FOCUS_CATEGORY', handleGuanena);
      window.removeEventListener('SHOW_SENDA', handleGuanena);
      window.removeEventListener('NAVIGATE_TO', handleGuanena);
      window.removeEventListener('guanena-action', handleGuanena);
    };
  }, [map, onFilterCategory, onShowSenda]);
}

/**
 * Generador de pines SVG modernos y festivos con resplandor para los Hitos de la Senda del Carnaval
 */
export function createSvgLandmarkPin({
  type,
  label,
}: {
  type: 'inicio' | 'intermedio' | 'fin' | 'plaza' | 'salud';
  label?: string;
}) {
  let pinColor = '#dc2626'; // Ámbar por defecto
  let shadowColor = 'rgba(220, 38, 38, 0.6)';
  let iconSvg = '';
  let subText = 'Hito';

  if (type === 'inicio') {
    // Verde Esmeralda con icono de Bandera de Salida
    pinColor = '#a8a29e';
    shadowColor = 'rgba(168, 162, 158, 0.65)';
    subText = 'Salida';
    iconSvg = `
      <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 2v20h2v-8h14l-2-6 2-6H6V2H4z"/>
      </svg>
    `;
  } else if (type === 'fin') {
    // Carmesí festivo con icono de Meta / Llegada
    pinColor = '#dc2626';
    shadowColor = 'rgba(220, 38, 38, 0.7)';
    subText = 'Llegada';
    iconSvg = `
      <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    `;
  } else {
    // Dorado / Ámbar con icono de Corona / Tarima Festiva (Plaza Nariño / Carnaval)
    pinColor = '#dc2626';
    shadowColor = 'rgba(220, 38, 38, 0.65)';
    subText = 'Hito';
    iconSvg = `
      <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2.5 19h19v2h-19zm19.5-8.5-5 3.5-5-7-5 7-5-3.5 2 9h16z"/>
      </svg>
    `;
  }

  const html = `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -100%);">
      <!-- Pin SVG con sombra y borde pulido -->
      <div style="
        width: 38px;
        height: 38px;
        border-radius: 50% 50% 50% 0;
        background: ${pinColor};
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2.5px solid #ffffff;
        box-shadow: 0 0 20px ${shadowColor}, 0 8px 16px rgba(0,0,0,0.6);
        transition: transform 0.2s ease;
      ">
        <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">
          ${iconSvg}
        </div>
      </div>
      <!-- Resplandor pulsante en la base -->
      <div style="
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: ${pinColor};
        opacity: 0.8;
        box-shadow: 0 0 12px ${pinColor};
        margin-top: 2px;
      "></div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-svg-landmark-pin',
    html,
    iconSize: [38, 48],
    iconAnchor: [19, 48],
    popupAnchor: [0, -50],
  });
}

export * from './CarnavalDaySelector';
export { default as CarnavalDaySelector } from './CarnavalDaySelector';

/**
 * Controlador para enfocar los límites de la Senda con fitBounds
 */
function SendaBoundsFitter({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (map && coords && coords.length > 0) {
      try {
        map.fitBounds(coords as any, { padding: [40, 40] });
      } catch (err) {
        console.warn('Error al ajustar límites de la Senda:', err);
      }
    }
  }, [map, coords]);
  return null;
}

/**
 * Controlador de navegación reactivo para GuaneñaBot:
 * - Centra el mapa suavemente en las coordenadas del destino con map.flyTo([lat, lng], 17)
 * - Abre el popup del lugar seleccionado
 * - Si existe la ubicación del usuario (o mock en la Senda), enruta peatonalmente con OSRM y dibuja la polilínea dorada/neón
 * - Llama a map.invalidateSize() para garantizar estabilidad visual
 */
export function GuanenaRoutingHandler({
  selectedDestination,
  onDestinationChanged,
  userLocation,
}: {
  selectedDestination?: { coords: [number, number]; name: string; sector?: string; category?: string } | null;
  onDestinationChanged?: (dest: any) => void;
  userLocation?: [number, number] | null;
}) {
  const map = useMap();
  const [activeDestination, setActiveDestination] = useState<any>(selectedDestination || null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][] | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (selectedDestination) {
      setActiveDestination(selectedDestination);
    }
  }, [selectedDestination]);

  useEffect(() => {
    const handleRouteEvent = async (e: any) => {
      const detail = e.detail;
      if (!detail || !detail.targetCoords) return;

      const dest = {
        coords: detail.targetCoords as [number, number],
        name: detail.targetName || 'Destino de Carnaval',
        sector: detail.sector || 'Senda del Carnaval',
        category: detail.category,
      };

      scheduleMicrotask(() => {
        setActiveDestination(dest);
        if (onDestinationChanged) onDestinationChanged(dest);
      });

      // a) Centra el mapa suavemente en las coordenadas del destino con map.flyTo([lat, lng], 16)
      scheduleNextFrame(() => {
        if (map?.flyTo) {
          map.flyTo(dest.coords, 16, { animate: true });
        }
        scheduleNextFrame(() => {
          if (map?.invalidateSize) map.invalidateSize();
        });
      });

      // c) Calcula la ruta a pie con OSRM desde la ubicación del usuario o fallback
      const rawUserLoc = userLocation;
      const start: [number, number] = Array.isArray(rawUserLoc)
        ? (rawUserLoc as [number, number])
        : (rawUserLoc && typeof (rawUserLoc as any).lat === 'number' && typeof (rawUserLoc as any).lng === 'number'
            ? [(rawUserLoc as any).lat, (rawUserLoc as any).lng]
            : (detail.startCoords || detail.originCoords || [1.2138, -77.2818]));

      try {
        if (detail.path && Array.isArray(detail.path) && detail.path.length >= 2) {
          setRouteCoordinates(detail.path);
        } else {
          const path = await getStreetRoute(start, dest.coords);
          setRouteCoordinates(path);
        }
      } catch (err) {
        console.warn('Fallback de enrutamiento OSRM peatonal activado:', err);
        setRouteCoordinates([start, dest.coords]);
      } finally {
        scheduleNextFrame(() => {
          // b) Abre el popup de detalle del lugar seleccionado
          if (markerRef.current) {
            markerRef.current.openPopup();
          }
          if (map?.invalidateSize) map.invalidateSize();
        });
      }
    };

    window.addEventListener('route-to-poi', handleRouteEvent);
    window.addEventListener('TRIGGER_NAVIGATION', handleRouteEvent);
    return () => {
      window.removeEventListener('route-to-poi', handleRouteEvent);
      window.removeEventListener('TRIGGER_NAVIGATION', handleRouteEvent);
    };
  }, [map, onDestinationChanged, userLocation]);

  return (
    <>
      {/* Dynamic Walking Polyline (The Path): Cyan / Electric Sky Blue (#38bdf8) with neon dashed style */}
      {routeCoordinates && routeCoordinates.length >= 2 && (
        <>
          <Polyline
            positions={routeCoordinates}
            pathOptions={{
              color: '#000000',
              weight: 9,
              opacity: 0.65,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
          <Polyline
            positions={routeCoordinates}
            pathOptions={{
              color: '#38bdf8',
              weight: 5,
              opacity: 0.9,
              dashArray: '8, 8',
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        </>
      )}

      {/* Marcador de Destino Activo con Popup de Apertura Automática */}
      {activeDestination && activeDestination.coords && (
        <Marker
          ref={markerRef}
          position={activeDestination.coords}
        >
          <Popup autoPan={false}>
            <div className="p-2 min-w-[190px] text-xs font-sans">
              <span className="text-[10px] font-black uppercase text-cyan-400 block mb-0.5">
                Ruta Guiada GuaneñaBot
              </span>
              <strong className="text-white block font-black text-sm">
                {activeDestination.name}
              </strong>
              {activeDestination.sector && (
                <p className="text-cyan-200/90 text-[11px] mt-0.5 font-semibold">
                  📍 Sector: {activeDestination.sector}
                </p>
              )}
              <p className="text-slate-300 text-[11px] mt-1">
                🚶‍♂️ Sigue la línea azul celeste punteada en el mapa.
              </p>
            </div>
          </Popup>
        </Marker>
      )}
    </>
  );
}

/**
 * Componente principal MapComponent con la Senda Oficial del Carnaval
 */
export function MapComponent({
  children,
  onSelectDestination,
  selectedDestination,
  userLocation,
  userGps,
  ...props
}: any) {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#07090e]">
      <MapContainer
        center={DEFAULT_MAP_CENTER}
        zoom={DEFAULT_MAP_ZOOM}
        bounds={SENDA_OFICIAL_COORDS}
        className="w-full h-full relative z-0 bg-[#07090e]"
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        scrollWheelZoom={true}
      >
        <SendaBoundsFitter coords={SENDA_OFICIAL_COORDS} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors • CarnavalIA'
        />
        <Polyline
          positions={SENDA_OFICIAL_COORDS}
          pathOptions={{
            color: '#E11D48',
            weight: 7,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
        {HITOS_SENDA.map((h) => (
          <Marker key={h.id} position={h.coords}>
            <Tooltip direction="top" permanent>{h.name}</Tooltip>
          </Marker>
        ))}
        {/* Capa interactiva de POIs (Baños, Restaurantes, CAIs, Salud, Tarimas) */}
        <PastoPoiMarkersLayer />
        {/* User GPS location: distinct pulsing blue dot and radar halo */}
        {(() => {
          const loc = userLocation || userGps || (props && props.userGps) || (props && props.userLocation);
          if (!loc) return null;
          const pos: [number, number] | null = Array.isArray(loc)
            ? (loc as [number, number])
            : (typeof loc.lat === 'number' && typeof loc.lng === 'number' ? [loc.lat, loc.lng] : null);
          if (!pos || isNaN(pos[0]) || isNaN(pos[1])) return null;

          return (
            <>
              {/* Outer radar halo circle simulating active GPS tracking */}
              <CircleMarker
                center={pos}
                radius={20}
                pathOptions={{
                  color: '#3b82f6',
                  fillColor: '#60a5fa',
                  fillOpacity: 0.25,
                  weight: 1.5,
                  className: 'animate-pulse',
                }}
              />
              {/* Distinct blue GPS dot */}
              <CircleMarker
                center={pos}
                radius={8}
                pathOptions={{
                  color: '#ffffff',
                  fillColor: '#2563eb',
                  fillOpacity: 1,
                  weight: 3,
                }}
              >
                <Popup>Tu ubicación actual (GPS)</Popup>
              </CircleMarker>
            </>
          );
        })()}
        {/* Manejador de enrutamiento dinámico en tiempo real OSRM de GuaneñaBot */}
        <GuanenaRoutingHandler
          selectedDestination={selectedDestination}
          onDestinationChanged={onSelectDestination}
          userLocation={userLocation}
        />
        {children}
      </MapContainer>
    </div>
  );
}

export default MapComponent;
