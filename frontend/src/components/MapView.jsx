import React, { useState, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin,
  Clock,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';

// Coordenadas centrales de San Juan de Pasto (Plaza de Nariño / Corazón del Carnaval)
const PASTO_CENTER = [1.2136, -77.2811];

// Trazo oficial y fidedigno de la Senda del Carnaval de Pasto
// Recorre desde el punto de concentración en Av. Boyacá pasando por la Plaza del Carnaval,
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

// Helper para crear iconos Leaflet personalizados HTML (DivIcon)
const createCustomIcon = (bgColor, iconHtml, pulse = false) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background: ${bgColor};
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2.5px solid #ffffff;
        box-shadow: 0 4px 14px rgba(0,0,0,0.5);
        color: #ffffff;
        font-size: 17px;
        position: relative;
        cursor: pointer;
        transition: transform 0.2s ease;
      ">
        ${pulse ? `<span style="
          position: absolute;
          inset: -5px;
          border-radius: 50%;
          background: ${bgColor};
          opacity: 0.55;
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          z-index: -1;
        "></span>` : ''}
        ${iconHtml}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
};

// Generador de iconos para Puntos de Interés según categoría
const getPoiIcon = (category) => {
  switch (category?.toLowerCase()) {
    case 'salud':
      return createCustomIcon('#e11d48', '🏥');
    case 'policia':
      return createCustomIcon('#2563eb', '👮');
    case 'tarima':
      return createCustomIcon('#9333ea', '🎭');
    case 'banio':
      return createCustomIcon('#0891b2', '🚻');
    case 'salida':
      return createCustomIcon('#059669', '🚪');
    default:
      return createCustomIcon('#64748b', '📍');
  }
};

// Generador de iconos para Reportes Ciudadanos según nivel de riesgo
const getReportIcon = (riskLevel) => {
  switch (riskLevel?.toLowerCase()) {
    case 'alto':
      return createCustomIcon('#dc2626', '⚠️', true);
    case 'medio':
      return createCustomIcon('#d97706', '⚡');
    case 'bajo':
    default:
      return createCustomIcon('#16a34a', 'ℹ️');
  }
};

// Helper de colores para zonas de riesgo/congestión
const getZoneColors = (riskLevel, congestionPercentage) => {
  const normRisk = riskLevel?.toLowerCase();
  const cong = Number(congestionPercentage) || 0;

  if (normRisk === 'alto' || cong >= 70) {
    return {
      border: '#ef4444',
      fill: '#ef4444',
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      label: 'Alta Congestión / Riesgo Alto',
      fillOpacity: 0.26,
    };
  }
  if (normRisk === 'medio' || cong >= 40) {
    return {
      border: '#f59e0b',
      fill: '#f59e0b',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      label: 'Aglomeración Media',
      fillOpacity: 0.22,
    };
  }
  return {
    border: '#10b981',
    fill: '#10b981',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    label: 'Tráfico Fluido',
    fillOpacity: 0.18,
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

export function MapView({
  pois = [],
  reports = [],
  zones = [],
  onSelectCoordinates,
  selectedLocation,
}) {
  // Filtro activo de visualización rápida
  const [activeFilter, setActiveFilter] = useState('todos');

  // Opciones de filtro
  const filterOptions = [
    { id: 'todos', label: 'Todos', icon: '✨' },
    { id: 'salud', label: 'Salud', icon: '🏥' },
    { id: 'policia', label: 'Policía', icon: '👮' },
    { id: 'tarima', label: 'Tarimas', icon: '🎭' },
    { id: 'banio', label: 'Baños', icon: '🚻' },
    { id: 'zonas', label: 'Zonas de Riesgo', icon: '⚠️' },
  ];

  // Zonas consolidadas (datos del backend o sectores oficiales de Pasto)
  const effectiveZones = useMemo(() => {
    if (zones && zones.length > 0) {
      return zones.map((z) => {
        // Enlazar coordenadas fidedignas si vienen parciales
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
    // Si seleccionó "zonas", no mostramos POIs para despejar las zonas
    if (activeFilter === 'zonas') return [];
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
    <div className="relative w-full h-full min-h-[500px] overflow-hidden shadow-2xl bg-slate-900">
      {/* 1. Barra Flotante de Filtros Rápidos (Esquina Superior) */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 shadow-2xl max-w-[calc(100vw-2rem)] sm:max-w-none overflow-x-auto">
        <span className="hidden sm:flex items-center gap-1 pl-2 pr-1 text-xs font-bold text-slate-400">
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span>Filtros:</span>
        </span>

        {filterOptions.map((f) => {
          const isActive = activeFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm whitespace-nowrap active:scale-95 ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white shadow-rose-500/25 ring-1 ring-white/20'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60'
              }`}
            >
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Convenciones e Instrucción Flotante en la esquina inferior */}
      <div className="absolute bottom-5 left-4 z-[1000] bg-slate-900/95 backdrop-blur-md px-3.5 py-3 rounded-2xl border border-slate-700/80 shadow-2xl text-xs space-y-2 hidden md:block max-w-xs">
        <p className="font-extrabold text-slate-200 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Senda del Carnaval Pasto</span>
        </p>

        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-4 h-1.5 rounded-full bg-gradient-to-r from-purple-500 via-rose-500 to-amber-400 inline-block shadow-sm"></span>
            <span className="font-semibold text-slate-200">Ruta Oficial Desfile (~7km)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
            <span>Riesgo / Congestión Alta</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            <span>Congestión Media</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>Tráfico Fluido</span>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 pt-1.5 border-t border-slate-800">
          💡 Haz clic en el mapa para reportar una incidencia con IA.
        </p>
      </div>

      {/* 3. Contenedor de Leaflet */}
      <MapContainer
        center={PASTO_CENTER}
        zoom={15}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <MapClickHandler onMapClick={onSelectCoordinates} />

        {/* Capa de mosaicos NÍTIDA con nombres de calles y carreras (CartoDB Voyager) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        {/* Trazado Oficial de la Senda del Carnaval con efecto neón/púrpura y ámbar */}
        {/* Capa exterior brillante (Púrpura) */}
        <Polyline
          positions={SENDA_DEL_CARNAVAL_COORDS}
          pathOptions={{
            color: '#9333ea', // Púrpura vibrante
            weight: 8,
            opacity: 0.7,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />

        {/* Capa interior contrastante (Ámbar con guiones) */}
        <Polyline
          positions={SENDA_DEL_CARNAVAL_COORDS}
          pathOptions={{
            color: '#f59e0b', // Ámbar festivo
            weight: 4,
            opacity: 0.95,
            dashArray: '10, 8',
            lineCap: 'round',
          }}
        >
          <Popup>
            <div className="p-1 min-w-[210px] text-slate-900 font-sans">
              <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1 mb-1.5">
                <span className="text-lg">🎭</span>
                <h3 className="font-extrabold text-sm text-purple-900">
                  Senda Oficial del Carnaval
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Recorrido oficial de desfiles, murgas y carrozas monumentales de San Juan de Pasto por la Carrera 27 y principales plazas.
              </p>
              <div className="mt-2 text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">
                Longitud aproximada: ~7 Kilómetros
              </div>
            </div>
          </Popup>
        </Polyline>

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
                  <div className="p-1 min-w-[230px] font-sans text-slate-900">
                    {/* Encabezado del sector */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5 mb-2">
                      <h3 className="font-black text-sm text-slate-900 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
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
                          <span className="text-slate-500 font-medium">Congestión estimada:</span>
                          <strong className="text-slate-800 font-extrabold">{cong}%</strong>
                        </div>
                        {/* Barra de progreso visual */}
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, Math.max(5, cong))}%`,
                              backgroundColor: colors.border,
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                        <span className="text-slate-500 font-medium">Incidentes activos:</span>
                        <span className="px-2 py-0.5 rounded-md font-bold text-xs bg-slate-100 text-slate-800">
                          {zone.active_reports_count || 0} reportes
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-slate-400">
                        <span>Estado:</span>
                        <span className="font-semibold text-slate-600">{colors.label}</span>
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
              <div className="p-1 min-w-[220px] font-sans text-slate-900">
                <span className="text-[10px] uppercase font-bold tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  {poi.category}
                </span>
                <h4 className="font-black text-sm text-slate-900 mt-1.5">{poi.name}</h4>
                {poi.description && (
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {poi.description}
                  </p>
                )}
                <div className="mt-2.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Senda del Carnaval</span>
                  <span>{poi.latitude.toFixed(4)}, {poi.longitude.toFixed(4)}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 6. Marcadores de Reportes Ciudadanos */}
        {filteredReports.map((report) => (
          <Marker
            key={`report-${report.id}`}
            position={[report.latitude, report.longitude]}
            icon={getReportIcon(report.ai_risk_level)}
          >
            <Popup>
              <div className="p-1 min-w-[220px] font-sans text-slate-900">
                <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5 mb-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                    {report.category}
                  </span>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      report.ai_risk_level === 'Alto'
                        ? 'bg-rose-100 text-rose-700'
                        : report.ai_risk_level === 'Medio'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    Riesgo {report.ai_risk_level || 'Bajo'}
                  </span>
                </div>
                <h4 className="font-black text-sm text-slate-900">{report.title}</h4>
                {report.description && (
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {report.description}
                  </p>
                )}
                <div className="mt-2 pt-1.5 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-600">Estado: {report.status}</span>
                  <span className="flex items-center gap-1">
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
            icon={createCustomIcon('#f59e0b', '📍', true)}
          >
            <Popup>
              <div className="text-xs p-1 font-sans text-slate-900">
                <strong className="text-amber-600 block font-bold text-sm">
                  Ubicación Seleccionada
                </strong>
                <p className="text-slate-600 mt-1">
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
