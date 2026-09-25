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
    <div className="relative w-full h-full min-h-[500px] overflow-hidden shadow-2xl bg-slate-950">
      {/* 1. Barra Flotante de Filtros Rápidos (Cápsula de Cristal Futurista) */}
      <div className="absolute top-4 left-4 z-[1000] flex items-center gap-1.5 p-1.5 rounded-full bg-slate-950/85 backdrop-blur-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.65)] max-w-[calc(100vw-2rem)] sm:max-w-none overflow-x-auto">
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

      {/* 2. Convenciones e Instrucción Flotante en la esquina inferior */}
      <div className="absolute bottom-5 left-4 z-[1000] bg-slate-950/90 backdrop-blur-2xl px-4 py-3 rounded-2xl border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.7)] text-xs space-y-2 hidden md:block max-w-xs">
        <p className="font-black text-slate-100 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="bg-gradient-to-r from-amber-400 via-rose-300 to-purple-400 bg-clip-text text-transparent">
            Senda del Carnaval Pasto
          </span>
        </p>

        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-4 h-1.5 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400 inline-block shadow-sm"></span>
            <span className="font-semibold text-slate-200">Ruta Oficial Desfile (~7km)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] inline-block"></span>
            <span>Riesgo / Congestión Alta</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)] inline-block"></span>
            <span>Congestión Media</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] inline-block"></span>
            <span>Tráfico Fluido</span>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 pt-1.5 border-t border-white/[0.08]">
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

        {/* Trazado Láser Multicapa de la Senda del Carnaval */}
        {/* Capa 1: Resplandor difuso Fucsia Neón */}
        <Polyline
          positions={SENDA_DEL_CARNAVAL_COORDS}
          pathOptions={{
            color: '#ec4899',
            weight: 12,
            opacity: 0.35,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />

        {/* Capa 2: Resplandor Eléctrico Violeta */}
        <Polyline
          positions={SENDA_DEL_CARNAVAL_COORDS}
          pathOptions={{
            color: '#8b5cf6',
            weight: 6,
            opacity: 0.85,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />

        {/* Capa 3: Línea central punteada en Oro festivo */}
        <Polyline
          positions={SENDA_DEL_CARNAVAL_COORDS}
          pathOptions={{
            color: '#fbbf24',
            weight: 2.5,
            opacity: 1,
            dashArray: '6, 8',
            lineCap: 'round',
          }}
        >
          <Popup>
            <div className="p-1 min-w-[210px] font-sans">
              <div className="flex items-center gap-2 border-b border-white/10 pb-1.5 mb-2">
                <span className="text-xl">🎭</span>
                <h3 className="font-black text-sm bg-gradient-to-r from-amber-400 via-rose-300 to-purple-400 bg-clip-text text-transparent">
                  Senda Oficial del Carnaval
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Recorrido oficial de desfiles, murgas y carrozas monumentales de San Juan de Pasto por la Carrera 27 y principales plazas.
              </p>
              <div className="mt-2.5 text-[11px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-xl inline-block">
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

