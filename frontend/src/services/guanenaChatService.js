/**
 * Cliente de servicio API para el Asistente Virtual GuaneñaBot
 * Conecta el chat con el endpoint de IA del backend (/api/v1/chat/guanena)
 * y despacha acciones sobre el mapa interactivo de CarnavalIA.
 */
import axios from 'axios';
import {
  CARNAVAL_DAYS_AGENDA,
  OFF_TOPIC_RESPONSE,
  isCarnavalRelatedQuery,
  findCarnavalDayAgenda,
} from '../data/carnavalKnowledgeBase';

const RAW_BASE_URL = (
  (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL)) ||
  'https://carnavalia-backend.onrender.com'
).trim().replace(/\/+$/, '');

const BASE_URL = RAW_BASE_URL.endsWith('/api/v1')
  ? RAW_BASE_URL.replace(/\/api\/v1$/, '')
  : RAW_BASE_URL.endsWith('/api')
  ? RAW_BASE_URL.replace(/\/api$/, '')
  : RAW_BASE_URL;

const GUANENA_ENDPOINT = `${BASE_URL}/api/v1/chat/guanena`;

/**
 * Envía un mensaje a GuaneñaBot junto con la georreferenciación del usuario.
 * @param {string} message - Texto o consulta del usuario
 * @param {number} userLat - Latitud GPS del usuario
 * @param {number} userLng - Longitud GPS del usuario
 * @returns {Promise<{ reply: string, map_action: any }>}
 */
export async function sendGuanenaMessage(message, userLat, userLng) {
  const lowerMsg = (message || '').toLowerCase();

  // 1. Atención inmediata a emergencias y solicitudes de salud/hospitales (sin rodeos ni saludos)
  const isHealthEmergency =
    lowerMsg.includes('hospital') ||
    lowerMsg.includes('salud') ||
    lowerMsg.includes('medico') ||
    lowerMsg.includes('médico') ||
    lowerMsg.includes('cruz roja') ||
    lowerMsg.includes('urgencia') ||
    lowerMsg.includes('primeros auxilios');

  if (isHealthEmergency) {
    return {
      reply: 'Ruta peatonal trazada hacia el centro de salud más cercano sobre el mapa.',
      crowdNotice: '🚨 Hospital Civil de Pasto y puestos de primeros auxilios activos.',
      actionButton: null,
      map_action: {
        action_type: 'ROUTE_TO_POI',
        target_coords: [1.2118, -77.2755],
        target_name: 'Hospital Civil de Pasto',
        category: 'salud',
      },
    };
  }

  // 2. Regla de contención temática exclusiva del Carnaval de Pasto
  if (!isCarnavalRelatedQuery(message)) {
    return {
      reply: OFF_TOPIC_RESPONSE,
      crowdNotice: null,
      actionButton: null,
      map_action: null,
    };
  }

  // 2. Evaluación determinista sobre días y eventos de la Agenda Oficial del Carnaval
  const dayMatch = findCarnavalDayAgenda(message);
  if (dayMatch) {
    const isPlazaDay = dayMatch.routeKey === '5' || dayMatch.routeKey === '7';
    return {
      reply: `${dayMatch.title} (${dayMatch.date}): ${dayMatch.description}`,
      crowdNotice: dayMatch.crowdNotice,
      actionButton: {
        label: isPlazaDay ? '📍 Ver puntos de encuentro en el mapa' : '📍 Mirar la senda del carnaval para este día',
        dayKey: dayMatch.routeKey,
      },
      map_action: {
        action_type: isPlazaDay ? 'DRAW_DAY_ROUTE' : 'ROUTE_TO_EVENT_START',
        day_id: dayMatch.routeKey,
      },
    };
  }

  const payload = {
    message: message || '',
    user_lat: typeof userLat === 'number' ? userLat : 1.2168,
    user_lng: typeof userLng === 'number' ? userLng : -77.2805,
  };

  try {
    const response = await axios.post(GUANENA_ENDPOINT, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 12000,
    });

    const data = response?.data;
    if (data && typeof data === 'object') {
      let rawReply = data.reply || data.message || 'Consulta procesada en el mapa.';
      rawReply = rawReply.replace(/¡?Que viva Pasto,?\s*carajo!?[^.\n]*[.\n]*/gi, '').trim();
      return {
        reply: rawReply || 'Consulta procesada en el mapa.',
        crowdNotice: data.crowd_notice || data.crowdNotice || null,
        actionButton: data.action_button || data.actionButton || null,
        map_action: data.map_action || null,
      };
    }

    return {
      reply: 'Consulta procesada en el mapa.',
      crowdNotice: null,
      actionButton: null,
      map_action: null,
    };
  } catch (error) {
    console.warn('Aviso: Backend de GuaneñaBot no disponible en', GUANENA_ENDPOINT, error?.message);

    // Fallback conversacional ultra concreto (máximo 2 líneas, sin relleno ni introducciones largas)
    const lower = (message || '').toLowerCase();
    let mapAction = null;
    let reply = 'Consulta procesada. Revisa los marcadores y trazados en el mapa.';
    let crowdNotice = null;
    let actionButton = null;

    if (lower.includes('hospital') || lower.includes('salud') || lower.includes('medico') || lower.includes('médico') || lower.includes('cruz roja') || lower.includes('urgencia') || lower.includes('primeros auxilios')) {
      reply = 'Ruta peatonal trazada hacia el centro de salud más cercano sobre el mapa.';
      crowdNotice = '🚨 Hospital Civil de Pasto y puestos de primeros auxilios activos.';
      mapAction = {
        action_type: 'ROUTE_TO_POI',
        target_coords: [1.2118, -77.2755],
        target_name: 'Hospital Civil de Pasto',
        category: 'salud',
      };
    } else if (lower.includes('baño') || lower.includes('sanitario')) {
      reply = 'Baterías sanitarias activas en Plaza del Carnaval y Plaza de Nariño. Marcadores ubicados en el mapa.';
      crowdNotice = '⚠️ Zona más concurrida: Costado sur de la Plaza del Carnaval.';
      mapAction = {
        action_type: 'DRAW_ROUTE',
        target_coords: [1.2138, -77.2782],
        target_name: 'Baterías Sanitarias Plaza del Carnaval',
      };
    } else if (lower.includes('cuy') || lower.includes('comer') || lower.includes('restaurante') || lower.includes('comida') || lower.includes('almuerzo')) {
      reply = 'Encuentras cuy típico en el sector de Bombona y en el Parque Bolívar. Marcadores ubicados en el mapa.';
      crowdNotice = '⚠️ Zona más llena: Corregimientos de Catambuco y Obonuco.';
      actionButton = {
        label: '📍 Ver puntos de encuentro en el mapa',
        dayKey: '7',
      };
      mapAction = {
        action_type: 'DRAW_ROUTE',
        target_coords: [1.2132, -77.2798],
        target_name: 'Restaurante Tradicional Pastuso',
        day_id: '7',
      };
    } else if (lower.includes('senda') || lower.includes('recorrido') || lower.includes('ruta') || lower.includes('desfile')) {
      reply = 'Ruta oficial de la Senda del Carnaval trazada de Sur a Norte (Champagnat a Fuente de la Transparencia).';
      crowdNotice = '⚠️ Zona más llena: Carrera 27 y Plaza del Carnaval.';
      actionButton = {
        label: '📍 Mirar la senda del carnaval para este día',
        dayKey: '6',
      };
      mapAction = {
        action_type: 'ROUTE_TO_EVENT_START',
        target_coords: [1.2030, -77.2798],
        target_name: 'Salida Champagnat',
        day_id: '6',
      };
    }

    return {
      reply,
      crowdNotice,
      actionButton,
      map_action: mapAction,
    };
  }
}

export default {
  sendGuanenaMessage,
};
