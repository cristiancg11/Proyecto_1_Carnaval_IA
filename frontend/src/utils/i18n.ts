export type Language = 'ES' | 'EN';

export interface Translations {
  nav: {
    live: string;
    searchPlaceholder: string;
    sosButton: string;
    feedTitle: string;
    feedTitleMobile: string;
  };
  sidebar: {
    brandSubtitle: string;
    mainMap: string;
    carnivalSenda: string;
    sendaActive: string;
    sendaInactive: string;
    civicHealth: string;
    alertCenter: string;
    guanenaBot: string;
    officialCalendar: string;
    logOut: string;
    systemStatus: string;
    pmuConnected: string;
  };
  filters: {
    all: string;
    officialSenda: string;
    sendaShown: string;
    sendaHidden: string;
    gastronomy: string;
    healthPosts: string;
    policeCai: string;
    restrooms: string;
    stages: string;
    riskZones: string;
  };
  telemetry: {
    live: string;
    datumTelemetry: string;
    carnivalTitle: string;
    spectators: string;
    temp: string;
    liveGps: string;
    centerOnMe: string;
  };
  sos: {
    modalTitle: string;
    modalSubtitle: string;
    badge: string;
    incidentType: string;
    selectCategory: string;
    categories: {
      medical: { title: string; subtext: string };
      security: { title: string; subtext: string };
      fire: { title: string; subtext: string };
      lostChild: { title: string; subtext: string };
    };
    gpsLocation: string;
    refreshGps: string;
    fetchingGps: string;
    activeGps: string;
    sectorLabel: string;
    sectorPlaceholder: string;
    useMyGps: string;
    landmarkOption: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    phoneSubtext: string;
    submitButton: string;
    submitting: string;
    successAlert: string;
    errorAlert: string;
  };
  guanena: {
    title: string;
    subtitle: string;
    status: string;
    placeholder: string;
    send: string;
    greeting: string;
    walkingBadge: string;
    suggestionsTitle: string;
    suggestions: string[];
  };
}

export const TRANSLATIONS: Record<Language, Translations> = {
  ES: {
    nav: {
      live: 'EN VIVO',
      searchPlaceholder: 'Buscar cuadrilla, carroza, tarima...',
      sosButton: 'Alerta SOS',
      feedTitle: 'PASTO_CAM_VECTOR_FEED',
      feedTitleMobile: 'PASTO SIG',
    },
    sidebar: {
      brandSubtitle: 'GIS Pasto · UNESCO',
      mainMap: 'Mapa Principal',
      carnivalSenda: 'Senda del Carnaval',
      sendaActive: 'Capa Activa',
      sendaInactive: 'Capa Inactiva',
      civicHealth: 'POIs Cívicos y Salud',
      alertCenter: 'Centro de Alertas',
      guanenaBot: 'GuaneñaBot IA',
      officialCalendar: 'Calendario Oficial',
      logOut: 'Cerrar Sesión',
      systemStatus: 'ESTADO DEL SISTEMA',
      pmuConnected: 'PMU Conectado (Nivel 3)',
    },
    filters: {
      all: 'Todos',
      officialSenda: 'Senda Oficial',
      sendaShown: 'Senda en Mapa',
      sendaHidden: 'Ver Senda',
      gastronomy: 'Gastronomía Andina',
      healthPosts: 'Puestos de Salud',
      policeCai: 'Seguridad / CAI',
      restrooms: 'Baños Móviles',
      stages: 'Tarimas Culturales',
      riskZones: 'Zonas de Riesgo',
    },
    telemetry: {
      live: 'EN VIVO',
      datumTelemetry: 'TELEMETRÍA DATUM',
      carnivalTitle: 'SENDA DEL CARNAVAL DE NEGROS Y BLANCOS • 7.5 KM',
      spectators: 'ESPECTADORES: 420,000',
      temp: '16°C • PASTOLUZ',
      liveGps: 'GPS EN VIVO',
      centerOnMe: 'Centrar mapa en mi GPS',
    },
    sos: {
      modalTitle: 'Alerta SOS & PMU',
      modalSubtitle: 'Puesto de Mando Unificado • San Juan de Pasto',
      badge: 'Emergencias',
      incidentType: 'Tipo de Emergencia *',
      selectCategory: 'Selecciona una categoría',
      categories: {
        medical: {
          title: 'Médica / Salud',
          subtext: 'Ambulancia, desmayo, triaje urgente',
        },
        security: {
          title: 'Seguridad / Policía',
          subtext: 'Hurto, riña o altercado en vía',
        },
        fire: {
          title: 'Incendio / Rescate',
          subtext: 'Bomberos, fuego o escape de gas',
        },
        lostChild: {
          title: 'Menor Extraviado',
          subtext: 'Niño perdido o búsqueda urgente',
        },
      },
      gpsLocation: 'Ubicación de la Emergencia (GPS) *',
      refreshGps: 'Actualizar GPS',
      fetchingGps: 'Obteniendo GPS...',
      activeGps: 'GPS Activo',
      sectorLabel: 'Hito o Sector en la Senda *',
      sectorPlaceholder: 'Ej. Plaza del Carnaval, Cra 27 con Cll 19, Champagnat...',
      useMyGps: '📍 Usar mis coordenadas GPS capturadas',
      landmarkOption: 'Hito Senda:',
      descriptionLabel: 'Descripción del Suceso *',
      descriptionPlaceholder: 'Describe lo sucedido con referencias visuales, vestimenta o detalles del paciente...',
      phoneLabel: 'Teléfono de Contacto (Informante)',
      phonePlaceholder: 'Ej. 315 123 4567 (opcional)',
      phoneSubtext: 'Opcional',
      submitButton: 'Despachar Reporte al PMU',
      submitting: 'Despachando Reporte...',
      successAlert: 'Alerta enviada al PMU con tus coordenadas GPS',
      errorAlert: 'Error al despachar la alerta al PMU. Inténtalo de nuevo o llama a la línea 123.',
    },
    guanena: {
      title: 'GuaneñaBot IA',
      subtitle: 'Guía cultural y espacial del Carnaval',
      status: 'En línea',
      placeholder: 'Pregúntame sobre la Senda, carrozas, comida o baños...',
      send: 'Enviar',
      greeting: '¡Qué viva Pasto, carajo! Soy GuaneñaBot, tu guía oficial con IA para el Carnaval de Negros y Blancos. Puedo indicarte cómo llegar a pie a cualquier punto, horarios de desfiles y gastronomía típica.',
      walkingBadge: 'Ruta a pie',
      suggestionsTitle: 'Preguntas frecuentes:',
      suggestions: [
        '¿Cuál es el recorrido de la Familia Castañeda?',
        '¿Cómo llego a la Plaza del Carnaval?',
        '¿Cuál es el trayecto del Desfile Magno del 6 de Enero?',
        '¿Dónde hay puestos de salud y primeros auxilios?',
        '¿Dónde comer un buen cuy tradicional?',
      ],
    },
  },
  EN: {
    nav: {
      live: 'LIVE',
      searchPlaceholder: 'Search troupe, float, stage...',
      sosButton: 'SOS Alert',
      feedTitle: 'PASTO_GIS_VECTOR_FEED',
      feedTitleMobile: 'PASTO GIS',
    },
    sidebar: {
      brandSubtitle: 'Pasto GIS · UNESCO',
      mainMap: 'Main Map',
      carnivalSenda: 'Carnival Senda',
      sendaActive: 'Active Layer',
      sendaInactive: 'Inactive Layer',
      civicHealth: 'Civic & Health POIs',
      alertCenter: 'Alert Center',
      guanenaBot: 'GuaneñaBot AI',
      officialCalendar: 'Official Calendar',
      logOut: 'Log Out',
      systemStatus: 'SYSTEM TELEMETRY',
      pmuConnected: 'PMU Connected (Level 3)',
    },
    filters: {
      all: 'All',
      officialSenda: 'Official Senda',
      sendaShown: 'Senda on Map',
      sendaHidden: 'Show Senda',
      gastronomy: 'Andean Gastronomy',
      healthPosts: 'Health Posts',
      policeCai: 'Police CAIs',
      restrooms: 'Mobile Restrooms',
      stages: 'Cultural Stages',
      riskZones: 'Risk Zones',
    },
    telemetry: {
      live: 'LIVE',
      datumTelemetry: 'DATUM TELEMETRY',
      carnivalTitle: 'BLACKS AND WHITES CARNIVAL SENDA • 7.5 KM',
      spectators: 'SPECTATORS: 420,000',
      temp: '16°C • PASTOLUZ',
      liveGps: 'LIVE GPS',
      centerOnMe: 'Center map on my GPS',
    },
    sos: {
      modalTitle: 'SOS Alert & PMU',
      modalSubtitle: 'Unified Command Post • San Juan de Pasto',
      badge: 'Emergencies',
      incidentType: 'Incident Type *',
      selectCategory: 'Select an incident category',
      categories: {
        medical: {
          title: 'Medical / Health',
          subtext: 'Ambulance, fainting, urgent triage',
        },
        security: {
          title: 'Security / Police',
          subtext: 'Theft, fight, or street disturbance',
        },
        fire: {
          title: 'Fire / Rescue',
          subtext: 'Firefighters, blaze, or gas leak',
        },
        lostChild: {
          title: 'Lost Minor / Person',
          subtext: 'Missing child or urgent search',
        },
      },
      gpsLocation: 'Emergency Location (GPS) *',
      refreshGps: 'Refresh GPS',
      fetchingGps: 'Fetching GPS...',
      activeGps: 'Active GPS',
      sectorLabel: 'Landmark or Sector along La Senda *',
      sectorPlaceholder: 'E.g. Carnival Plaza, Cra 27 with 19th St, Champagnat...',
      useMyGps: '📍 Use captured device GPS coordinates',
      landmarkOption: 'Senda Landmark:',
      descriptionLabel: 'Incident Description *',
      descriptionPlaceholder: 'Describe what happened with visual references, clothing, or patient details...',
      phoneLabel: 'Contact Phone (Informant)',
      phonePlaceholder: 'E.g. +57 315 123 4567 (optional)',
      phoneSubtext: 'Optional',
      submitButton: 'Dispatch Report to PMU',
      submitting: 'Dispatching Report...',
      successAlert: 'Alert dispatched to PMU with your GPS coordinates',
      errorAlert: 'Error dispatching alert to PMU. Please retry or dial 123.',
    },
    guanena: {
      title: 'GuaneñaBot AI',
      subtitle: 'Carnival Cultural & Spatial Guide',
      status: 'Online',
      placeholder: 'Ask me about La Senda, floats, food, or restrooms...',
      send: 'Send',
      greeting: 'Long live Pasto! I am GuaneñaBot, your official AI guide for the Blacks and Whites Carnival. I can trace walking paths to any POI, explain parade schedules, and recommend traditional Andean food.',
      walkingBadge: 'Walking route',
      suggestionsTitle: 'Frequently asked:',
      suggestions: [
        'What is the route of the Castañeda Family?',
        'How do I walk to the Carnival Plaza?',
        'What is the path of the Grand Parade on January 6th?',
        'Where are the first aid and health posts located?',
        'Where can I eat traditional roasted guinea pig (cuy)?',
      ],
    },
  },
};

export function getTranslation(lang: Language): Translations {
  return TRANSLATIONS[lang] || TRANSLATIONS.ES;
}

