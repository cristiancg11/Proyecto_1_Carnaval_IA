import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import { ScheduleBar } from './ScheduleBar';
import { CARNIVAL_ROUTES } from '../data/carnivalRoutes';
import {
  RESTAURANTS_DATA,
  getRestaurantStatus,
  calculateDistanceKm,
  formatDistance,
} from '../data/restaurantsData';
import {
  MapPin,
  Clock,
  Sparkles,
  Locate,
  Compass,
  Plus,
  Minus,
  Calendar,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Utensils,
  Navigation,
} from 'lucide-react';

// Coordenadas centrales de San Juan de Pasto (Plaza de Nariño / Corazón del Carnaval)
const PASTO_CENTER = [1.2136, -77.2811];

// Trazo oficial y fidedigno de la Senda del Carnaval de Pasto
// Recorre desde la concentración en Av. Boyacá pasando por la Plaza del Carnaval,
// Carrera 27, Plaza de Nariño, Parque Infantil y finalizando en Av. Los Estudiantes / Fuente de la Transparencia
const SENDA_DEL_CARNAVAL_COORDS = [
  [1.2055, -77.2755], // Concentración de Carrozas (Av. Boyacá)
  [1.2085, -77.2768], // Ingreso a la Senda
  [1.2115, -77.2785], // Plaza del Carnaval y de la Cultura (Cra 27 con Cll 17)
  [1.2130, -77.2780], // Corredor Carrera 27 (Sector Bomboná)
  [1.2145, -77.2782], // Sector Plaza de Nariño
  [1.2168, -77.2805], // Carrera 27 hacia el norte (Calle 20 y 21)
  [1.2205, -77.2850], // Sector Parque Infantil
  [1.2230, -77.2868], // Salida del Parque Infantil hacia Av. Los Estudiantes
  [1.2250, -77.2885], // Senda Avenida Los Estudiantes
  [1.2275, -77.2910], // Fuente de la Transparencia / Llegada final
];

// Zonas de congestión y riesgo por defecto (con las 4 ubicaciones clave solicitadas)
const DEFAULT_CARNAVAL_ZONES = [
  {
    id: 1,
    zone_name: 'Plaza del Carnaval',
    latitude: 1.2115,
    longitude: -77.2785,
    radius_meters: 280,
    risk_level: 'Alto',
    congestion_percentage: 78.0,
    active_reports_count: 4,
  },
  {
    id: 2,
    zone_name: 'Plaza de Nariño',
    latitude: 1.2145,
    longitude: -77.2782,
    radius_meters: 260,
    risk_level: 'Medio',
    congestion_percentage: 55.0,
    active_reports_count: 2,
  },
  {
    id: 3,
    zone_name: 'Parque Infantil',
    latitude: 1.2205,
    longitude: -77.2850,
    radius_meters: 300,
    risk_level: 'Medio',
    congestion_percentage: 40.0,
    active_reports_count: 1,
  },
  {
    id: 4,
    zone_name: 'Senda Avenida Los Estudiantes',
    latitude: 1.2250,
    longitude: -77.2885,
    radius_meters: 320,
    risk_level: 'Bajo',
    congestion_percentage: 20.0,
    active_reports_count: 0,
  },
];

// Círculo azul pulsante con halo semitransparente (Clásico GPS de Google Maps)
const createGoogleMapsGpsIcon = () => {
  return L.divIcon({
    className: 'google-maps-gps-marker',
    html: `
      <div style="
        position: relative;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <!-- Halo azul pulsante semitransparente de Google Maps -->
        <span style="
          position: absolute;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(37, 99, 235, 0.38);
          animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></span>
        <!-- Círculo interior azul vibrante con borde blanco nítido -->
        <span style="
          position: relative;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #1d4ed8;
          border: 3px solid #ffffff;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.45);
          display: block;
        "></span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

// Helper para crear iconos Leaflet personalizados HTML (DivIcon) ultra-modernos con esquinas redondeadas y resplandor
const createCustomIcon = (gradient, iconHtml, pulse = false, glowColor = 'rgba(255,255,255,0.4)') => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background: ${gradient};
        width: 38px;
        height: 38px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid rgba(255, 255, 255, 0.95);
        box-shadow: 0 8px 24px -2px rgba(0, 0, 0, 0.65), 0 0 16px ${glowColor}, inset 0 1px 1px rgba(255,255,255,0.6);
        color: #ffffff;
        font-size: 18px;
        position: relative;
        cursor: pointer;
        transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      ">
        ${pulse ? `<span style="
          position: absolute;
          inset: -6px;
          border-radius: 18px;
          background: ${glowColor};
          opacity: 0.55;
          animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
          z-index: -1;
        "></span>` : ''}
        <span style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">${iconHtml}</span>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -22],
  });
};

// Marcador de Inicio de Desfile: Pin verde con ícono "🏁 Inicio"
const createStartPointIcon = () => {
  return L.divIcon({
    className: 'carnival-start-marker',
    html: `
      <div style="
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        padding: 5px 10px;
        border-radius: 9999px;
        display: flex;
        align-items: center;
        gap: 5px;
        border: 2px solid #ffffff;
        box-shadow: 0 4px 16px rgba(16, 185, 129, 0.7), 0 2px 8px rgba(0,0,0,0.5);
        color: #ffffff;
        font-weight: 800;
        font-size: 11px;
        white-space: nowrap;
        cursor: pointer;
        transform: translateY(-50%);
      ">
        <span style="font-size: 13px;">🏁</span>
        <span style="letter-spacing: 0.3px;">Inicio</span>
      </div>
    `,
    iconSize: [78, 30],
    iconAnchor: [39, 15],
    popupAnchor: [0, -18],
  });
};

// Marcador de Llegada de Desfile: Pin a cuadros / rojo con ícono "🏆 Fin"
const createEndPointIcon = () => {
  return L.divIcon({
    className: 'carnival-end-marker',
    html: `
      <div style="
        background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
        padding: 5px 10px;
        border-radius: 9999px;
        display: flex;
        align-items: center;
        gap: 5px;
        border: 2px solid #ffffff;
        box-shadow: 0 4px 16px rgba(239, 68, 68, 0.7), 0 2px 8px rgba(0,0,0,0.5);
        color: #ffffff;
        font-weight: 800;
        font-size: 11px;
        white-space: nowrap;
        cursor: pointer;
        transform: translateY(-50%);
      ">
        <span style="font-size: 13px;">🏆</span>
        <span style="letter-spacing: 0.3px;">Fin</span>
      </div>
    `,
    iconSize: [68, 30],
    iconAnchor: [34, 15],
    popupAnchor: [0, -18],
  });
};

// Marcador de Cierre Vial: Pin circular rojo con símbolo "⛔"
const createRoadClosureIcon = () => {
  return L.divIcon({
    className: 'carnival-road-closure-marker',
    html: `
      <div style="
        background: #dc2626;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #ffffff;
        box-shadow: 0 4px 14px rgba(220, 38, 38, 0.75), 0 0 10px rgba(220, 38, 38, 0.4);
        color: #ffffff;
        font-size: 15px;
        cursor: pointer;
      ">
        ⛔
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16],
  });
};

// Marcador para Restaurantes Típicos: Pin ámbar/naranja con ícono 🍽️ y badge abierto/cerrado
const createRestaurantIcon = (isOpen) => {
  return L.divIcon({
    className: 'custom-restaurant-marker',
    html: `
      <div style="
        background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
        width: 38px;
        height: 38px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid rgba(255, 255, 255, 0.95);
        box-shadow: 0 8px 24px -2px rgba(0, 0, 0, 0.65), 0 0 16px rgba(249, 115, 22, 0.6);
        color: #ffffff;
        font-size: 18px;
        position: relative;
        cursor: pointer;
        transition: transform 0.25s ease;
      ">
        <span style="
          position: absolute;
          top: -3px;
          right: -3px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: ${isOpen ? '#22c55e' : '#ef4444'};
          border: 1.5px solid #ffffff;
          box-shadow: 0 0 6px ${isOpen ? '#22c55e' : '#ef4444'};
        "></span>
        <span style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">🍽️</span>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -22],
  });
};

// Generador de iconos para Puntos de Interés según categoría (Gradients modernos y neones)
const getPoiIcon = (category) => {
  switch (category?.toLowerCase()) {
    case 'salud':
      return createCustomIcon('linear-gradient(135deg, #ff2a6d 0%, #e11d48 100%)', '🏥', false, 'rgba(255, 42, 109, 0.6)');
    case 'policia':
      return createCustomIcon('linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', '👮', false, 'rgba(59, 130, 246, 0.6)');
    case 'tarima':
      return createCustomIcon('linear-gradient(135deg, #c084fc 0%, #9333ea 100%)', '🎭', false, 'rgba(192, 132, 252, 0.6)');
    case 'banio':
      return createCustomIcon('linear-gradient(135deg, #22d3ee 0%, #0891b2 100%)', '🚻', false, 'rgba(34, 211, 238, 0.6)');
    case 'salida':
      return createCustomIcon('linear-gradient(135deg, #34d399 0%, #059669 100%)', '🚪', false, 'rgba(52, 211, 153, 0.6)');
    default:
      return createCustomIcon('linear-gradient(135deg, #94a3b8 0%, #475569 100%)', '📍', false, 'rgba(148, 163, 184, 0.5)');
  }
};

// Generador de iconos para Reportes Ciudadanos según nivel de riesgo
const getReportIcon = (riskLevel) => {
  switch (riskLevel?.toLowerCase()) {
    case 'alto':
      return createCustomIcon('linear-gradient(135deg, #f43f5e 0%, #dc2626 100%)', '⚠️', true, 'rgba(244, 63, 94, 0.7)');
    case 'medio':
      return createCustomIcon('linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', '⚡', true, 'rgba(251, 191, 36, 0.7)');
    case 'bajo':
    default:
      return createCustomIcon('linear-gradient(135deg, #10b981 0%, #059669 100%)', 'ℹ️', false, 'rgba(16, 185, 129, 0.5)');
  }
};

// Helper de colores para zonas de riesgo/congestión
const getZoneColors = (riskLevel, congestionPercentage) => {
  const normRisk = riskLevel?.toLowerCase();
  const cong = Number(congestionPercentage) || 0;

  if (normRisk === 'alto' || cong >= 70) {
    return {
      border: '#f43f5e',
      fill: '#f43f5e',
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      label: 'Alta Congestión / Riesgo Alto',
      fillOpacity: 0.28,
    };
  }
  if (normRisk === 'medio' || cong >= 40) {
    return {
      border: '#fbbf24',
      fill: '#fbbf24',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      label: 'Aglomeración Media',
      fillOpacity: 0.22,
    };
  }
  return {
    border: '#10b981',
    fill: '#10b981',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    label: 'Tráfico Fluido',
    fillOpacity: 0.16,
  };
};

// Componente para capturar clics en el mapa
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Controles flotantes limpios estilo Google Maps (Mi Ubicación + Zoom In/Out)
function GoogleMapsNavigationControls({ onLocate, isLocating, hasUserGps }) {
  const map = useMap();

  return (
    <div
      className="absolute bottom-6 right-5 z-[1000] flex flex-col items-center gap-2.5 pointer-events-auto select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Botón Mi Ubicación (GPS estilo Google Maps) */}
      <button
        type="button"
        onClick={() => onLocate(map)}
        className={`p-3 rounded-xl bg-white shadow-lg hover:shadow-xl border border-slate-200 transition-all duration-200 active:scale-95 flex items-center justify-center group ${
          isLocating
            ? 'text-blue-600 ring-2 ring-blue-500/40'
            : hasUserGps
            ? 'text-blue-600'
            : 'text-slate-700 hover:text-blue-600'
        }`}
        title="Centrar en mi ubicación actual (GPS en tiempo real)"
        aria-label="Mi Ubicación"
      >
        <Locate
          className={`w-5 h-5 ${
            isLocating ? 'animate-spin text-blue-500' : 'group-hover:scale-110 transition-transform'
          }`}
        />
      </button>

      {/* Control de Zoom (+ / -) con fondo blanco y sombra limpia */}
      <div className="flex flex-col bg-white shadow-lg rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
        <button
          type="button"
          onClick={() => map.zoomIn()}
          className="p-3 text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition active:bg-slate-100 flex items-center justify-center"
          title="Acercar mapa"
          aria-label="Acercar mapa"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>
        <button
          type="button"
          onClick={() => map.zoomOut()}
          className="p-3 text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition active:bg-slate-100 flex items-center justify-center"
          title="Alejar mapa"
          aria-label="Alejar mapa"
        >
          <Minus className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}

// Inicializador de Geolocalización al cargar el mapa
function MapAutoGeolocation({ onAutoLocate }) {
  const map = useMap();
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (!hasTriggeredRef.current && map) {
      hasTriggeredRef.current = true;
      map.whenReady(() => {
        onAutoLocate(map);
      });
    }
  }, [map, onAutoLocate]);

  return null;
}

// Controlador para centrar y animar la vista del mapa según el evento/día seleccionado
function MapRouteController({ currentEvent }) {
  const map = useMap();
  const prevEventRef = useRef(null);

  useEffect(() => {
    if (!currentEvent || prevEventRef.current === currentEvent.name || !map) return;
    prevEventRef.current = currentEvent.name;

    const applyView = () => {
      try {
        if (currentEvent.route && currentEvent.route.length > 1) {
          const bounds = L.latLngBounds(currentEvent.route);
          map.fitBounds(bounds, { padding: [70, 70], maxZoom: 16, duration: 1.2 });
        } else if (currentEvent.closedPoints && currentEvent.closedPoints.length > 0) {
          const bounds = L.latLngBounds(currentEvent.closedPoints.map((p) => [p.lat, p.lng]));
          map.fitBounds(bounds, { padding: [80, 80], maxZoom: 15, duration: 1.2 });
        } else {
          map.flyTo(PASTO_CENTER, 15, { duration: 1.2 });
        }
      } catch (err) {
        console.warn("Map view adjustment deferred:", err);
      }
    };

    if (map._loaded) {
      applyView();
    } else {
      map.whenReady(applyView);
    }
  }, [currentEvent, map]);

  return null;
}

// Controlador para ajustar automáticamente la vista al trazar una ruta de navegación con la IA
function NavRouteController({ navRoute }) {
  const map = useMap();
  const prevNavRef = useRef(null);

  useEffect(() => {
    if (!navRoute || !navRoute.startCoords || !navRoute.targetCoords || !map) return;

    const navKey = `${navRoute.targetName}-${navRoute.startCoords.join(',')}-${navRoute.targetCoords.join(',')}`;
    if (prevNavRef.current === navKey) return;
    prevNavRef.current = navKey;

    const adjust = () => {
      try {
        map.fitBounds([navRoute.startCoords, navRoute.targetCoords], { padding: [50, 50] });
      } catch (err) {
        console.warn("Error en fitBounds de navegación:", err);
      }
    };

    if (map._loaded) {
      adjust();
    } else {
      map.whenReady(adjust);
    }
  }, [navRoute, map]);

  return null;
}

export function MapView({
  pois = [],
  reports = [],
  zones = [],
  onSelectCoordinates,
  selectedLocation,
  selectedDay: propSelectedDay,
  onSelectDay: propOnSelectDay,
  onUserLocationChange,
  navRoute = null,
  setNavRoute,
}) {
  // Día seleccionado del Carnaval (sincronizable con componente superior o local)
  const [internalDay, setInternalDay] = useState('06-ene');
  const selectedDay = propSelectedDay || internalDay;
  const setSelectedDay = (day) => {
    setInternalDay(day);
    if (propOnSelectDay) {
      propOnSelectDay(day);
    }
  };

  const [isCardMinimized, setIsCardMinimized] = useState(false);

  // Información del evento del día seleccionado
  const currentEvent = useMemo(() => {
    return CARNIVAL_ROUTES[selectedDay] || CARNIVAL_ROUTES['06-ene'];
  }, [selectedDay]);

  // Filtro activo de visualización rápida
  const [activeFilter, setActiveFilter] = useState('todos');

  // Estado de geolocalización GPS del usuario
  const [userGps, setUserGps] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  // Opciones de filtro
  const filterOptions = [
    { id: 'todos', label: 'Todos', icon: '✨' },
    { id: 'restaurantes', label: 'Restaurantes', icon: '🍽️' },
    { id: 'salud', label: 'Salud', icon: '🏥' },
    { id: 'policia', label: 'Policía', icon: '👮' },
    { id: 'tarima', label: 'Tarimas', icon: '🎭' },
    { id: 'banio', label: 'Baños', icon: '🚻' },
    { id: 'zonas', label: 'Zonas de Riesgo', icon: '⚠️' },
  ];

  // Función para obtener y centrar la ubicación GPS del usuario con alta precisión
  const handleLocateUser = useCallback(
    (map, isAuto = false) => {
      if (!('geolocation' in navigator)) {
        if (!isAuto) {
          alert('La geolocalización no está soportada en tu navegador.');
        }
        return;
      }

      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocating(false);
          const { latitude, longitude, accuracy } = position.coords;
          const coords = { lat: latitude, lng: longitude, accuracy };
          setUserGps(coords);
          if (onUserLocationChange) {
            onUserLocationChange(coords);
          }
          if (map) {
            try {
              if (map._loaded) {
                map.flyTo([latitude, longitude], 17, { animate: true });
              } else {
                map.whenReady(() => {
                  map.flyTo([latitude, longitude], 17, { animate: true });
                });
              }
            } catch (err) {
              console.warn("flyTo GPS deferred:", err);
            }
          }
        },
        (error) => {
          setIsLocating(false);
          console.info(
            isAuto
              ? 'Geolocalización GPS no concedida al inicio. Usando centro por defecto (Plaza de Nariño, Pasto).'
              : 'Error o permiso denegado al consultar GPS:',
            error.message
          );
          if (!isAuto && map) {
            try {
              if (map._loaded) {
                map.flyTo(PASTO_CENTER, 17, { animate: true });
              } else {
                map.whenReady(() => {
                  map.flyTo(PASTO_CENTER, 17, { animate: true });
                });
              }
            } catch (err) {
              console.warn("flyTo fallback deferred:", err);
            }
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    },
    [onUserLocationChange]
  );

  // Zonas consolidadas (datos del backend o sectores oficiales de Pasto)
  const effectiveZones = useMemo(() => {
    if (zones && zones.length > 0) {
      return zones.map((z) => {
        const defMatch = DEFAULT_CARNAVAL_ZONES.find(
          (dz) => dz.zone_name.toLowerCase() === z.zone_name.toLowerCase()
        );
        return {
          ...defMatch,
          ...z,
          latitude: z.latitude || defMatch?.latitude || PASTO_CENTER[0],
          longitude: z.longitude || defMatch?.longitude || PASTO_CENTER[1],
          radius_meters: z.radius_meters || defMatch?.radius_meters || 300,
          congestion_percentage: z.congestion_percentage ?? defMatch?.congestion_percentage ?? (z.active_reports_count * 20),
        };
      });
    }
    return DEFAULT_CARNAVAL_ZONES;
  }, [zones]);

  // Filtrado reactivo de POIs según el botón seleccionado
  const filteredPois = useMemo(() => {
    if (activeFilter === 'todos') return pois;
    if (['salud', 'policia', 'tarima', 'banio'].includes(activeFilter)) {
      return pois.filter(
        (p) => p.category?.toLowerCase() === activeFilter.toLowerCase()
      );
    }
    if (activeFilter === 'zonas' || activeFilter === 'restaurantes') return [];
    return pois;
  }, [pois, activeFilter]);

  // Filtrado de reportes
  const filteredReports = useMemo(() => {
    if (activeFilter === 'todos' || activeFilter === 'zonas') return reports;
    return [];
  }, [reports, activeFilter]);

  // Determinar si se muestran las zonas
  const showZones = activeFilter === 'todos' || activeFilter === 'zonas';

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden shadow-2xl bg-slate-950">
      {/* 1. Contenedor Superior Fijo: Barra de Selección de Días y Filtros Rápidos */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col gap-2 pointer-events-none">
        {/* Barra de Agenda por Días del Carnaval */}
        <div className="pointer-events-auto">
          <ScheduleBar selectedDay={selectedDay} onSelectDay={setSelectedDay} />
        </div>

        {/* Barra Flotante de Filtros Rápidos */}
        <div className="pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-full bg-slate-950/85 backdrop-blur-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.65)] w-max max-w-full overflow-x-auto no-scrollbar">
          <span className="hidden sm:flex items-center gap-1.5 pl-3 pr-2 text-xs font-black tracking-wider uppercase bg-gradient-to-r from-amber-400 via-rose-300 to-purple-400 bg-clip-text text-transparent select-none">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Filtros</span>
          </span>

          {filterOptions.map((f) => {
            const isActive = activeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`group flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap active:scale-95 ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-amber-500 text-white shadow-[0_0_22px_rgba(217,70,239,0.55)] ring-1 ring-white/30 scale-[1.03]'
                    : 'text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.06] hover:border-white/20'
                }`}
              >
                <span className="text-sm transition-transform duration-200 group-hover:scale-110">{f.icon}</span>
                <span>{f.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Tarjeta Informativa Flotante del Día Seleccionado y Estado de Vías */}
      <div className="absolute bottom-5 left-4 z-[1000] max-w-sm sm:max-w-md w-[calc(100vw-2rem)] sm:w-auto bg-slate-950/92 backdrop-blur-2xl p-4 rounded-2xl border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.7)] text-slate-200 pointer-events-auto">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-2 mb-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{
                  backgroundColor: currentEvent.color,
                  boxShadow: `0 0 10px ${currentEvent.color}`,
                }}
              />
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                Evento Oficial
              </span>
              <span className="text-[10px] text-slate-300 font-mono bg-white/10 px-2 py-0.5 rounded-full border border-white/10 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>{currentEvent.hours}</span>
              </span>
            </div>
            <h3 className="text-sm font-black text-white leading-tight">
              {currentEvent.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsCardMinimized(!isCardMinimized)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition shrink-0"
            title={isCardMinimized ? 'Expandir información' : 'Minimizar información'}
          >
            {isCardMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {!isCardMinimized && (
          <div className="space-y-2.5 text-xs">
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {currentEvent.description}
            </p>

            {/* Badges de estado de vías */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/[0.08]">
              {currentEvent.closedPoints && currentEvent.closedPoints.length > 0 ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-bold">
                  <span>⛔</span>
                  <span>{currentEvent.closedPoints.length} Puntos de Cierre Vial</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                  <span>✅</span>
                  <span>Vías Urbanas Despejadas</span>
                </div>
              )}

              {currentEvent.route && currentEvent.route.length > 0 ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-300 text-[11px] font-bold">
                  <span>🎉</span>
                  <span>Ruta Oficial Trazada</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold">
                  <span>🚶</span>
                  <span>Sector Peatonal Cultural</span>
                </div>
              )}

              {currentEvent.startPoint && (
                <div className="w-full flex items-center gap-1.5 text-slate-300 text-[10px] mt-1">
                  <span className="text-emerald-400 font-bold shrink-0">🏁 Salida:</span>
                  <span className="truncate">{currentEvent.startPoint.label.replace(/^Salida:\s*/i, '')}</span>
                </div>
              )}

              {currentEvent.endPoint && (
                <div className="w-full flex items-center gap-1.5 text-slate-300 text-[10px]">
                  <span className="text-rose-400 font-bold shrink-0">🏆 Llegada:</span>
                  <span className="truncate">{currentEvent.endPoint.label.replace(/^Llegada:\s*/i, '')}</span>
                </div>
              )}
            </div>

            <p className="text-[10px] text-slate-400 pt-1 border-t border-white/[0.08] flex items-center justify-between">
              <span>💡 Clic en los ⛔ para ver el horario del cierre</span>
              <span className="text-amber-400 font-bold">Pasto 2026</span>
            </p>
          </div>
        )}
      </div>

      {/* 2.1 Tarjeta Flotante de Navegación Activa (Generada por la IA) */}
      {navRoute && (
        <div className="absolute bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-[1100] flex items-center gap-3.5 px-5 py-3 rounded-2xl bg-slate-950/95 backdrop-blur-2xl border border-blue-500/50 shadow-[0_0_35px_rgba(37,99,235,0.5)] text-white pointer-events-auto">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            <span className="text-xs sm:text-sm font-black whitespace-nowrap">
              🧭 Navegando hacia: <span className="text-blue-400 font-black">{navRoute.targetName}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setNavRoute && setNavRoute(null)}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-black transition shadow-md whitespace-nowrap cursor-pointer"
          >
            Terminar Navegación
          </button>
        </div>
      )}

      {/* 3. Contenedor de Leaflet con Mosaicos de Calles Reales */}
      <MapContainer
        center={PASTO_CENTER}
        zoom={16}
        zoomControl={false}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <MapClickHandler onMapClick={onSelectCoordinates} />

        {/* Inicializador de geolocalización automática al cargar */}
        <MapAutoGeolocation onAutoLocate={(map) => handleLocateUser(map, true)} />

        {/* Controlador para centrar y animar la vista al cambiar de día/evento */}
        <MapRouteController currentEvent={currentEvent} />

        {/* Controlador para centrar y animar la vista al trazar una ruta con IA */}
        <NavRouteController navRoute={navRoute} />

        {/* Controles de navegación estilo Google Maps (Mi Ubicación + Zoom) */}
        <GoogleMapsNavigationControls
          onLocate={(map) => handleLocateUser(map, false)}
          isLocating={isLocating}
          hasUserGps={Boolean(userGps)}
        />

        {/* Capa de mosaicos con calles reales detalladas (OpenStreetMap Estándar con nombres de calles, carreras y manzanas) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Marcador GPS del Usuario (Punto Azul con Halo Pulsante estilo Google Maps) */}
        {userGps && (
          <>
            {/* Halo semitransparente de precisión GPS */}
            <Circle
              center={[userGps.lat, userGps.lng]}
              radius={Math.min(userGps.accuracy || 35, 60)}
              pathOptions={{
                fillColor: '#3b82f6',
                fillOpacity: 0.15,
                color: '#2563eb',
                weight: 1.5,
                opacity: 0.45,
              }}
            />
            {/* Punto azul característico con pulso */}
            <Marker
              position={[userGps.lat, userGps.lng]}
              icon={createGoogleMapsGpsIcon()}
            >
              <Popup>
                <div className="p-1 min-w-[200px] font-sans">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-1.5 mb-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.7)] animate-pulse"></span>
                    <strong className="text-blue-400 text-xs font-black">Tu ubicación actual en Pasto</strong>
                  </div>
                  <p className="text-xs text-slate-300 leading-snug">
                    Geolocalización GPS de alta precisión en tiempo real.
                  </p>
                  <div className="mt-2 text-[10px] text-slate-400 font-mono flex items-center justify-between border-t border-white/10 pt-1">
                    <span>Lat: {userGps.lat.toFixed(5)}</span>
                    <span>Lng: {userGps.lng.toFixed(5)}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {/* Trazo Fijo Fino de Referencia de la Senda Principal */}
        <Polyline
          positions={SENDA_DEL_CARNAVAL_COORDS}
          pathOptions={{
            color: '#6366f1',
            weight: 2,
            opacity: 0.2,
            dashArray: '4, 6',
          }}
        />

        {/* Polilínea Dinámica: Trazado oficial del día seleccionado */}
        {currentEvent.route && currentEvent.route.length > 1 && (
          <>
            {/* Resplandor exterior de la ruta del día */}
            <Polyline
              positions={currentEvent.route}
              pathOptions={{
                color: currentEvent.color,
                weight: 12,
                opacity: 0.3,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            {/* Polilínea principal requerida */}
            <Polyline
              positions={currentEvent.route}
              color={currentEvent.color}
              weight={6}
              opacity={0.85}
              pathOptions={{
                color: currentEvent.color,
                weight: 6,
                opacity: 0.85,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            >
              <Popup>
                <div className="p-1 min-w-[210px] font-sans">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-1 mb-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: currentEvent.color }}
                    />
                    <strong className="text-xs font-black text-white">
                      {currentEvent.name}
                    </strong>
                  </div>
                  <p className="text-xs text-slate-300 mb-1 leading-snug">
                    {currentEvent.description}
                  </p>
                  <div className="text-[11px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md inline-block">
                    Horario de Desfile: {currentEvent.hours}
                  </div>
                </div>
              </Popup>
            </Polyline>
          </>
        )}

        {/* Línea de Ruta de Navegación asistida por IA */}
        {navRoute && navRoute.startCoords && navRoute.targetCoords && (
          <>
            <Polyline 
              positions={[navRoute.startCoords, navRoute.targetCoords]} 
              pathOptions={{ color: '#2563eb', weight: 6, dashArray: '8, 8' }} 
            />
            <Marker
              position={navRoute.targetCoords}
              icon={createCustomIcon('linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', '🎯', true, 'rgba(37, 99, 235, 0.75)')}
            >
              <Popup>
                <div className="text-xs p-1 font-sans">
                  <span className="text-[10px] font-black uppercase text-blue-400 block mb-0.5">
                    Destino Asistido por IA
                  </span>
                  <strong className="text-white block font-black text-sm">
                    {navRoute.targetName}
                  </strong>
                  <p className="text-slate-300 mt-1">
                    Navegación activa hacia este punto del Carnaval de Pasto.
                  </p>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {/* Marcador Salida: Pin verde con ícono "🏁 Inicio" */}
        {currentEvent.startPoint && (
          <Marker
            position={[currentEvent.startPoint.lat, currentEvent.startPoint.lng]}
            icon={createStartPointIcon()}
          >
            <Popup>
              <div className="p-1 min-w-[210px] font-sans">
                <div className="flex items-center gap-1.5 text-emerald-400 font-black text-xs border-b border-emerald-500/20 pb-1 mb-1.5">
                  <span>🏁</span>
                  <span>Punto de Inicio / Salida</span>
                </div>
                <p className="text-xs font-bold text-white mb-1">
                  {currentEvent.startPoint.label}
                </p>
                <p className="text-[11px] text-slate-300">
                  Hora programada: {currentEvent.hours.split('-')[0].trim()}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marcador Llegada: Pin a cuadros o rojo con ícono "🏆 Fin" */}
        {currentEvent.endPoint && (
          <Marker
            position={[currentEvent.endPoint.lat, currentEvent.endPoint.lng]}
            icon={createEndPointIcon()}
          >
            <Popup>
              <div className="p-1 min-w-[210px] font-sans">
                <div className="flex items-center gap-1.5 text-rose-400 font-black text-xs border-b border-rose-500/20 pb-1 mb-1.5">
                  <span>🏆</span>
                  <span>Punto de Llegada / Fin</span>
                </div>
                <p className="text-xs font-bold text-white mb-1">
                  {currentEvent.endPoint.label}
                </p>
                <p className="text-[11px] text-slate-300">
                  Desconcentración: {currentEvent.hours.split('-')[1]?.trim() || currentEvent.hours}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marcadores de Cierre Vial: Pines circulares rojos con símbolo "⛔" */}
        {currentEvent.closedPoints &&
          currentEvent.closedPoints.map((cp, idx) => (
            <Marker
              key={`closed-${selectedDay}-${idx}`}
              position={[cp.lat, cp.lng]}
              icon={createRoadClosureIcon()}
            >
              <Popup>
                <div className="p-1 min-w-[210px] font-sans">
                  <div className="flex items-center gap-1.5 text-rose-400 font-black text-xs border-b border-rose-500/25 pb-1 mb-1.5">
                    <span>⛔</span>
                    <span>Cierre Vial por Desfile</span>
                  </div>
                  <p className="text-xs font-bold text-white mb-1.5">{cp.label}</p>
                  <div className="text-xs text-rose-300 bg-rose-500/20 px-2.5 py-1.5 rounded-lg border border-rose-500/30 font-semibold mb-1">
                    Vía cerrada por desfile: {currentEvent.hours}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {currentEvent.name}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* 4. Zonas de Congestión / Riesgo (Áreas translúcidas) */}
        {showZones &&
          effectiveZones.map((zone) => {
            const colors = getZoneColors(zone.risk_level, zone.congestion_percentage);
            const cong = Math.round(zone.congestion_percentage || 0);

            return (
              <Circle
                key={`zone-${zone.id || zone.zone_name}`}
                center={[zone.latitude, zone.longitude]}
                radius={zone.radius_meters || 280}
                pathOptions={{
                  color: colors.border,
                  fillColor: colors.fill,
                  fillOpacity: colors.fillOpacity,
                  weight: 2.5,
                }}
              >
                <Popup>
                  <div className="p-1 min-w-[230px] font-sans">
                    {/* Encabezado del sector */}
                    <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5 mb-2">
                      <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                        <span>{zone.zone_name}</span>
                      </h3>
                      <span
                        className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full border ${colors.badge}`}
                      >
                        {zone.risk_level || 'Normal'}
                      </span>
                    </div>

                    {/* Métricas: Porcentaje de congestión e Incidentes activos */}
                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-slate-400 font-medium">Congestión estimada:</span>
                          <strong className="text-white font-black">{cong}%</strong>
                        </div>
                        {/* Barra de progreso visual con gradiente moderno */}
                        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden p-0.5">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, Math.max(5, cong))}%`,
                              backgroundColor: colors.border,
                              boxShadow: `0 0 10px ${colors.border}`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-1.5 border-t border-white/[0.08]">
                        <span className="text-slate-400 font-medium">Incidentes activos:</span>
                        <span className="px-2 py-0.5 rounded-lg font-bold text-xs bg-white/10 text-white border border-white/10">
                          {zone.active_reports_count || 0} reportes
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-slate-400">
                        <span>Estado:</span>
                        <span className="font-semibold text-slate-300">{colors.label}</span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Circle>
            );
          })}

        {/* 5. Marcadores de Puntos de Interés (Salud, Policía, Tarimas, Baños, etc.) */}
        {filteredPois.map((poi) => (
          <Marker
            key={`poi-${poi.id}`}
            position={[poi.latitude, poi.longitude]}
            icon={getPoiIcon(poi.category)}
          >
            <Popup>
              <div className="p-1 min-w-[220px] font-sans">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-rose-300 bg-rose-500/20 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                  {poi.category}
                </span>
                <h4 className="font-black text-sm text-white mt-2">{poi.name}</h4>
                {poi.description && (
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {poi.description}
                  </p>
                )}
                <div className="mt-2.5 pt-1.5 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="text-amber-400/80 font-medium">Senda del Carnaval</span>
                  <span>{poi.latitude.toFixed(4)}, {poi.longitude.toFixed(4)}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 5.1 Capa de Restaurantes Típicos Reales de Pasto */}
        {(activeFilter === 'todos' || activeFilter === 'restaurantes') &&
          RESTAURANTS_DATA.map((restaurant) => {
            const status = getRestaurantStatus(restaurant.hours);
            const distKm = userGps
              ? calculateDistanceKm(
                  userGps.lat,
                  userGps.lng,
                  restaurant.latitude,
                  restaurant.longitude
                )
              : null;
            const distStr = formatDistance(distKm);

            return (
              <Marker
                key={`restaurant-${restaurant.id}`}
                position={[restaurant.latitude, restaurant.longitude]}
                icon={createRestaurantIcon(status.isOpen)}
              >
                <Popup>
                  <div className="p-1 min-w-[240px] font-sans">
                    <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5 mb-1.5">
                      <span className="text-[10px] uppercase font-black text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                        <span>🍽️</span>
                        <span>Gastronomía Típica</span>
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${status.className}`}
                      >
                        {status.badge}
                      </span>
                    </div>

                    <h4 className="font-black text-sm text-white">{restaurant.name}</h4>
                    <p className="text-xs text-amber-300 font-semibold mt-0.5">
                      {restaurant.specialty}
                    </p>
                    <p className="text-xs text-slate-300 mt-1 leading-snug">
                      {restaurant.description}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-white/10 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-slate-300 text-[11px]">
                        <span className="text-slate-400">Sector:</span>
                        <span className="font-semibold text-white">{restaurant.sector}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300 text-[11px]">
                        <span className="text-slate-400">Horario:</span>
                        <span className="font-semibold text-slate-200">{restaurant.hours}</span>
                      </div>
                      {distStr && (
                        <div className="flex items-center justify-between text-cyan-300 font-bold bg-cyan-950/40 px-2.5 py-1 rounded-lg border border-cyan-500/30 mt-1 text-[11px]">
                          <span className="flex items-center gap-1">
                            <Navigation className="w-3 h-3 text-cyan-400" />
                            <span>Distancia estimada:</span>
                          </span>
                          <span>A {distStr} de ti</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* 6. Marcadores de Reportes Ciudadanos */}
        {filteredReports.map((report) => (
          <Marker
            key={`report-${report.id}`}
            position={[report.latitude, report.longitude]}
            icon={getReportIcon(report.ai_risk_level)}
          >
            <Popup>
              <div className="p-1 min-w-[220px] font-sans">
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5 mb-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-300 bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
                    {report.category}
                  </span>
                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                      report.ai_risk_level === 'Alto'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : report.ai_risk_level === 'Medio'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    Riesgo {report.ai_risk_level || 'Bajo'}
                  </span>
                </div>
                <h4 className="font-black text-sm text-white">{report.title}</h4>
                {report.description && (
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {report.description}
                  </p>
                )}
                <div className="mt-2.5 pt-1.5 border-t border-white/10 flex justify-between items-center text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">Estado: {report.status}</span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3 h-3" />
                    {new Date(report.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 7. Marcador temporal de ubicación seleccionada por clic */}
        {selectedLocation && (
          <Marker
            position={[selectedLocation.lat, selectedLocation.lng]}
            icon={createCustomIcon('linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', '📍', true, 'rgba(251, 191, 36, 0.7)')}
          >
            <Popup>
              <div className="text-xs p-1 font-sans">
                <strong className="text-amber-400 block font-black text-sm">
                  Ubicación Seleccionada
                </strong>
                <p className="text-slate-300 mt-1">
                  Listo para registrar una incidencia ciudadana en este punto de la senda.
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

export default MapView;
