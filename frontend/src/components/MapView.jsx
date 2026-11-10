import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Resuelve el error clásico de Leaflet con Vite donde las rutas de los iconos por defecto se rompen
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});
import { CARNIVAL_ROUTES } from '../data/carnivalRoutes';
import { SENDA_OFICIAL_COORDS, HITOS_SENDA } from '../data/sendaCoords';
import {
  TRACK_SENDA_MAGNA,
  TRACK_CANTO_A_LA_TIERRA,
  TRACK_ARCOIRIS_ASFALTO,
} from '../data/carnavalOfficialTracks';
import { CarnavalDaySelector, DayCameraController } from './map/CarnavalDaySelector';
import { createSvgLandmarkPin } from './map/MapComponent';
import { fetchActiveReports } from '../services/reportService';
import { getStreetRoute } from '../services/routingService';
import { PASTO_POIS } from '../data/pastoPOIs';
import {
  RESTAURANTS_DATA,
  getRestaurantStatus,
  calculateDistanceKm,
  formatDistance,
} from '../data/restaurantsData';
import {
  MapPin,
  Clock,
  Locate,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  Navigation,
  X,
} from 'lucide-react';

// Coordenadas centrales de San Juan de Pasto (Centro Histórico de Pasto / Plaza de Nariño)
const PASTO_CENTER = [1.2140, -77.2820];

// Trazado vial milimétrico y continuo de la Senda del Carnaval de Pasto
export const SENDA_CARNAVAL_COORDS = SENDA_OFICIAL_COORDS;
export const SENDA_DEL_CARNAVAL_COORDS = SENDA_OFICIAL_COORDS;

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
        background: linear-gradient(135deg, #a8a29e 0%, #78716c 100%);
        padding: 5px 10px;
        border-radius: 9999px;
        display: flex;
        align-items: center;
        gap: 5px;
        border: 2px solid #ffffff;
        box-shadow: 0 4px 16px rgba(168, 162, 158, 0.7), 0 2px 8px rgba(0,0,0,0.5);
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
        background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
        padding: 5px 10px;
        border-radius: 9999px;
        display: flex;
        align-items: center;
        gap: 5px;
        border: 2px solid #ffffff;
        box-shadow: 0 4px 16px rgba(220, 38, 38, 0.7), 0 2px 8px rgba(0,0,0,0.5);
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
        background: linear-gradient(135deg, #be123c 0%, #7f1d1d 100%);
        width: 38px;
        height: 38px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid rgba(255, 255, 255, 0.95);
        box-shadow: 0 8px 24px -2px rgba(0, 0, 0, 0.65), 0 0 16px rgba(190, 18, 60, 0.65);
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
          background: ${isOpen ? '#a8a29e' : '#dc2626'};
          border: 1.5px solid #ffffff;
          box-shadow: 0 0 6px ${isOpen ? '#a8a29e' : '#dc2626'};
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
      return createCustomIcon('linear-gradient(135deg, #dc2626 0%, #991b1b 100%)', '🏥', false, 'rgba(220, 38, 38, 0.6)');
    case 'policia':
    case 'cai':
      return createCustomIcon('linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', '👮', false, 'rgba(59, 130, 246, 0.6)');
    case 'tarima':
      return createCustomIcon('linear-gradient(135deg, #f87171 0%, #dc2626 100%)', '🎭', false, 'rgba(220, 38, 38, 0.6)');
    case 'banio':
    case 'bano':
      return createCustomIcon('linear-gradient(135deg, #a8a29e 0%, #78716c 100%)', '🚻', false, 'rgba(168, 162, 158, 0.6)');
    case 'restaurante':
    case 'restaurantes':
      return createCustomIcon('linear-gradient(135deg, #be123c 0%, #7f1d1d 100%)', '🍽️', false, 'rgba(190, 18, 60, 0.6)');
    case 'salida':
      return createCustomIcon('linear-gradient(135deg, #a8a29e 0%, #78716c 100%)', '🚪', false, 'rgba(168, 162, 158, 0.6)');
    default:
      return createCustomIcon('linear-gradient(135deg, #94a3b8 0%, #475569 100%)', '📍', false, 'rgba(148, 163, 184, 0.5)');
  }
};

// Generador de iconos para Reportes Ciudadanos según nivel de riesgo
const getReportIcon = (riskLevel) => {
  switch (riskLevel?.toLowerCase()) {
    case 'alto':
      return createCustomIcon('linear-gradient(135deg, #dc2626 0%, #991b1b 100%)', '⚠️', true, 'rgba(220, 38, 38, 0.7)');
    case 'medio':
      return createCustomIcon('linear-gradient(135deg, #f87171 0%, #dc2626 100%)', '⚡', true, 'rgba(220, 38, 38, 0.7)');
    case 'bajo':
    default:
      return createCustomIcon('linear-gradient(135deg, #a8a29e 0%, #78716c 100%)', 'ℹ️', false, 'rgba(168, 162, 158, 0.5)');
  }
};

// Helper de colores para zonas de riesgo/congestión
const getZoneColors = (riskLevel, congestionPercentage) => {
  const normRisk = riskLevel?.toLowerCase();
  const cong = Number(congestionPercentage) || 0;

  if (normRisk === 'alto' || cong >= 70) {
    return {
      border: '#dc2626',
      fill: '#dc2626',
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      label: 'Alta Congestión / Riesgo Alto',
      fillOpacity: 0.28,
    };
  }
  if (normRisk === 'medio' || cong >= 40) {
    return {
      border: '#dc2626',
      fill: '#dc2626',
      badge: 'bg-coral-500/20 text-coral-300 border-coral-500/40',
      label: 'Aglomeración Media',
      fillOpacity: 0.22,
    };
  }
  return {
    border: '#a8a29e',
    fill: '#a8a29e',
    badge: 'bg-aqua-500/20 text-aqua-300 border-aqua-500/40',
    label: 'Tráfico Fluido',
    fillOpacity: 0.16,
  };
};

// Trazado de la Senda según el día del Carnaval (ordenado desde el punto de salida hacia la llegada)
function getSendaTrackForDay(dayId) {
  switch (dayId) {
    case '28-dic':
      return TRACK_ARCOIRIS_ASFALTO;
    case '03-ene':
      return TRACK_CANTO_A_LA_TIERRA; // Recorrido inverso: Fuente de la Transparencia -> Normal Superior
    case '07-ene': {
      const route = CARNIVAL_ROUTES['07-ene']?.route;
      return route && route.length >= 2 ? route : TRACK_SENDA_MAGNA;
    }
    default:
      return TRACK_SENDA_MAGNA; // Normal Superior -> Fuente de la Transparencia
  }
}

// Rumbo en grados (0 = norte, sentido horario) entre dos puntos [lat, lng]
function computeBearingDeg(from, to) {
  const dLat = to[0] - from[0];
  const dLng = (to[1] - from[1]) * Math.cos((from[0] * Math.PI) / 180);
  return (Math.atan2(dLng, dLat) * 180) / Math.PI;
}

// Flecha SVG rotada que indica el sentido del desfile
function createDirectionArrowIcon(bearingDeg, color) {
  return L.divIcon({
    className: 'senda-direction-arrow',
    html: `<div style="width:22px;height:22px;transform:rotate(${bearingDeg}deg);display:flex;align-items:center;justify-content:center;">
      <svg width="22" height="22" viewBox="0 0 24 24" style="filter:drop-shadow(0 1px 2px rgba(0,0,0,0.8));">
        <path d="M12 3 L20 19 L12 15 L4 19 Z" fill="#ffffff" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>
      </svg>
    </div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

// Capa de la Senda: línea con borde + flechas de sentido a lo largo del recorrido
function SendaRouteLayer({ track, color }) {
  const arrows = useMemo(() => {
    if (!Array.isArray(track) || track.length < 2) return [];
    // Una flecha cada ARROW_SPACING_KM a lo largo del recorrido, orientada según el tramo donde cae
    const ARROW_SPACING_KM = 0.15;
    const result = [];
    let nextAt = ARROW_SPACING_KM / 2;
    let travelled = 0;
    for (let i = 0; i < track.length - 1; i++) {
      const a = track[i];
      const b = track[i + 1];
      const segKm = calculateDistanceKm(a[0], a[1], b[0], b[1]);
      while (segKm > 0 && travelled + segKm >= nextAt) {
        const f = (nextAt - travelled) / segKm;
        result.push({
          key: `senda-arrow-${result.length}`,
          position: [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f],
          bearing: computeBearingDeg(a, b),
        });
        nextAt += ARROW_SPACING_KM;
      }
      travelled += segKm;
    }
    return result;
  }, [track]);

  if (!Array.isArray(track) || track.length < 2) return null;

  return (
    <>
      <Polyline
        positions={track}
        pathOptions={{ color: '#000000', weight: 11, opacity: 0.55, lineCap: 'round', lineJoin: 'round' }}
        interactive={false}
      />
      <Polyline
        positions={track}
        pathOptions={{ color, weight: 7, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }}
      />
      {arrows.map((arrow) => (
        <Marker
          key={arrow.key}
          position={arrow.position}
          icon={createDirectionArrowIcon(arrow.bearing, color)}
          interactive={false}
          keyboard={false}
        />
      ))}
    </>
  );
}

// Controlador para enfocar y animar la vista de la Senda del Carnaval
function SendaController({ onSendaFocus, focusTrigger, track }) {
  const map = useMap();

  const handleFocus = useCallback(() => {
    if (!map) return;
    try {
      const bounds = L.latLngBounds(track && track.length >= 2 ? track : SENDA_CARNAVAL_COORDS);
      map.fitBounds(bounds, { padding: [40, 40], animate: true });
    } catch (err) {
      console.warn('Error al enfocar la Senda:', err);
    }
  }, [map, track]);

  useEffect(() => {
    if (focusTrigger > 0) {
      handleFocus();
    }
  }, [focusTrigger, handleFocus]);

  useEffect(() => {
    const handleEvent = () => {
      if (onSendaFocus) onSendaFocus();
      handleFocus();
    };
    window.addEventListener('focus-senda', handleEvent);
    return () => window.removeEventListener('focus-senda', handleEvent);
  }, [handleFocus, onSendaFocus]);

  return null;
}

// Controlador para enfocar eventos y puntos de interés clave solicitados desde GuaneñaBot
function LandmarkController({ onActivateCategory, onActivateSenda, showSenda }) {
  const map = useMap();

  useEffect(() => {
    const handleFocusLandmark = (e) => {
      const detail = e.detail;
      if (!detail || !detail.coords || !map) return;

      const [lat, lng] = detail.coords;
      const zoom = detail.zoom || 17;

      try {
        if (typeof map.flyTo === 'function') {
          map.flyTo([lat, lng], zoom, {
            animate: true,
            duration: 1.5,
          });
        } else if (typeof map.setView === 'function') {
          map.setView([lat, lng], zoom);
        }
      } catch (err) {
        console.warn('Error al enfocar hito:', err);
      }

      if (detail.category && onActivateCategory) {
        const cat = detail.category.toLowerCase();
        if (cat === 'salud') {
          onActivateCategory('salud');
        } else if (cat === 'bano' || cat === 'banio') {
          onActivateCategory('banio');
        } else if (cat === 'cai' || cat === 'policia') {
          onActivateCategory('policia');
        } else if (cat === 'restaurante' || cat === 'restaurantes') {
          onActivateCategory('restaurantes');
        } else if (cat === 'plaza' || cat === 'evento') {
          onActivateCategory('todos');
        }
      }

      if (detail.showSenda && onActivateSenda && !showSenda) {
        onActivateSenda();
      }
    };

    const handleCategoryFilter = (e) => {
      const cat = (e.detail?.category || e.detail)?.toLowerCase();
      if (cat && onActivateCategory) {
        if (cat === 'bano' || cat === 'banio') onActivateCategory('banio');
        else if (cat === 'cai' || cat === 'policia') onActivateCategory('policia');
        else if (cat === 'restaurante' || cat === 'restaurantes') onActivateCategory('restaurantes');
        else onActivateCategory(cat);
      }
    };

    // Manejador central de acciones e intenciones conversacionales despachadas por GuaneñaBot
    const handleGuanenaAction = (e) => {
      const detail = e.detail || {};
      const actionType = detail.type || e.type;

      if (actionType === 'FOCUS_CATEGORY') {
        const cat = (detail.category || '').toLowerCase();
        if (onActivateCategory) {
          if (cat === 'bano' || cat === 'banio') onActivateCategory('banio');
          else if (cat === 'cai' || cat === 'policia') onActivateCategory('policia');
          else if (cat === 'restaurante' || cat === 'restaurantes') onActivateCategory('restaurantes');
          else onActivateCategory(cat || 'todos');
        }
        // Centrar y mover la cámara suavemente con flyTo al primer POI de esa categoría
        const targetPoi = PASTO_POIS.find((p) => p.category === cat || (cat === 'banio' && p.category === 'bano'));
        if (targetPoi && map && typeof map.flyTo === 'function') {
          map.flyTo(targetPoi.coords, 16, { animate: true, duration: 1.5 });
        }
      } else if (actionType === 'SHOW_SENDA') {
        if (onActivateSenda && !showSenda) onActivateSenda();
        if (map && typeof map.flyTo === 'function') {
          map.flyTo([1.2140, -77.2820], 15, { animate: true, duration: 1.5 });
        }
      } else if (actionType === 'NAVIGATE_TO') {
        const target = detail.targetCoords || detail.coords;
        if (target && map && typeof map.flyTo === 'function') {
          map.flyTo(target, 17, { animate: true, duration: 1.5 });
        }
      }
    };

    window.addEventListener('focus-landmark', handleFocusLandmark);
    window.addEventListener('highlight-poi', handleFocusLandmark);
    window.addEventListener('show-poi-category', handleCategoryFilter);
    window.addEventListener('FOCUS_CATEGORY', handleGuanenaAction);
    window.addEventListener('SHOW_SENDA', handleGuanenaAction);
    window.addEventListener('NAVIGATE_TO', handleGuanenaAction);
    window.addEventListener('guanena-action', handleGuanenaAction);
    return () => {
      window.removeEventListener('focus-landmark', handleFocusLandmark);
      window.removeEventListener('highlight-poi', handleFocusLandmark);
      window.removeEventListener('show-poi-category', handleCategoryFilter);
      window.removeEventListener('FOCUS_CATEGORY', handleGuanenaAction);
      window.removeEventListener('SHOW_SENDA', handleGuanenaAction);
      window.removeEventListener('NAVIGATE_TO', handleGuanenaAction);
      window.removeEventListener('guanena-action', handleGuanenaAction);
    };
  }, [map, onActivateCategory, onActivateSenda, showSenda]);

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
        className={`p-3 rounded-xl bg-white shadow-lg hover:shadow-xl border border-slate-200 transition-all duration-200 active:scale-95 flex items-center justify-center group ${isLocating
            ? 'text-blue-600 ring-2 ring-blue-500/40'
            : hasUserGps
              ? 'text-blue-600'
              : 'text-slate-700 hover:text-blue-600'
          }`}
        title="Centrar en mi ubicación actual (GPS en tiempo real)"
        aria-label="Mi Ubicación"
      >
        <Locate
          className={`w-5 h-5 ${isLocating ? 'animate-spin text-blue-500' : 'group-hover:scale-110 transition-transform'
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

// Sectores protagonistas de cada día del Carnaval para centrado suave con IA
const DAY_FOCAL_POINTS = {
  '28-dic': { center: [1.2125, -77.2795], zoom: 16, sector: 'El Colorado / Centro Histórico' },
  '31-dic': { center: [1.2136, -77.2780], zoom: 15, sector: 'Senda Cra 27 - Años Viejos' },
  '02-ene': { center: [1.2115, -77.2785], zoom: 15, sector: 'Normal Superior a Cra 27 - Carnavalito' },
  '03-ene': { center: [1.2145, -77.2782], zoom: 15, sector: 'Senda Cra 27 - Canto a la Tierra' },
  '04-ene': { center: [1.2145, -77.2780], zoom: 16, sector: 'Plaza de Nariño / Centro Histórico Peatonal - Flia Castañeda' },
  '05-ene': { center: [1.2115, -77.2765], zoom: 16, sector: 'Plaza del Carnaval y Plaza de Nariño - Día de Negros' },
  '06-ene': { center: [1.2140, -77.2870], zoom: 15, sector: 'Avenida Mijitayo / Panamericana - Desfile Magno' },
  '07-ene': { center: [1.1850, -77.2950], zoom: 14, sector: 'Corregimiento de Obonuco - Festival del Cuy' },
};

// Controlador para centrar y animar suavemente la vista del mapa según el evento/día seleccionado
function MapRouteController({ currentEvent, currentCarnivalDay }) {
  const map = useMap();
  const prevEventRef = useRef(null);

  useEffect(() => {
    if (!currentEvent || !map) return;
    const currentKey = `${currentCarnivalDay || ''}-${currentEvent.name}`;
    if (prevEventRef.current === currentKey) return;
    prevEventRef.current = currentKey;

    const applyView = () => {
      try {
        const focal = currentCarnivalDay ? DAY_FOCAL_POINTS[currentCarnivalDay] : null;
        if (focal) {
          map.flyTo(focal.center, focal.zoom, {
            duration: 1.5,
            easeLinearity: 0.25,
          });
        } else if (currentEvent.route && currentEvent.route.length > 1) {
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
  }, [currentEvent, currentCarnivalDay, map]);

  return null;
}

// Función asíncrona de enrutamiento peatonal real por calles usando el servicio centralizado de OSRM
export async function fetchRealRoute(startCoords, targetCoords) {
  try {
    return await getStreetRoute(startCoords, targetCoords);
  } catch (error) {
    console.warn('Fallo al consultar ruta peatonal con OSRM:', error);
    return [startCoords, targetCoords];
  }
}

// Controlador para ajustar automáticamente la vista al trazar una ruta de navegación real por calles
function NavRouteController({ routePath }) {
  const map = useMap();
  const prevRouteKeyRef = useRef(null);

  useEffect(() => {
    if (!routePath || routePath.length === 0 || !map) return;

    const routeKey = `${routePath.length}-${routePath[0][0]},${routePath[0][1]}-${routePath[routePath.length - 1][0]},${routePath[routePath.length - 1][1]}`;
    if (prevRouteKeyRef.current === routeKey) return;
    prevRouteKeyRef.current = routeKey;

    const adjust = () => {
      try {
        if (routePath.length >= 2) {
          const destination = routePath[routePath.length - 1];
          if (map?.flyTo && destination) {
            map.flyTo(destination, 17, { animate: true, duration: 1.2 });
          } else {
            map.fitBounds(routePath, { padding: [50, 50] });
          }
        }
        if (map?.invalidateSize) {
          setTimeout(() => map.invalidateSize(), 300);
        }
      } catch (err) {
        console.warn("Error en centrado de navegación:", err);
      }
    };

    if (map._loaded) {
      adjust();
    } else {
      map.whenReady(adjust);
    }
  }, [routePath, map]);

  return null;
}

// Controlador para centrar suavemente en el usuario al disparar evento global CENTER_MAP_ON_USER
function MapCenterOnUserListener() {
  const map = useMap();
  useEffect(() => {
    const handleCenter = (e) => {
      const { lat, lng, zoom } = e.detail || {};
      if (lat !== undefined && lng !== undefined && map) {
        map.flyTo([lat, lng], zoom || 17, { duration: 1.5, animate: true });
      }
    };
    window.addEventListener('CENTER_MAP_ON_USER', handleCenter);
    return () => window.removeEventListener('CENTER_MAP_ON_USER', handleCenter);
  }, [map]);

  return null;
}

export function MapView({
  pois = [],
  reports = [],
  zones = [],
  onSelectCoordinates,
  isSelectingLocation = false,
  selectedLocation,
  selectedDay: propSelectedDay,
  currentCarnivalDay: propCurrentCarnivalDay,
  onSelectDay: propOnSelectDay,
  onUserLocationChange,
  navRoute = null,
  setNavRoute,
  showSenda: propShowSenda,
  onToggleSenda: propOnToggleSenda,
  focusSendaTrigger = 0,
  hideTopBar = false,
}) {
  // 1. Estado de geolocalización GPS del usuario (declarado al inicio absoluto para evitar ReferenceError)
  const [userGps, setUserGps] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const originPoint = userGps ? [userGps.lat || userGps[0], userGps.lng || userGps[1]] : [1.2138, -77.2818]; // Fallback al Parque Nariño si no hay GPS activo

  // Estado local para activar o desactivar la capa de la Senda del Carnaval (inicia estrictamente en false)
  const [internalShowSenda, setInternalShowSenda] = useState(false);
  const [sendaFocusCounter, setSendaFocusCounter] = useState(0);
  // Si el padre controla la Senda (prop showSenda), se respeta directamente
  const showSenda = Boolean(propShowSenda !== undefined ? propShowSenda : internalShowSenda);
  const toggleSenda = () => {
    if (propOnToggleSenda) {
      propOnToggleSenda();
    } else {
      setInternalShowSenda((prev) => !prev);
    }
    setSendaFocusCounter((c) => c + 1);
  };

  // Sincronización y carga de reportes activos desde Supabase / caché local
  const [internalReports, setInternalReports] = useState(reports || []);
  useEffect(() => {
    if (reports && reports.length > 0) {
      setInternalReports(reports);
    } else {
      fetchActiveReports()
        .then((active) => {
          if (active && active.length > 0) {
            setInternalReports(active);
          }
        })
        .catch((err) => console.warn('Error al recuperar reportes activos:', err));
    }
  }, [reports]);

  // Estado local para almacenar la ruta calculada por OSRM
  const [routePath, setRoutePath] = useState(null);
  const [isRouting, setIsRouting] = useState(false);

  // Efecto que escucha los eventos de GuaneñaBot (Gemini 2.5 Flash)
  useEffect(() => {
    const handleDrawGeminiRoute = (e) => {
      const { waypoints, title, schedule, nearby_places } = e.detail || {};
      if (waypoints && waypoints.length >= 2) {
        setRoutePath(waypoints);
        if (setNavRoute) {
          setNavRoute({
            startCoords: waypoints[0],
            targetCoords: waypoints[waypoints.length - 1],
            targetName: title || 'Ruta recomendada por GuaneñaBot',
            isGeminiRoute: true,
            waypoints: waypoints,
            schedule: schedule || null,
            nearbyPlaces: nearby_places || [],
          });
        }
      }
    };
    window.addEventListener('DRAW_GEMINI_ROUTE', handleDrawGeminiRoute);
    return () => window.removeEventListener('DRAW_GEMINI_ROUTE', handleDrawGeminiRoute);
  }, [setNavRoute]);

  // Efecto que escucha los cambios de navRoute: invoca fetchRealRoute o limpia routePath
  useEffect(() => {
    if (navRoute && navRoute.targetCoords) {
      if (navRoute.isGeminiRoute && navRoute.waypoints && navRoute.waypoints.length >= 2) {
        setRoutePath(navRoute.waypoints);
        setIsRouting(false);
        return;
      }

      const start = navRoute.startCoords || (userGps ? [userGps.lat, userGps.lng] : PASTO_CENTER);
      let isMounted = true;
      setIsRouting(true);

      fetchRealRoute(start, navRoute.targetCoords)
        .then((coords) => {
          if (isMounted) {
            setRoutePath(coords);
          }
        })
        .catch((err) => {
          console.warn('Error al calcular ruta real:', err);
          if (isMounted) {
            setRoutePath([start, navRoute.targetCoords]);
          }
        })
        .finally(() => {
          if (isMounted) {
            setIsRouting(false);
          }
        });

      return () => {
        isMounted = false;
      };
    } else {
      setRoutePath(null);
      setIsRouting(false);
    }
  }, [navRoute, userGps]);

  // Distancia estimada para mostrar en la tarjeta de navegación
  const displayDistance = useMemo(() => {
    if (routePath && routePath.length > 1) {
      let totalKm = 0;
      for (let i = 0; i < routePath.length - 1; i++) {
        totalKm += calculateDistanceKm(
          routePath[i][0],
          routePath[i][1],
          routePath[i + 1][0],
          routePath[i + 1][1]
        );
      }
      return formatDistance(totalKm);
    }
    if (navRoute?.startCoords && navRoute?.targetCoords) {
      const km = calculateDistanceKm(
        navRoute.startCoords[0],
        navRoute.startCoords[1],
        navRoute.targetCoords[0],
        navRoute.targetCoords[1]
      );
      return formatDistance(km);
    }
    return null;
  }, [routePath, navRoute]);

  // Día seleccionado del Carnaval (controlado dinámicamente por la IA desde App.jsx)
  const [internalDay, setInternalDay] = useState('06-ene');
  const selectedDay = propCurrentCarnivalDay || propSelectedDay || internalDay;
  const _setSelectedDay = (day) => {
    setInternalDay(day);
    if (propOnSelectDay) {
      propOnSelectDay(day);
    }
  };

  const [isCardMinimized, setIsCardMinimized] = useState(false);

  // Estado del evento seleccionado condicional (inicia estrictamente en null para mantener el mapa 100% limpio en arranque)
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    if (showSenda && selectedDay) {
      setSelectedEvent(CARNIVAL_ROUTES[selectedDay] || null);
    } else {
      setSelectedEvent(null);
    }
  }, [selectedDay, showSenda]);

  const currentEvent = selectedEvent;

  // Color dinámico de la Senda según la fecha oficial seleccionada
  const dayRouteColor = useMemo(() => {
    switch (selectedDay) {
      case '03-ene':
        return '#dc2626'; // Carmín (3 de Enero - Canto a la Tierra)
      case '04-ene':
        return '#dc2626'; // Carmín profundo (4 de Enero - Familia Castañeda)
      case '05-ene':
        return '#a8a29e'; // Platino (5 de Enero - Día de Negros)
      case '06-ene':
      default:
        return '#dc2626'; // Carmín (6 de Enero - Desfile Magno)
    }
  }, [selectedDay]);

  // Trazado de la Senda para el día seleccionado
  const sendaTrack = useMemo(() => getSendaTrackForDay(selectedDay), [selectedDay]);

  // Filtro activo de visualización rápida (inicia en null para no renderizar POIs por defecto)
  const [activeFilter, setActiveFilter] = useState(null);

  // Opciones de filtro
  const filterOptions = [
    { id: 'todos', label: 'Todos', icon: '✨' },
    { id: 'restaurantes', label: 'Restaurantes', icon: '🍽️' },
    { id: 'salud', label: 'Salud', icon: '🏥' },
    { id: 'policia', label: 'Seguridad / CAI', icon: '👮' },
    { id: 'banio', label: 'Baños', icon: '🚻' },
    { id: 'tarima', label: 'Tarimas', icon: '🎭' },
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

  // Consolidación de POIs del backend con el catálogo georreferenciado de Pasto (baños, CAIs, salud, restaurantes)
  const allPOIs = useMemo(() => {
    const pastoMapped = PASTO_POIS.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      latitude: p.coords[0],
      longitude: p.coords[1],
      address: p.address,
      description: p.description,
      schedule: p.schedule,
      phone: p.phone,
      isPastoCatalog: true,
    }));

    if (!pois || pois.length === 0) {
      return pastoMapped;
    }

    const existingIds = new Set(pois.map((p) => p.id));
    const nonDuplicates = pastoMapped.filter((p) => !existingIds.has(p.id));
    return [...pois, ...nonDuplicates];
  }, [pois]);

  // Filtrado reactivo de POIs según el botón seleccionado
  const filteredPois = useMemo(() => {
    if (!activeFilter || activeFilter === 'none' || activeFilter === null) return [];
    if (activeFilter === 'todos' || activeFilter === 'all') return allPOIs;
    if (activeFilter === 'restaurantes' || activeFilter === 'restaurante') {
      return allPOIs.filter((p) => p.category?.toLowerCase() === 'restaurante' || p.category?.toLowerCase() === 'restaurantes');
    }
    if (activeFilter === 'salud') {
      return allPOIs.filter((p) => p.category?.toLowerCase() === 'salud');
    }
    if (activeFilter === 'policia' || activeFilter === 'cai') {
      return allPOIs.filter((p) => ['policia', 'cai', 'seguridad'].includes(p.category?.toLowerCase()));
    }
    if (activeFilter === 'banio' || activeFilter === 'bano') {
      return allPOIs.filter((p) => ['banio', 'bano', 'sanitario'].includes(p.category?.toLowerCase()));
    }
    if (activeFilter === 'tarima') {
      return allPOIs.filter((p) => p.category?.toLowerCase() === 'tarima');
    }
    if (activeFilter === 'zonas') return [];
    return allPOIs.filter((p) =>
      activeFilter && p.category
        ? p.category.toLowerCase() === activeFilter.toLowerCase()
        : false
    );
  }, [allPOIs, activeFilter]);

  // Filtrado de reportes activos
  const filteredReports = useMemo(() => {
    if (!activeFilter || activeFilter === 'none' || activeFilter === null) return [];
    const list = internalReports && internalReports.length > 0 ? internalReports : reports;
    if (activeFilter === 'todos' || activeFilter === 'all' || activeFilter === 'zonas') return list;
    return list.filter((r) =>
      (r.category && activeFilter && r.category.toLowerCase() === activeFilter.toLowerCase()) ||
      (r.type && activeFilter && r.type.toLowerCase() === activeFilter.toLowerCase())
    );
  }, [reports, internalReports, activeFilter]);

  // Determinar si se muestran las zonas
  const showZones = activeFilter === 'todos' || activeFilter === 'zonas';

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden bg-[#08080a]">
      {/* 1. Contenedor Superior Fijo: Banner de Evento Activo y Chips de Filtros Tipo Píldora */}
      {!hideTopBar && (
        <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col gap-2 pointer-events-none">
          {/* Banner Superior Dinámico de Evento Oficial controlado por GuaneñaBot */}
          <div className="pointer-events-auto flex items-center justify-between gap-3 px-3.5 py-1.5 rounded-full bg-[#101012]/80 backdrop-blur-2xl border border-rose-500/20 shadow-[0_0_25px_rgba(220,38,38,0.25)] text-xs max-w-lg">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${currentEvent ? 'bg-coral-500' : 'bg-slate-500'}`}
                style={currentEvent?.color ? { backgroundColor: currentEvent.color } : {}}
              />
              <div className="truncate text-slate-300">
                <span className="hidden sm:inline text-slate-400">Evento Activo: </span>
                <strong className="font-bold text-white">
                  {currentEvent ? currentEvent.name : 'Ninguno'}
                </strong>
              </div>
            </div>
            <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-rose-300">
              🎭 GuaneñaBot AI
            </span>
          </div>

          {/* Chips de Categorías (Filtros del Mapa) tipo Píldora (Pill Badges) */}
          <div className="pointer-events-auto flex items-center gap-2 max-w-full overflow-x-auto no-scrollbar py-0.5">
            {/* Botón directo de activación / desactivación de la Senda del Carnaval */}
            <button
              type="button"
              onClick={toggleSenda}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap active:scale-95 cursor-pointer backdrop-blur-md ${showSenda
                  ? 'bg-gradient-to-r from-coral-600 to-rose-500 text-white shadow-md ring-2 ring-coral-400/50 glow-coral'
                  : 'bg-slate-900/50 border border-white/10 text-slate-200 hover:text-white hover:border-rose-400/50'
                }`}
              title={showSenda ? 'Ocultar Senda del Carnaval' : 'Mostrar Senda del Carnaval'}
            >
              <span className="text-sm">🎭</span>
              <span>Senda del Carnaval</span>
              <span
                className={`w-2 h-2 rounded-full transition-all ${showSenda ? 'bg-white shadow-sm' : 'bg-slate-400'
                  }`}
              />
            </button>

            {filterOptions.map((f) => {
              const isActive = activeFilter === f.id;
              const activeChip = {
                todos: 'bg-gradient-to-r from-coral-600 to-rose-500 text-white border-coral-400 shadow-[0_0_20px_rgba(220,38,38,0.55)]',
                restaurantes: 'bg-gradient-to-r from-rose-600 to-rose-800 text-white border-rose-400 shadow-[0_0_15px_rgba(190,18,60,0.45)]',
                salud: 'bg-gradient-to-r from-aqua-500 to-aqua-700 text-white border-aqua-400 shadow-[0_0_15px_rgba(168,162,158,0.4)]',
                policia: 'bg-gradient-to-r from-aqua-500 to-aqua-600 text-white border-aqua-400 shadow-[0_0_15px_rgba(168,162,158,0.4)]',
                banio: 'bg-gradient-to-r from-aqua-500 to-aqua-700 text-white border-aqua-400 shadow-[0_0_15px_rgba(168,162,158,0.4)]',
                tarima: 'bg-gradient-to-r from-coral-600 to-rose-500 text-white border-coral-400 shadow-[0_0_15px_rgba(220,38,38,0.4)]',
                zonas: 'bg-gradient-to-r from-rose-600 to-coral-500 text-white border-rose-400 shadow-[0_0_15px_rgba(190,18,60,0.45)]',
              }[f.id];
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveFilter(f.id)}
                  className={`rounded-full px-3.5 py-1.5 text-xs transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap active:scale-95 cursor-pointer backdrop-blur-md border ${
                    isActive
                      ? `font-bold ${activeChip}`
                      : 'bg-[#181819]/60 border-white/15 text-slate-200 font-medium hover:border-rose-400/50 hover:text-white'
                  }`}
                >
                  <span className="text-sm">{f.icon}</span>
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Tarjeta Flotante Compacta de "Evento Oficial" con Bordes rounded-3xl - Renderizado condicional */}
      {showSenda && selectedEvent && currentEvent && (
        <div className="absolute bottom-5 left-4 z-[1000] pointer-events-auto">
          {isCardMinimized ? (
            /* Estado Colapsado: Píldora ultra-compacta para ver el mapa completamente despejado */
            <button
              type="button"
              onClick={() => setIsCardMinimized(false)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl backdrop-blur-2xl bg-[#101012]/85 border border-rose-500/25 shadow-2xl hover:shadow-md text-xs font-bold text-slate-100 hover:scale-[1.02] transition cursor-pointer"
              title="Expandir información del evento"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: currentEvent.color }}
              />
              <span className="truncate max-w-[170px] sm:max-w-none">{currentEvent.name}</span>
              <span className="text-[10px] text-slate-400 font-mono">({currentEvent.hours})</span>
              <ChevronUp className="w-3.5 h-3.5 text-rose-400 ml-1 shrink-0" />
            </button>
          ) : (
            /* Estado Expandido: Tarjeta limpia y compacta */
            <div className="max-w-xs sm:max-w-sm w-[calc(100vw-2rem)] sm:w-auto backdrop-blur-2xl bg-[#101012]/85 p-4 rounded-3xl border border-coral-400/30 shadow-[0_10px_30px_rgba(0,0,0,0.6)] text-slate-200 transition-all">
              <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2 mb-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: currentEvent.color }}
                    />
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">
                      Evento Oficial
                    </span>
                    <span className="text-[10px] font-mono text-slate-300 bg-white/5 px-1.5 py-0.5 rounded-md border border-white/10">
                      {currentEvent.hours}
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-black text-rose-200 leading-tight truncate">
                    {currentEvent.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCardMinimized(true)}
                  className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-white/10 transition shrink-0 cursor-pointer"
                  title="Colapsar información para despejar el mapa"
                  aria-label="Colapsar información"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <p className="text-slate-200 text-[11px] leading-snug line-clamp-2">
                  {currentEvent.description}
                </p>

                {/* Badges de estado de vías */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/5">
                  {currentEvent.closedPoints && currentEvent.closedPoints.length > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-200 text-[10px] font-bold">
                      <span>⛔</span>
                      <span>{currentEvent.closedPoints.length} Puntos Cierre</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-aqua-500/20 border border-aqua-400/40 text-aqua-200 text-[10px] font-bold">
                      <span>✅</span>
                      <span>Vías Despejadas</span>
                    </span>
                  )}

                  {currentEvent.route && currentEvent.route.length > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-slate-100 text-[10px] font-bold">
                      <span>🎉</span>
                      <span>Ruta Trazada</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-slate-100 text-[10px] font-bold">
                      <span>🚶</span>
                      <span>Zona Peatonal</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2.1 Tarjeta Flotante de Navegación Activa por Calles */}
      {navRoute && (
        <div className="absolute bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-[1100] flex items-center gap-3.5 px-4 py-3 backdrop-blur-2xl bg-[#101012]/85 border border-aqua-400/30 rounded-2xl shadow-[0_0_25px_rgba(168,162,158,0.25)] text-white pointer-events-auto animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-aqua-400 animate-pulse shrink-0" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="text-xs sm:text-sm font-bold whitespace-nowrap">
                🧭 Navegando hacia: <span className="text-aqua-400 font-black">{navRoute.targetName}</span>
              </span>
              {displayDistance && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-xl bg-white/5 text-slate-300 border border-white/10 w-max flex items-center gap-1">
                  <span>🚶 {displayDistance}</span>
                  {isRouting && <span className="text-[10px] text-aqua-400 animate-pulse">(trazando...)</span>}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNavRoute && setNavRoute(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition cursor-pointer ml-1 whitespace-nowrap active:scale-95"
            title="Finalizar navegación asistida"
          >
            <X className="w-3.5 h-3.5" />
            <span>Finalizar</span>
          </button>
        </div>
      )}

      {/* 2.5 Orbes de luz ambiental multicromáticos (Carnaval Vivo) */}
      <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
        <div className="absolute -top-24 -left-24 h-[28rem] w-[28rem] rounded-full bg-coral-600/30 blur-[120px]" />
        <div className="absolute -top-20 -right-24 h-[26rem] w-[26rem] rounded-full bg-rose-500/25 blur-[130px]" />
        <div className="absolute bottom-[-8rem] left-1/3 h-[32rem] w-[32rem] rounded-full bg-aqua-500/20 blur-[140px]" />
      </div>

      {/* 3. Contenedor de Leaflet con Mosaicos de Calles Reales */}
      <MapContainer
        center={[1.2140, -77.2820]}
        zoom={15}
        zoomControl={false}
        scrollWheelZoom={true}
        className="h-[calc(100vh-4rem)] w-full relative z-0"
        style={{ minHeight: '500px', width: '100%' }}
      >
        {/* Controlador para centrar y animar la vista sobre la Senda del Carnaval */}
        <SendaController
          focusTrigger={focusSendaTrigger || sendaFocusCounter}
          track={sendaTrack}
          onSendaFocus={() => {
            if (!showSenda) toggleSenda();
          }}
        />

        {/* Controlador para enfocar eventos y puntos clave solicitados desde GuaneñaBot */}
        <LandmarkController
          onActivateCategory={setActiveFilter}
          onActivateSenda={toggleSenda}
          showSenda={showSenda}
        />

        {/* Inicializador de geolocalización automática al cargar */}
        <MapAutoGeolocation onAutoLocate={(map) => handleLocateUser(map, true)} />

        {/* Controlador para centrar y animar la vista al cambiar de día/evento */}
        <MapRouteController currentEvent={currentEvent} currentCarnivalDay={selectedDay} />

        {/* Controlador que ejecuta fitBounds sobre la Senda oficial al cambiar de fecha */}
        <DayCameraController selectedDay={selectedDay} />

        {/* Controlador para centrar y animar la vista al trazar una ruta de navegación */}
        <NavRouteController routePath={routePath} />

        {/* Controlador para centrar la cámara sobre la ubicación en tiempo real del usuario */}
        <MapCenterOnUserListener />

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
        {/* Marcador de geolocalización blindado estrictamente contra valores nulos o NaN */}
        {(() => {
          if (!userGps) return null;
          const pos = Array.isArray(userGps)
            ? userGps
            : (typeof userGps.lat === 'number' && typeof userGps.lng === 'number' ? [userGps.lat, userGps.lng] : null);
          if (!pos || isNaN(pos[0]) || isNaN(pos[1])) return null;
          return (
            <>
              {/* Halo semitransparente de precisión GPS */}
              <Circle
                center={pos}
                radius={Math.min(userGps.accuracy || 35, 60)}
                pathOptions={{
                  fillColor: '#3b82f6',
                  fillOpacity: 0.15,
                  color: '#2563eb',
                  weight: 1.5,
                  opacity: 0.45,
                }}
              />
              {/* Marcador protegido */}
              <Marker
                position={pos}
                icon={createGoogleMapsGpsIcon()}
              >
                <Popup>Tu ubicación actual</Popup>
              </Marker>
            </>
          );
        })()}

        {/* Capa Oficial de la Senda protegida contra trazados estáticos obsoletos */}
        {showSenda && (
          <>
            {/* Trazado de la Senda con flechas de sentido (salida -> llegada) */}
            <SendaRouteLayer track={sendaTrack} color={dayRouteColor} />

            {/* Zonas de Tablados y Juego destacadas para el Día de Negros (5 de Enero) */}
            {selectedDay === '05-ene' && (
              <>
                <Circle
                  center={[1.21056, -77.27655]}
                  radius={180}
                  pathOptions={{
                    color: '#dc2626',
                    fillColor: '#991b1b',
                    fillOpacity: 0.35,
                    weight: 3,
                    dashArray: '6, 6',
                  }}
                >
                  <Popup>
                    <div className="text-xs p-1 font-sans">
                      <strong className="text-aqua-300 block font-black">🎭 Tablado Principal - Plaza del Carnaval</strong>
                      <p className="text-slate-200 mt-1">Conciertos en vivo y zona neurálgica de juego con cosmético negro.</p>
                    </div>
                  </Popup>
                </Circle>
                <Circle
                  center={[1.21461, -77.27829]}
                  radius={160}
                  pathOptions={{
                    color: '#dc2626',
                    fillColor: '#991b1b',
                    fillOpacity: 0.35,
                    weight: 3,
                    dashArray: '6, 6',
                  }}
                >
                  <Popup>
                    <div className="text-xs p-1 font-sans">
                      <strong className="text-aqua-300 block font-black">🎭 Tablado Histórico - Plaza de Nariño</strong>
                      <p className="text-slate-200 mt-1">Presentaciones de orquestas y concentración de juego de la pintica.</p>
                    </div>
                  </Popup>
                </Circle>
              </>
            )}

            {/* Hitos Oficiales Clave con Pines SVG Personalizados y Modernos */}
            {/* Salida y llegada se muestran con los marcadores del evento del día (coinciden con el trazado) */}
            {HITOS_SENDA.filter((hito) => hito.tipo === 'intermedio').map((hito) => (
              <Marker
                key={`hito-senda-${hito.id}`}
                position={hito.coords}
                icon={createSvgLandmarkPin({
                  type: hito.tipo,
                  label: hito.nombre,
                })}
              >
                <Popup className="custom-popup">
                  <div className="text-xs p-2 min-w-[210px] max-w-[260px] font-sans rounded-2xl bg-slate-900/95 backdrop-blur-md text-white border border-white/10 shadow-2xl">
                    <div
                      className={`font-black flex items-center gap-1.5 pb-1.5 mb-1.5 border-b ${
                        hito.tipo === 'inicio'
                          ? 'text-aqua-400 border-aqua-500/25'
                          : hito.tipo === 'fin'
                            ? 'text-rose-400 border-rose-500/25'
                            : 'text-rose-400 border-rose-500/25'
                      }`}
                    >
                      <span className="text-sm">{hito.tipo === 'inicio' ? '🚩' : hito.tipo === 'fin' ? '🏁' : '👑'}</span>
                      <span className="text-[11px] uppercase tracking-wider font-extrabold leading-tight">{hito.nombre}</span>
                    </div>
                    <p className="text-xs text-slate-200 mt-1 leading-relaxed">{hito.desc}</p>
                    <div className="mt-2 text-[10px] text-slate-400 font-mono flex justify-between border-t border-white/10 pt-1">
                      <span>Lat: {hito.coords[0].toFixed(5)}</span>
                      <span>Lng: {hito.coords[1].toFixed(5)}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </>
        )}

        {/* Renderizado de la ruta peatonal en Leaflet con OSRM blindado o GuaneñaBot (Dorado Neón) */}
        {Array.isArray(routePath) && routePath.length >= 2 && (
          <>
            <Polyline
              key={`route-casing-${routePath.length}`}
              positions={routePath}
              pathOptions={{
                color: '#000000',
                weight: 9,
                opacity: 0.7,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            <Polyline
              key={`route-${routePath.length}-${navRoute?.isGeminiRoute ? 'gemini' : 'osrm'}`}
              positions={routePath}
              pathOptions={{
                color: '#f59e0b',
                weight: 5,
                opacity: 0.95,
                lineCap: 'round',
                lineJoin: 'round',
                dashArray: navRoute?.isGeminiRoute ? '8, 8' : undefined,
              }}
            />
          </>
        )}

        {navRoute && navRoute.targetCoords && (
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
                {displayDistance ? (
                  <p className="text-blue-300 font-bold mt-1 text-[11px]">
                    🚶 Distancia a pie: {displayDistance}
                  </p>
                ) : (
                  <p className="text-slate-300 mt-1">
                    Navegación activa hacia este punto del Carnaval de Pasto.
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Capa de Marcadores de Salida, Llegada y Cierres Viales: protegida bajo showSendaDetails y showSenda */}
        {showSenda && currentEvent && (
          <>
            {/* Marcador Salida: Pin verde con ícono "🏁 Inicio" */}
            {currentEvent.startPoint && (
              <Marker
                position={[currentEvent.startPoint.lat, currentEvent.startPoint.lng]}
                icon={createStartPointIcon()}
              >
                <Popup>
                  <div className="p-1 min-w-[210px] font-sans">
                    <div className="flex items-center gap-1.5 text-aqua-400 font-black text-xs border-b border-aqua-500/20 pb-1 mb-1.5">
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
          </>
        )}

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
              <div className="p-1 min-w-[220px] max-w-[280px] font-sans">
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5 mb-1.5">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-rose-300 bg-rose-500/20 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                    {poi.category}
                  </span>
                  {poi.schedule && (
                    <span className="text-[10px] text-slate-300 font-medium bg-white/10 px-2 py-0.5 rounded-md">
                      {poi.schedule}
                    </span>
                  )}
                </div>
                <h4 className="font-black text-sm text-white mt-1">{poi.name}</h4>
                {poi.address && (
                  <p className="text-[11px] text-aqua-300 font-medium mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-aqua-400 shrink-0" />
                    <span>{poi.address}</span>
                  </p>
                )}
                {poi.description && (
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {poi.description}
                  </p>
                )}

                {/* Botón de Enrutamiento OSRM a Pie */}
                {setNavRoute && (
                  <button
                    type="button"
                    onClick={() => {
                      const start = userGps ? [userGps.lat, userGps.lng] : PASTO_CENTER;
                      setNavRoute({
                        startCoords: start,
                        targetCoords: [poi.latitude, poi.longitude],
                        targetName: poi.name,
                      });
                    }}
                    className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-gradient-to-r from-coral-500 to-rose-700 hover:from-coral-400 hover:to-rose-800 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                    title="Calcular ruta a pie con OSRM"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>¿Cómo llegar a pie? (OSRM)</span>
                  </button>
                )}

                <div className="mt-2.5 pt-1.5 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="text-rose-400/80 font-medium">Senda del Carnaval</span>
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
                      <span className="text-[10px] uppercase font-black text-rose-300 bg-rose-500/20 px-2.5 py-0.5 rounded-full border border-rose-500/30 flex items-center gap-1">
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
                    <p className="text-xs text-rose-300 font-semibold mt-0.5">
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
                        <div className="flex items-center justify-between text-aqua-300 font-bold bg-aqua-950/40 px-2.5 py-1 rounded-lg border border-aqua-500/30 mt-1 text-[11px]">
                          <span className="flex items-center gap-1">
                            <Navigation className="w-3 h-3 text-aqua-400" />
                            <span>Distancia estimada:</span>
                          </span>
                          <span>A {distStr} de ti</span>
                        </div>
                      )}

                      {/* Botón de Enrutamiento OSRM a Pie */}
                      {setNavRoute && (
                        <button
                          type="button"
                          onClick={() => {
                            const start = userGps ? [userGps.lat, userGps.lng] : PASTO_CENTER;
                            setNavRoute({
                              startCoords: start,
                              targetCoords: [restaurant.latitude, restaurant.longitude],
                              targetName: restaurant.name,
                            });
                          }}
                          className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-800 hover:from-coral-500 hover:to-rose-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                          title="Calcular ruta a pie con OSRM"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>¿Cómo llegar a pie? (OSRM)</span>
                        </button>
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
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${report.ai_risk_level === 'Alto'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : report.ai_risk_level === 'Medio'
                          ? 'bg-coral-500/20 text-coral-300 border-coral-500/40'
                          : 'bg-aqua-500/20 text-aqua-300 border-aqua-500/40'
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
            icon={createCustomIcon('linear-gradient(135deg, #f87171 0%, #dc2626 100%)', '📍', true, 'rgba(220, 38, 38, 0.7)')}
          >
            <Popup>
              <div className="text-xs p-1 font-sans">
                <strong className="text-rose-300 block font-black text-sm">
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
