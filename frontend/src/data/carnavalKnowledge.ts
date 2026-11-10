export interface Landmark {
  id: string;
  name: string;
  category: 'evento' | 'patrimonio' | 'salud' | 'plaza';
  coords: [number, number];
  description: string;
}

export const CARNAVAL_LANDMARKS: Record<string, Landmark> = {
  desfile_magno: {
    id: 'desfile_magno',
    name: 'Desfile Magno (6 de Enero) - Senda Completa',
    category: 'evento',
    coords: [1.21540, -77.28410],
    description: 'El día cumbre del Carnaval. Recorre toda la Senda oficial desde la Normal Superior hasta Champagnat.'
  },
  castaneda: {
    id: 'castaneda',
    name: 'Llegada de la Familia Castañeda (4 de Enero)',
    category: 'evento',
    coords: [1.21852, -77.26941],
    description: 'Apertura oficial del Carnaval en la Senda, partiendo desde la Normal Superior.'
  },
  dia_negros: {
    id: 'dia_negros',
    name: 'Día de Negros (5 de Enero)',
    category: 'evento',
    coords: [1.21540, -77.28410],
    description: 'Juego de caricias y cosmético en las principales plazas: Plaza del Carnaval y Parque Nariño.'
  },
  plaza_carnaval: {
    id: 'plaza_carnaval',
    name: 'Plaza del Carnaval y la Cultura',
    category: 'plaza',
    coords: [1.21540, -77.28410],
    description: 'Punto neurálgico de conciertos, tablados y concentración de comparsas.'
  },
  parque_narino: {
    id: 'parque_narino',
    name: 'Plaza de Nariño (Centro Histórico)',
    category: 'patrimonio',
    coords: [1.21380, -77.28180],
    description: 'Corazón histórico de Pasto y paso peatonal de la fiesta.'
  },
  puesto_salud_normal: {
    id: 'puesto_salud_normal',
    name: 'Puesto de Primeros Auxilios - Normal Superior',
    category: 'salud',
    coords: [1.21820, -77.27010],
    description: 'Atención médica y Defensa Civil en el punto de partida de la Senda.'
  },
  puesto_salud_plaza: {
    id: 'puesto_salud_plaza',
    name: 'Puesto de Emergencias - Plaza del Carnaval',
    category: 'salud',
    coords: [1.21510, -77.28390],
    description: 'Módulo de Cruz Roja y Bomberos.'
  }
};

export interface CarnavalDayEvent {
  id: string;
  dateKey: string;
  dateLabel: string;
  title: string;
  shortSummary: string;
  fullDescription: string;
  startLocation: string;
  finishLocation: string;
  startTime: string;
  estimatedArrival: string;
  coords: [number, number];
  recommendations: string[];
}

export const CARNAVAL_DAILY_SCHEDULE: Record<string, CarnavalDayEvent> = {
  dec_28: {
    id: 'dec_28',
    dateKey: '28-dic',
    dateLabel: '28 de Diciembre',
    title: 'Día de los Inocentes y Arcoíris en el Asfalto',
    shortSummary: 'Pintura artística con tiza sobre el asfalto en El Colorado, conciencia ecológica y homenaje al agua y la paz.',
    fullDescription: 'Celebración cultural por la paz, el arte urbano y el cuidado del agua. Miles de familias, jóvenes y artistas transforman las calles del barrio El Colorado (Cra 23 entre Calles 14 y 15) en un lienzo multicolor efímero con tizas, reemplazando el antiguo juego violento con agua.',
    startLocation: 'Sector El Colorado (Calle 18 / Carrera 23)',
    finishLocation: 'Centro Histórico de Pasto',
    startTime: '08:00 AM',
    estimatedArrival: '06:00 PM',
    coords: [1.2140, -77.2785],
    recommendations: [
      'Usa ropa cómoda que puedas manchar de tiza.',
      'El centro histórico y el sector El Colorado son peatonales durante todo el día.',
      'Lleva tu propia tiza de colores si deseas participar en el asfalto.',
    ],
  },
  dec_29: {
    id: 'dec_29',
    dateKey: '29-dic',
    dateLabel: '29 de Diciembre',
    title: 'Concierto de Música Latinoamericana',
    shortSummary: 'Tributo andino y sacro con ensambles tradicionales en Plaza de Nariño y Plaza del Carnaval.',
    fullDescription: 'Homenaje a la sonoridad andina e identidad del sur del continente. Agrupaciones de vientos, charangos, quenas y zampoñas interpretan música latinoamericana y ritmos tradicionales en los tablados oficiales de la Plaza de Nariño y la Plaza del Carnaval.',
    startLocation: 'Plaza de Nariño',
    finishLocation: 'Plaza del Carnaval y la Cultura',
    startTime: '03:00 PM',
    estimatedArrival: '11:00 PM',
    coords: [1.2145, -77.2780],
    recommendations: [
      'Llega con antelación para asegurar buen lugar frente a las tarimas.',
      'Lleva abrigo liviano o ruana para el clima fresco de la noche pastusa.',
      'Disfruta de café nariñense en los alrededores de la Plaza de Nariño.',
    ],
  },
  dec_30: {
    id: 'dec_30',
    dateKey: '30-dic',
    dateLabel: '30 de Diciembre',
    title: 'Serenata a Pasto',
    shortSummary: 'Tríos regionales, boleros y música de cuerdas en tributo de amor a San Juan de Pasto.',
    fullDescription: 'Noche romántica de cuerdas, guitarras, requintos y armonías vocales donde los más célebres tríos nariñenses y latinoamericanos rinden serenata a la Ciudad Sorpresa de Colombia en la Plaza de Nariño.',
    startLocation: 'Plaza de Nariño (Tarima de Tríos)',
    finishLocation: 'Plaza de Nariño',
    startTime: '05:00 PM',
    estimatedArrival: '11:30 PM',
    coords: [1.2145, -77.2780],
    recommendations: [
      'Espacio ideal para asistir en familia y disfrutar de la bohemia pastusa.',
      'Prohibido el uso de espuma o cosmético en esta velada musical.',
      'Excelente oportunidad para degustar un hervido de mora o lulo en locales autorizados.',
    ],
  },
  dec_31: {
    id: 'dec_31',
    dateKey: '31-dic',
    dateLabel: '31 de Diciembre',
    title: 'Desfile de Años Viejos y Viudas',
    shortSummary: 'Desfile satírico de monigotes sobre política y actualidad, seguido de la quema simbólica y bienvenida al Año Nuevo.',
    fullDescription: 'Muestra de humor cáustico, ingenio popular y sátira donde artesanos y comunidades desfilan monigotes y comparsas representando personajes de la política local, nacional y mundial con ingeniosos testamentos en verso, culminando en la quema ritual del año viejo a la medianoche.',
    startLocation: 'Escuela Normal Superior / Senda Sur',
    finishLocation: 'Sector Champagnat (Llegada)',
    startTime: '09:00 AM',
    estimatedArrival: '04:00 PM',
    coords: [1.2052, -77.2796],
    recommendations: [
      'Lee los testamentos rimados pegados a los muñecos para entender la picardía pastusa.',
      'La Carrera 27 tiene cierres viales escalonados durante todo el desfile.',
      'Cuida a los niños del calor y mantén hidratación constante.',
    ],
  },
  jan_02: {
    id: 'jan_02',
    dateKey: '02-ene',
    dateLabel: '02 de Enero',
    title: 'Carnavalito y Ofrenda a la Virgen de las Mercedes',
    shortSummary: 'Semillero infantil de artesanos con mini-carrozas y trajes típicos, junto a la romería a la Patrona de Pasto.',
    fullDescription: 'El semillero de nuestra tradición. Niños y niñas desfilan por la Senda del Carnaval con mini-carrozas, comparsitas, murguitas y disfraces individuales réplica de los maestros artesanos. Inicia paralelamente con la tradicional peregrinación y ofrenda floral a la Virgen de las Mercedes (La Michita Linda).',
    startLocation: 'Templo San Juan Bautista hacia Santuario Las Mercedes / Senda Normal Superior',
    finishLocation: 'Sector Champagnat / Plaza del Carnaval',
    startTime: '08:30 AM',
    estimatedArrival: '02:00 PM',
    coords: [1.2050, -77.2830],
    recommendations: [
      'Protégete y protege a los niños con protector solar y gorra.',
      'Prohibido terminantemente el juego brusco o carioca en el rostro de los menores.',
      'Acuerda un punto de encuentro visible en caso de extravío temporal.',
    ],
  },
  jan_03: {
    id: 'jan_03',
    dateKey: '03-ene',
    dateLabel: '03 de Enero',
    title: 'Día del Canto a la Tierra y Colectivos Coreográficos',
    shortSummary: 'Más de 2.000 danzantes y músicos andinos con zampoñas, quenas y bombos rindiendo tributo a la Pachamama.',
    fullDescription: 'Río sonoro y visual de respeto a la Madre Tierra (Pachamama). Decenas de colectivos coreográficos integrados por cientos de músicos y danzantes ataviados con majestuosos trajes andinos avanzan en perfecta sincronía danzando al compás de sanjuanitos, huaynos y sayas a lo largo de los 7 km de la Senda.',
    startLocation: 'Escuela Normal Superior / Estadio Libertad',
    finishLocation: 'Plaza del Carnaval y la Cultura',
    startTime: '09:00 AM',
    estimatedArrival: '04:00 PM',
    coords: [1.2050, -77.2830],
    recommendations: [
      'Día de contemplación artística: guarda el cosmético negro para el 5 de enero.',
      'Usa calzado cómodo para caminar a la par de los colectivos coreográficos.',
      'Aplaude y alienta la resistencia física y musical de los danzantes.',
    ],
  },
  jan_04: {
    id: 'jan_04',
    dateKey: '04-ene',
    dateLabel: '04 de Enero',
    title: 'Llegada de la Familia Castañeda',
    shortSummary: 'Gran estampa teatral callejera de hospitalidad campesina que rememora la comitiva forastera de 1929.',
    fullDescription: 'Apertura oficial de los días magnos del Carnaval. Conmemora la histórica bienvenida de 1929 a una familia de colonos campesinos forasteros que cruzaban por Pasto. Participan carretas tiradas por caballos, trajes de época, personajes costumbristas como el Pericles Carnaval, boticarios, novias fugitivas y familias campesinas con sus pertenencias.',
    startLocation: 'Escuela Normal Superior / Senda Champagnat',
    finishLocation: 'Avenida de los Estudiantes / Champagnat',
    startTime: '10:00 AM',
    estimatedArrival: '03:30 PM',
    coords: [1.2052, -77.2796],
    recommendations: [
      'El centro histórico y la Carrera 27 son 100% peatonales.',
      'Excelente día para saborear empanadas de añejo y pastel de queso en los asaderos del centro.',
      '¡Grita con entusiasmo: "¡Qué viva la Familia Castañeda!" al paso de las carretas.',
    ],
  },
  jan_05: {
    id: 'jan_05',
    dateKey: '05-ene',
    dateLabel: '05 de Enero',
    title: 'Día de los Negros (Juego de Caricias)',
    shortSummary: 'Conmemoración histórica de la libertad afrocolombiana mediante el juego fraterno de cosmético negro.',
    fullDescription: 'Día consagrado a la fraternidad, la memoria histórica y la igualdad en homenaje al asueto que la Corona española otorgaba a los esclavizados en 1607. Propios y forasteros nos ungimos el rostro con cosmético negro y pintura bajo el grito libertario: "¡Que vivan los Negros! ¡Una pintica por favor!". En este día las plazas son orquestas abiertas y no transitan carrozas gigantes.',
    startLocation: 'Plaza de Nariño y Plaza del Carnaval (Epicentros)',
    finishLocation: 'Calles, plazas y barrios de San Juan de Pasto',
    startTime: '08:00 AM',
    estimatedArrival: '08:00 PM',
    coords: [1.2145, -77.2780],
    recommendations: [
      'Usa ropa vieja o que no te importe impregnar de cosmético negro.',
      'Aplica crema humectante o vaselina en tu rostro antes de salir para retirar el cosmético con facilidad después.',
      'Participa con amabilidad y alegría; es un juego de cariño y respeto mutuo.',
    ],
  },
  jan_06: {
    id: 'jan_06',
    dateKey: '06-ene',
    dateLabel: '06 de Enero',
    title: 'Día de los Blancos (Desfile Magno)',
    shortSummary: 'La cúspide estética del Carnaval: majestuosas Carrozas Monumentales, comparsas, murgas, talco y carioca.',
    fullDescription: 'La manifestación artística más colosal del Carnaval de Pasto a lo largo de los 7.5 km de la Senda. Cientos de miles de espectadores admiran las majestuosas Carrozas Monumentales (hasta de 15 metros de altura con movimiento mecánico y papel maché policromado), Carrozas no motorizadas, Comparsas, Murgas de fuelles y disfraces individuales, mientras la multitud juega festivamente con cosmético blanco, talco perfumado y espuma carioca.',
    startLocation: 'Escuela Normal Superior (Partida Oficial 09:00 AM)',
    finishLocation: 'Avenida de los Estudiantes / Torobajo (Culminación)',
    startTime: '09:00 AM',
    estimatedArrival: '04:30 PM',
    coords: [1.2025, -77.2762],
    recommendations: [
      'Usa gafas protectoras y pañuelo para proteger tus ojos y vías respiratorias del talco y la carioca.',
      'Llega a la Senda muy temprano (antes de las 8:00 AM) para conseguir buena visibilidad.',
      'No toques ni lances talco directamente a las esculturas ni a los rostros de los artesanos y danzantes.',
    ],
  },
  jan_07: {
    id: 'jan_07',
    dateKey: '07-ene',
    dateLabel: '07 de Enero',
    title: 'Día del Cuy y Festival Campesino / Remate',
    shortSummary: 'Cierre gastronómico y folclórico en los corregimientos de Catambuco y Obonuco con cuy asado y música campesina.',
    fullDescription: 'Remate y despedida del Carnaval en los corregimientos rurales de Pasto (Catambuco, Obonuco, Genoy y Jongovito). Las familias se congregan en festivales gastronómicos al aire libre para degustar el tradicional cuy asado a la brasa con papas pastusas y ají de maní, amenizado con grupos de música campesina, son sureño y chicha tradicional.',
    startLocation: 'Corregimiento de Catambuco / Corregimiento de Obonuco',
    finishLocation: 'Corregimientos del Sur y Occidente de Pasto',
    startTime: '10:00 AM',
    estimatedArrival: '07:00 PM',
    coords: [1.2020, -77.2910],
    recommendations: [
      'Transporte público especial disponible desde el centro hacia Catambuco y Obonuco.',
      'Llega temprano para disfrutar del cuy recién asado en los asaderos campestres.',
      'Excelente ambiente tranquilo y familiar para concluir la fiesta magna.',
    ],
  },
};

/**
 * Searches the official daily schedule matching any user date query.
 */
export function findCarnavalScheduleByQuery(query: string): CarnavalDayEvent | null {
  if (!query) return null;
  const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (q.includes('28') && (q.includes('dic') || q.includes('inocente') || q.includes('asfalto') || q.includes('arcoiris'))) {
    return CARNAVAL_DAILY_SCHEDULE.dec_28;
  }
  if (q.includes('29') && (q.includes('dic') || q.includes('latinoamerica') || q.includes('concierto'))) {
    return CARNAVAL_DAILY_SCHEDULE.dec_29;
  }
  if (q.includes('30') && (q.includes('dic') || q.includes('serenata') || q.includes('trio'))) {
    return CARNAVAL_DAILY_SCHEDULE.dec_30;
  }
  if ((q.includes('31') && q.includes('dic')) || q.includes('ano viejo') || q.includes('anos viejos') || q.includes('viuda')) {
    return CARNAVAL_DAILY_SCHEDULE.dec_31;
  }
  if ((q.includes('2') || q.includes('dos') || q.includes('02')) && (q.includes('ene') || q.includes('carnavalito') || q.includes('mercede'))) {
    return CARNAVAL_DAILY_SCHEDULE.jan_02;
  }
  if ((q.includes('3') || q.includes('tres') || q.includes('03')) && (q.includes('ene') || q.includes('canto a la tierra') || q.includes('coreografico') || q.includes('pachamama'))) {
    return CARNAVAL_DAILY_SCHEDULE.jan_03;
  }
  if ((q.includes('4') || q.includes('cuatro') || q.includes('04')) && (q.includes('ene') || q.includes('castaneda') || q.includes('pericles'))) {
    return CARNAVAL_DAILY_SCHEDULE.jan_04;
  }
  if ((q.includes('5') || q.includes('cinco') || q.includes('05')) && (q.includes('ene') || q.includes('negro') || q.includes('cosmetico') || q.includes('pintica') || q.includes('caricia'))) {
    return CARNAVAL_DAILY_SCHEDULE.jan_05;
  }
  if ((q.includes('6') || q.includes('seis') || q.includes('06')) && (q.includes('ene') || q.includes('blanco') || q.includes('magno') || q.includes('carroza') || q.includes('desfile magno'))) {
    return CARNAVAL_DAILY_SCHEDULE.jan_06;
  }
  if ((q.includes('7') || q.includes('siete') || q.includes('07')) && (q.includes('ene') || q.includes('cuy') || q.includes('catambuco') || q.includes('obonuco') || q.includes('campesino') || q.includes('remate'))) {
    return CARNAVAL_DAILY_SCHEDULE.jan_07;
  }

  return null;
}

/**
 * Función auxiliar para buscar un hito o evento a partir del texto ingresado por el usuario.
 */
export function findCarnavalLandmark(query: string): Landmark | null {
  const q = query.toLowerCase();

  // Salud / Primeros Auxilios / Emergencias
  if (
    q.includes('salud') ||
    q.includes('primeros auxilios') ||
    q.includes('emergencia') ||
    q.includes('cruz roja') ||
    q.includes('médico') ||
    q.includes('medico') ||
    q.includes('ambulancia') ||
    q.includes('herido') ||
    q.includes('defensa civil')
  ) {
    if (q.includes('normal') || q.includes('salida') || q.includes('inicio') || q.includes('santander')) {
      return CARNAVAL_LANDMARKS.puesto_salud_normal;
    }
    return CARNAVAL_LANDMARKS.puesto_salud_plaza;
  }

  // Familia Castañeda
  if (q.includes('castañeda') || q.includes('castaneda') || q.includes('4 de enero') || q.includes('cuatro de enero')) {
    return CARNAVAL_LANDMARKS.castaneda;
  }

  // Día de Negros
  if (
    q.includes('día de negros') ||
    q.includes('dia de negros') ||
    q.includes('negros') ||
    q.includes('pintica') ||
    q.includes('cosmético') ||
    q.includes('cosmetico') ||
    q.includes('5 de enero') ||
    q.includes('cinco de enero')
  ) {
    return CARNAVAL_LANDMARKS.dia_negros;
  }

  // Desfile Magno / 6 de Enero
  if (
    q.includes('desfile magno') ||
    q.includes('magno') ||
    q.includes('6 de enero') ||
    q.includes('seis de enero') ||
    q.includes('carroza') ||
    q.includes('blancos')
  ) {
    return CARNAVAL_LANDMARKS.desfile_magno;
  }

  // Plaza de Nariño / Parque Nariño
  if (q.includes('parque nariño') || q.includes('parque narino') || q.includes('plaza de nariño') || q.includes('plaza narino')) {
    return CARNAVAL_LANDMARKS.parque_narino;
  }

  // Plaza del Carnaval
  if (q.includes('plaza del carnaval') || q.includes('plaza carnaval') || q.includes('tablado') || q.includes('concierto')) {
    return CARNAVAL_LANDMARKS.plaza_carnaval;
  }

  return null;
}

