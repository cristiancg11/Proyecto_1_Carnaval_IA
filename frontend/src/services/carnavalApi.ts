/**
 * CarnavalIA - Gemini 2.0 Flash Carnaval API Service Client
 * Connects frontend components to the backend endpoint (/api/v1/carnaval/chat)
 * for AI conversational guidance and GIS route waypoint extraction.
 */

export interface ChatHistoryTurn {
  role: 'user' | 'model' | 'assistant' | 'system';
  content: string;
}

export interface CarnavalSchedule {
  start_time: string;
  estimated_arrival_time: string;
  start_location: string;
  finish_location: string;
  event_name?: string;
  distance_km?: number | string;
}

export interface NearbyPlace {
  name: string;
  category: 'restroom' | 'police' | 'health' | 'stage' | 'restaurant' | 'shopping' | 'risk_zone' | string;
  coordinates: [number, number];
  description?: string;
  schedule?: string;
  status?: string;
}

export interface CarnavalChatResponse {
  reply: string;
  schedule?: CarnavalSchedule | null;
  should_draw_route: boolean;
  route_coordinates: [number, number][]; // [lat, lng] pairs
  waypoints: [number, number][]; // Alias for backward compatibility
  nearby_places: NearbyPlace[];
  suggested_questions: string[];
}

// Canonical fallback waypoints for Pasto's official Senda del Carnaval
export const OFFICIAL_SENDA_WAYPOINTS: [number, number][] = [
  [1.2030, -77.2798], // Salida: I.E.M. Champagnat
  [1.2075, -77.2792], // Av. Las Américas
  [1.2110, -77.2785], // Entrada Carrera 27
  [1.2138, -77.2782], // Plaza del Carnaval y la Cultura
  [1.2155, -77.2795], // Conexión Calle 19
  [1.2168, -77.2805], // Plaza de Nariño
  [1.2210, -77.2825], // Av. Santander / Carrera 27 Norte
  [1.2260, -77.2855], // Llegada: Fuente de la Transparencia
];

const resolveBaseUrl = (): string => {
  try {
    const envUrl = (
      (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL)) ||
      'http://localhost:8000'
    ).trim().replace(/\/+$/, '');

    // Strip trailing /api/v1 to avoid duplication
    return envUrl.endsWith('/api/v1') ? envUrl.replace(/\/api\/v1$/, '') : envUrl;
  } catch {
    return 'http://localhost:8000';
  }
};

/**
 * Sends a message and chat history to GuaneñaBot powered by Gemini 2.0 Flash.
 * @param message Natural language query from the user
 * @param history Conversation history turns
 * @param userCoords Current real-time user GPS coordinates [lat, lng]
 * @returns Promise with reply, should_draw_route flag, waypoints, and suggested questions
 */
export async function sendMessageToGuanena(
  message: string,
  history: ChatHistoryTurn[] = [],
  userCoords?: { lat: number; lng: number } | null
): Promise<CarnavalChatResponse> {
  const trimmedMessage = (message || '').trim();
  if (!trimmedMessage) {
    return {
      reply: '¡Hola paisano! ¿En qué te puedo colaborar sobre la fiesta magna de Pasto?',
      should_draw_route: false,
      waypoints: [],
      suggested_questions: [
        '¿Cuál es el recorrido de la Senda?',
        '¿Qué desfile hay hoy?',
        '¿Dónde comer un buen cuy en Pasto?',
      ],
    };
  }

  const baseUrl = resolveBaseUrl();
  const endpoint = `${baseUrl}/api/v1/carnaval/chat`;

  const payload: Record<string, any> = {
    message: trimmedMessage,
    history: Array.isArray(history)
      ? history.map((turn) => ({
          role: turn.role === 'model' || turn.role === 'assistant' ? 'model' : 'user',
          content: turn.content || '',
        }))
      : [],
  };

  if (userCoords && typeof userCoords.lat === 'number' && typeof userCoords.lng === 'number') {
    payload.user_lat = userCoords.lat;
    payload.user_lng = userCoords.lng;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const rawRouteCoords = Array.isArray(data.route_coordinates)
        ? data.route_coordinates
        : Array.isArray(data.waypoints)
        ? data.waypoints
        : [];
      
      // Clean and ensure coordinates are valid [latitude, longitude] pairs
      const validWaypoints: [number, number][] = rawRouteCoords
        .filter((pair: any) => Array.isArray(pair) && pair.length >= 2 && !isNaN(Number(pair[0])) && !isNaN(Number(pair[1])))
        .map((pair: any) => [Number(pair[0]), Number(pair[1])] as [number, number]);

      const nearbyPlaces: NearbyPlace[] = Array.isArray(data.nearby_places)
        ? data.nearby_places
            .filter((p: any) => p && Array.isArray(p.coordinates) && p.coordinates.length >= 2)
            .map((p: any) => ({
              name: p.name || 'Punto de Interés',
              category: p.category || 'shopping',
              coordinates: [Number(p.coordinates[0]), Number(p.coordinates[1])] as [number, number],
              description: p.description || '',
              schedule: p.schedule || '',
              status: p.status || '',
            }))
        : [];

      const schedule: CarnavalSchedule | null = data.schedule ? {
        start_time: data.schedule.start_time || '10:00 AM',
        estimated_arrival_time: data.schedule.estimated_arrival_time || '03:30 PM',
        start_location: data.schedule.start_location || 'Estadio Departamental Libertad',
        finish_location: data.schedule.finish_location || 'Avenida de los Estudiantes / Torobajo',
        event_name: data.schedule.event_name || 'Desfile Oficial del Carnaval',
        distance_km: data.schedule.distance_km || '7.2 km',
      } : null;

      return {
        reply: data.reply || '¡Qué viva Pasto, carajo! Consulta procesada con éxito.',
        schedule,
        should_draw_route: Boolean(data.should_draw_route) && validWaypoints.length >= 2,
        route_coordinates: validWaypoints,
        waypoints: validWaypoints,
        nearby_places: nearbyPlaces,
        suggested_questions: Array.isArray(data.suggested_questions) && data.suggested_questions.length > 0
          ? data.suggested_questions
          : [
              '¿Cuál es el recorrido de la Senda?',
              '¿Dónde queda la Plaza del Carnaval?',
              '¿Cómo llego a la Plaza de Nariño?',
            ],
      };
    }
  } catch (error: any) {
    console.warn(`[carnavalApi] Notice while contacting ${endpoint}:`, error?.message || error);
  }

  // Graceful deterministic offline fallback matching the Carnaval knowledge base
  const lower = trimmedMessage.toLowerCase();
  const isSendaQuery = lower.includes('senda') || lower.includes('recorrido') || lower.includes('ruta') || lower.includes('castañeda') || lower.includes('desfile');
  const isHospitalQuery = lower.includes('hospital') || lower.includes('salud') || lower.includes('medico') || lower.includes('médico') || lower.includes('urgencia');
  const isPlazaCarnaval = lower.includes('plaza del carnaval') || lower.includes('plaza carnaval');

  let reply = '¡Qué viva Pasto, carajo! 🎭 GuaneñaBot a tu servicio para vivir el Carnaval de Negros y Blancos.';
  let shouldDraw = false;
  let waypoints: [number, number][] = [];
  let schedule: CarnavalSchedule | null = null;
  let nearbyPlaces: NearbyPlace[] = [];

  if (isSendaQuery) {
    reply = '¡Qué viva Pasto, carajo! 🎭 La Senda Oficial recorre 7.2 km desde el Estadio Libertad por la Carrera 27, cruza la Plaza del Carnaval, la Plaza de Nariño y culmina en la Avenida de los Estudiantes.';
    shouldDraw = true;
    waypoints = OFFICIAL_SENDA_WAYPOINTS;
    schedule = {
      start_time: '10:00 AM',
      estimated_arrival_time: '03:30 PM',
      start_location: 'Estadio Departamental Libertad',
      finish_location: 'Avenida de los Estudiantes / Torobajo',
      event_name: 'Desfile Oficial de la Senda del Carnaval',
      distance_km: '7.2 km',
    };
    nearbyPlaces = [
      {
        name: 'Batería Sanitaria Plaza del Carnaval',
        category: 'restroom',
        coordinates: [1.2130, -77.2780],
        description: 'Batería de baños públicos habilitados para el desfile.',
      },
      {
        name: 'CAI Plaza de Nariño',
        category: 'police',
        coordinates: [1.2140, -77.2792],
        description: 'Puesto policial de control y vigilancia.',
      },
      {
        name: 'Puesto de Socorro Cruz Roja - Plaza del Carnaval',
        category: 'health',
        coordinates: [1.2128, -77.2779],
        description: 'Carpa de triage, socorristas y ambulancia medicalizada.',
      },
      {
        name: 'Tarima Principal Plaza del Carnaval',
        category: 'stage',
        coordinates: [1.2136, -77.2785],
        description: 'Escenario principal de conciertos y agrupaciones.',
      },
      {
        name: 'Centro Comercial Unicentro Pasto',
        category: 'shopping',
        coordinates: [1.2285, -77.2835],
        description: 'Complejo comercial, cajeros y plazoleta de comidas.',
      },
      {
        name: 'Embudo Carrera 27 con Plaza del Carnaval',
        category: 'risk_zone',
        coordinates: [1.2135, -77.2788],
        description: 'Zona de alta aglomeración y cuello de botella peatonal.',
      },
    ];
  } else if (isHospitalQuery) {
    reply = 'Ruta peatonal trazada hacia el centro de salud más cercano sobre el mapa.';
    shouldDraw = true;
    waypoints = [
      [1.2168, -77.2805],
      [1.2155, -77.2795],
      [1.2138, -77.2782],
      [1.2118, -77.2755],
    ];
    nearbyPlaces = [
      {
        name: 'Puesto de Socorro Cruz Roja - Plaza del Carnaval',
        category: 'health',
        coordinates: [1.2128, -77.2779],
        description: 'Atención prehospitalaria y urgencias.',
      },
    ];
  } else if (isPlazaCarnaval) {
    reply = 'La Plaza del Carnaval y la Cultura es el epicentro de la fiesta, las tarimas principales y la calificación de carrozas.';
    shouldDraw = true;
    waypoints = [
      [1.2168, -77.2805],
      [1.2155, -77.2795],
      [1.2138, -77.2782],
    ];
    nearbyPlaces = [
      {
        name: 'Tarima Principal Plaza del Carnaval',
        category: 'stage',
        coordinates: [1.2136, -77.2785],
        description: 'Conciertos y presentaciones en vivo.',
      },
      {
        name: 'Batería Sanitaria Plaza del Carnaval',
        category: 'restroom',
        coordinates: [1.2130, -77.2780],
        description: 'Módulos sanitarios portátiles.',
      },
    ];
  }

  return {
    reply,
    schedule,
    should_draw_route: shouldDraw,
    route_coordinates: waypoints,
    waypoints,
    nearby_places: nearbyPlaces,
    suggested_questions: [
      '¿Cuál es el recorrido de la Senda?',
      '¿Qué se celebra el 6 de Enero?',
      '¿Cómo llego a la Plaza del Carnaval?',
    ],
  };
}

export default {
  sendMessageToGuanena,
  OFFICIAL_SENDA_WAYPOINTS,
};

