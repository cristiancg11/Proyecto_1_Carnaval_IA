import React, { useMemo } from 'react';
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
  ShieldAlert,
  HeartPulse,
  Shield,
  Music,
  Bath,
  LogOut,
  MapPin,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';

// Coordenadas centrales de San Juan de Pasto
const PASTO_CENTER = [1.2136, -77.2811];

// Trazo representativo de la Senda del Carnaval de Pasto (~7km de recorrido oficial)
const SENDA_DEL_CARNAVAL_COORDS = [
  [1.2050, -77.2750], // Av. Boyacá (Inicio concentración de carrozas)
  [1.2090, -77.2770], // Plaza del Carnaval y de la Cultura
  [1.2115, -77.2790], // Senda Central (Carrera 27 con Calle 19)
  [1.2136, -77.2811], // Sector Plaza de Nariño
  [1.2160, -77.2820], // Carrera 27 hacia el norte
  [1.2180, -77.2830], // Sector Parque Infantil
  [1.2220, -77.2855], // Fuente de la Transparencia / Salida hacia Estadio
];

// Helper para crear iconos Leaflet personalizados HTML (DivIcon)
const createCustomIcon = (bgColor, iconHtml, pulse = false) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background: ${bgColor};
        width: 34px;
        height: 34px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #ffffff;
        box-shadow: 0 4px 12px rgba(0,0,0,0.45);
        color: #ffffff;
        position: relative;
      ">
        ${pulse ? `<span style="
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          background: ${bgColor};
          opacity: 0.5;
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          z-index: -1;
        "></span>` : ''}
        ${iconHtml}
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
};

// Generador de iconos para Puntos de Interés según categoría
const getPoiIcon = (category) => {
  switch (category?.toLowerCase()) {
    case 'salud':
      return createCustomIcon('#e11d48', '🚑');
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

// Generador de iconos para Reportes según el nivel de riesgo evaluado por IA
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

// Componente para capturar clics en el mapa y abrir formulario de reporte
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
  return (
    <div className="relative w-full h-full min-h-[500px] rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900">
      {/* Banner de instrucciones rápidas */}
      <div className="absolute top-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/80 shadow-lg text-xs text-slate-300 max-w-xs pointer-events-none">
        <p className="font-semibold text-slate-100 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          Mapa Interactivo de Pasto
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Haz clic en cualquier punto del mapa para registrar una nueva incidencia ciudadana.
        </p>
      </div>

      {/* Leyenda de elementos del mapa */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-700/80 shadow-xl text-xs space-y-1.5 hidden sm:block">
        <p className="font-bold text-slate-200 text-[11px] uppercase tracking-wider">
          Convenciones del Mapa
        </p>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-3 h-3 rounded-full bg-rose-600 inline-block"></span>
          <span>Riesgo Alto (IA)</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
          <span>Riesgo Medio (IA)</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span>
          <span>Riesgo Bajo / Normal</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300 pt-1 border-t border-slate-800">
          <span className="w-4 h-1 bg-gradient-to-r from-amber-400 to-rose-500 inline-block rounded"></span>
          <span>Senda del Carnaval</span>
        </div>
      </div>

      <MapContainer
        center={PASTO_CENTER}
        zoom={14}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <MapClickHandler onMapClick={onSelectCoordinates} />

        {/* Capa de mosaicos OSCURA (CartoDB Dark Matter) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Trazo oficial de la Senda del Carnaval */}
        <Polyline
          positions={SENDA_DEL_CARNAVAL_COORDS}
          pathOptions={{
            color: '#f43f5e',
            weight: 5,
            opacity: 0.85,
            dashArray: '8, 6',
          }}
        >
          <Popup>
            <div className="text-sm font-sans">
              <strong className="text-rose-400 text-base block font-bold">
                🎭 Senda del Carnaval
              </strong>
              <p className="text-xs text-slate-300 mt-1">
                Eje oficial de desfiles, murgas y carrozas monumentales de Pasto (aprox. 7 km).
              </p>
            </div>
          </Popup>
        </Polyline>

        {/* Círculos de Zonas de Riesgo y Congestión */}
        {zones.map((zone) => {
          let circleColor = '#10b981';
          let fillColor = '#10b981';
          if (zone.risk_level?.toLowerCase() === 'alto') {
            circleColor = '#ef4444';
            fillColor = '#ef4444';
          } else if (zone.risk_level?.toLowerCase() === 'medio') {
            circleColor = '#f59e0b';
            fillColor = '#f59e0b';
          }

          return (
            <Circle
              key={`zone-${zone.id}`}
              center={[zone.latitude, zone.longitude]}
              radius={zone.radius_meters || 350}
              pathOptions={{
                color: circleColor,
                fillColor: fillColor,
                fillOpacity: 0.18,
                weight: 2,
              }}
            >
              <Popup>
                <div className="p-1 min-w-[210px] text-slate-100">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-700/60 pb-1.5 mb-1.5">
                    <h3 className="font-bold text-sm text-white">{zone.zone_name}</h3>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        zone.risk_level === 'Alto'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : zone.risk_level === 'Medio'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      Riesgo {zone.risk_level}
                    </span>
                  </div>
                  <div className="text-xs space-y-1 text-slate-300">
                    <p className="flex justify-between">
                      <span className="text-slate-400">Reportes activos:</span>
                      <strong className="text-slate-100 font-bold">{zone.active_reports_count}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-400">Radio de vigilancia:</span>
                      <span className="text-slate-300">{zone.radius_meters}m</span>
                    </p>
                  </div>
                </div>
              </Popup>
            </Circle>
          );
        })}

        {/* Marcadores de Puntos de Interés (Salud, Policía, Tarimas, etc.) */}
        {pois.map((poi) => (
          <Marker
            key={`poi-${poi.id}`}
            position={[poi.latitude, poi.longitude]}
            icon={getPoiIcon(poi.category)}
          >
            <Popup>
              <div className="p-1 text-slate-100">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-rose-400 bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-800/40">
                  {poi.category}
                </span>
                <h4 className="font-bold text-sm text-white mt-1">{poi.name}</h4>
                {poi.description && (
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {poi.description}
                  </p>
                )}
                <div className="mt-2 pt-1 border-t border-slate-800 text-[11px] text-slate-400">
                  Coords: {poi.latitude.toFixed(4)}, {poi.longitude.toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Marcadores de Reportes Ciudadanos */}
        {reports.map((report) => (
          <Marker
            key={`report-${report.id}`}
            position={[report.latitude, report.longitude]}
            icon={getReportIcon(report.ai_risk_level)}
          >
            <Popup>
              <div className="p-1 min-w-[220px] text-slate-100">
                <div className="flex items-center justify-between gap-2 border-b border-slate-700/60 pb-1.5 mb-1.5">
                  <span className="text-[10px] uppercase font-semibold text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">
                    {report.category}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      report.ai_risk_level === 'Alto'
                        ? 'bg-rose-500/20 text-rose-300'
                        : report.ai_risk_level === 'Medio'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    Riesgo {report.ai_risk_level || 'Bajo'}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-white">{report.title}</h4>
                {report.description && (
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {report.description}
                  </p>
                )}
                <div className="mt-2 pt-1 border-t border-slate-800 flex justify-between text-[11px] text-slate-400">
                  <span>Estado: {report.status}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Marcador temporal de la ubicación seleccionada para nuevo reporte */}
        {selectedLocation && (
          <Marker
            position={[selectedLocation.lat, selectedLocation.lng]}
            icon={createCustomIcon('#f59e0b', '📍', true)}
          >
            <Popup>
              <div className="text-xs p-1 text-slate-100">
                <strong className="text-amber-400 block font-bold">Ubicación Seleccionada</strong>
                <p className="text-slate-300 mt-1">Listo para crear reporte en estas coordenadas.</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

export default MapView;
