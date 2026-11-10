/**
 * Base de datos geográfica oficial de eventos, rutas y cierres viales
 * por día del Carnaval de Negros y Blancos de San Juan de Pasto.
 */

// Trazado de la Senda del Carnaval (vaciado para evitar trazados diagonales obsoletos)
export const SENDA_OFICIAL_COORDS = [];

export const HITOS_SENDA = [
  { id: 'salida', nombre: 'PUNTO DE SALIDA: I.E. Normal Superior', coords: [1.2030, -77.2798], tipo: 'inicio', desc: 'Concentración de carrozas gigantes, murgas y comparsas.' },
  { id: 'narino', nombre: 'HITO HISTÓRICO: Plaza de Nariño', coords: [1.2165, -77.2806], tipo: 'intermedio', desc: 'Paso por el centro de la ciudad y tarimas de transmisión.' },
  { id: 'plaza_carnaval', nombre: 'EPICENTRO: Plaza del Carnaval', coords: [1.2138, -77.2782], tipo: 'intermedio', desc: 'Tarima principal de jurados y graderías.' },
  { id: 'llegada', nombre: 'PUNTO DE LLEGADA: Champagnat / Bomboná', coords: [1.2265, -77.2856], tipo: 'fin', desc: 'Desmonte y finalización oficial del desfile.' }
];

export const SENDA_CARNAVAL_COORDS = SENDA_OFICIAL_COORDS;
export const SENDA_DEL_CARNAVAL_COORDS = SENDA_OFICIAL_COORDS;

export const CARNIVAL_DAYS = [
  { id: '28-dic', label: '28 Dic', shortName: 'Arcoíris Asfalto' },
  { id: '31-dic', label: '31 Dic', shortName: 'Años Viejos' },
  { id: '02-ene', label: '02 Ene', shortName: 'Carnavalito' },
  { id: '03-ene', label: '03 Ene', shortName: 'Canto a la Tierra' },
  { id: '04-ene', label: '04 Ene', shortName: 'Flia Castañeda' },
  { id: '05-ene', label: '05 Ene', shortName: 'Día de Negros' },
  { id: '06-ene', label: '06 Ene', shortName: 'Desfile Magno' },
  { id: '07-ene', label: '07 Ene', shortName: 'Festival del Cuy' },
];

export const CARNIVAL_ROUTES = {
  '28-dic': {
    name: "Arcoíris en el Asfalto (Pre-Carnaval)",
    hours: "08:00 - 18:00",
    description: "Pintura artística con tiza en el asfalto. Zona peatonal cultural.",
    color: "#be123c", // Rosa
    closedPoints: [
      { lat: 1.2118, lng: -77.2798, label: "Cra 23 entre Calles 14 y 15 (El Colorado)" },
      { lat: 1.2135, lng: -77.2790, label: "Calle 16 entre Cra 23 y Cra 27" }
    ],
    route: []
  },

  '31-dic': {
    name: "Desfile de Años Viejos y Viudas",
    hours: "08:00 - 16:00",
    description: "Humor, sátira política y quema de monigotes.",
    color: "#dc2626", // Ámbar
    startPoint: { lat: 1.212641, lng: -77.285765, label: "Salida: Av. Carrera 27 - Normal Superior" },
    endPoint: { lat: 1.198369, lng: -77.276805, label: "Llegada: Estadio Libertad" },
    closedPoints: [
      { lat: 1.212641, lng: -77.285765, label: "Bloqueo Av. Carrera 27 (Normal Superior)" },
      { lat: 1.216975, lng: -77.278810, label: "Cierre Av. Carrera 27 con Calle 19" },
      { lat: 1.198369, lng: -77.276805, label: "Desconcentración Estadio Libertad" }
    ],
    route: []
  },

  '02-ene': {
    name: "Carnavalito y Ofrenda a la Virgen de las Mercedes",
    hours: "07:00 - 14:00",
    description: "Desfile infantil con mini-carrozas y comparsas tradicionales.",
    color: "#a8a29e", // Cyan
    startPoint: { lat: 1.212641, lng: -77.285765, label: "Salida: Av. Carrera 27 - Normal Superior" },
    endPoint: { lat: 1.198369, lng: -77.276805, label: "Llegada: Estadio Libertad" },
    closedPoints: [
      { lat: 1.212641, lng: -77.285765, label: "Cierre Av. Carrera 27 (Normal Superior)" },
      { lat: 1.210869, lng: -77.276168, label: "Cierre Calle 19 (Plaza del Carnaval)" }
    ],
    route: []
  },

  '03-ene': {
    name: "Canto a la Tierra (Colectivos Coreográficos)",
    hours: "09:00 - 16:00",
    description: "Recorrido completo por la Senda con trazo Ámbar. Miles de músicos y danzantes andinos.",
    color: "#dc2626", // Ámbar oficial
    startPoint: { lat: 1.212641, lng: -77.285765, label: "Salida Oficial: Av. Carrera 27 - Normal Superior" },
    endPoint: { lat: 1.198369, lng: -77.276805, label: "Llegada Oficial: Estadio Libertad" },
    closedPoints: [
      { lat: 1.212641, lng: -77.285765, label: "Cierre Salida Av. Carrera 27 (Normal Superior)" },
      { lat: 1.216975, lng: -77.278810, label: "Cierre Av. Carrera 27 con Calle 19" },
      { lat: 1.210869, lng: -77.276168, label: "Cierre Plaza del Carnaval (Calle 19)" }
    ],
    route: []
  },

  '04-ene': {
    name: "Llegada de la Familia Castañeda",
    hours: "08:00 - 15:00",
    description: "Recorrido completo por la Senda con trazo Magenta. Estampas de época y bienvenida campesina de 1929.",
    color: "#dc2626", // Magenta oficial
    startPoint: { lat: 1.212641, lng: -77.285765, label: "Salida Oficial: Av. Carrera 27 - Normal Superior" },
    endPoint: { lat: 1.198369, lng: -77.276805, label: "Llegada Oficial: Estadio Libertad" },
    closedPoints: [
      { lat: 1.212641, lng: -77.285765, label: "Cierre Av. Carrera 27 (Normal Superior)" },
      { lat: 1.204136, lng: -77.275366, label: "Cierre Calle 18 con Av. Champagnat" }
    ],
    route: []
  },

  '05-ene': {
    name: "Día de Negros (Juego de la Pintica y Tablados)",
    hours: "11:00 - 23:00",
    description: "Tablados y zonas de juego en Plaza del Carnaval y Plaza de Nariño. Conmemoración de la igualdad étnica.",
    color: "#a8a29e", // Cyan festivo / Tablados
    startPoint: { lat: 1.21461, lng: -77.27829, label: "Tablado Principal: Plaza de Nariño" },
    endPoint: { lat: 1.21056, lng: -77.27655, label: "Tablado Oficial: Plaza del Carnaval" },
    closedPoints: [
      { lat: 1.21056, lng: -77.27655, label: "Peatonalización Plaza del Carnaval" },
      { lat: 1.21461, lng: -77.27829, label: "Peatonalización Plaza de Nariño" },
      { lat: 1.213547, lng: -77.277321, label: "Zona Peatonal Calle 19" }
    ],
    route: []
  },

  '06-ene': {
    name: "Día de Blancos (El Desfile Magno)",
    hours: "05:00 - 17:00",
    description: "Recorrido oficial completo con trazo Rojo Carmesí y todos los hitos visibles. Carrozas Monumentales.",
    color: "#dc2626", // Rojo Carmesí oficial
    startPoint: { lat: 1.212641, lng: -77.285765, label: "Salida Oficial: Av. Carrera 27 - I.E. Normal Superior" },
    endPoint: { lat: 1.198369, lng: -77.276805, label: "Llegada Oficial: Estadio Libertad" },
    closedPoints: [
      { lat: 1.212641, lng: -77.285765, label: "Cierre Total Salida Av. Carrera 27 (Normal Superior)" },
      { lat: 1.216975, lng: -77.278810, label: "Cierre Total Av. Carrera 27 con Calle 19" },
      { lat: 1.210869, lng: -77.276168, label: "Cierre Total Plaza del Carnaval (Calle 19)" },
      { lat: 1.204136, lng: -77.275366, label: "Cierre Total Calle 18 con Av. Champagnat" },
      { lat: 1.198369, lng: -77.276805, label: "Desmonte y Cierre Estadio Libertad" }
    ],
    route: []
  },

  '07-ene': {
    name: "Festival del Cuy y la Cultura Campesina",
    hours: "09:00 - 17:00",
    description: "Gastronomía tradicional andina y música campesina en corregimientos.",
    color: "#dc2626", // Carmín
    startPoint: { lat: 1.2145, lng: -77.2782, label: "Punto de Encuentro: Plaza de Nariño" },
    endPoint: { lat: 1.1850, lng: -77.2950, label: "Destino Festivo: Corregimiento de Obonuco" },
    closedPoints: [
      { lat: 1.1850, lng: -77.2950, label: "Cierre plaza corregimiento de Obonuco" },
      { lat: 1.1680, lng: -77.2750, label: "Cierre plaza corregimiento de Catambuco" }
    ],
    route: [
      [1.2145, -77.2782], // Plaza de Nariño
      [1.2050, -77.2850], // Salida al sur
      [1.1950, -77.2900], // Vía a Obonuco
      [1.1850, -77.2950]  // Plaza de Obonuco
    ]
  }
};
