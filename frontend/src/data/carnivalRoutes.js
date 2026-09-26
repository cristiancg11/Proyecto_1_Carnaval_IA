/**
 * Base de datos geográfica oficial de eventos, rutas y cierres viales
 * por día del Carnaval de Negros y Blancos de San Juan de Pasto.
 */

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
    color: "#ec4899", // Rosa
    closedPoints: [
      { lat: 1.2118, lng: -77.2798, label: "Cra 23 entre Calles 14 y 15 (El Colorado)" },
      { lat: 1.2135, lng: -77.2790, label: "Calle 16 entre Cra 23 y Cra 27" }
    ],
    route: [
      [1.2110, -77.2805],
      [1.2125, -77.2795],
      [1.2138, -77.2785]
    ]
  },

  '31-dic': {
    name: "Desfile de Años Viejos y Viudas",
    hours: "08:00 - 16:00",
    description: "Humor, sátira política y quema de monigotes.",
    color: "#f59e0b", // Ámbar
    startPoint: { lat: 1.2012, lng: -77.2748, label: "Salida: Escuela Normal Superior / Transversal del Caracha" },
    endPoint: { lat: 1.2225, lng: -77.2862, label: "Llegada: Sector Champagnat (IEM Ciudad de Pasto)" },
    closedPoints: [
      { lat: 1.2012, lng: -77.2748, label: "Bloqueo Caracha / Cra 27" },
      { lat: 1.2142, lng: -77.2780, label: "Cierre Calle 19 y acceso Plaza de Nariño" },
      { lat: 1.2225, lng: -77.2862, label: "Desconcentración Champagnat" }
    ],
    route: [
      [1.2012, -77.2748], // Normal Superior
      [1.2085, -77.2762], // Cra 27 subiendo
      [1.2115, -77.2772], // Cra 27 con Cll 16
      [1.2140, -77.2780], // Giro en Cll 19 (Plaza Nariño)
      [1.2180, -77.2825], // Cll 19 bajando
      [1.2225, -77.2862]  // Champagnat
    ]
  },

  '02-ene': {
    name: "Carnavalito y Ofrenda a la Virgen de las Mercedes",
    hours: "07:00 - 14:00",
    description: "Desfile infantil con mini-carrozas y comparsas tradicionales.",
    color: "#06b6d4", // Cyan
    startPoint: { lat: 1.2012, lng: -77.2748, label: "Salida: Escuela Normal Superior" },
    endPoint: { lat: 1.2225, lng: -77.2862, label: "Llegada: Sector Champagnat" },
    closedPoints: [
      { lat: 1.2012, lng: -77.2748, label: "Cierre Cra 27 sur-norte" },
      { lat: 1.2142, lng: -77.2780, label: "Cierre Calle 19 (Plaza Nariño)" }
    ],
    route: [
      [1.2012, -77.2748],
      [1.2085, -77.2762],
      [1.2140, -77.2780],
      [1.2180, -77.2825],
      [1.2225, -77.2862]
    ]
  },

  '03-ene': {
    name: "Canto a la Tierra (Colectivos Coreográficos)",
    hours: "09:00 - 16:00",
    description: "Miles de músicos y danzantes andinos con zampoñas y bombos.",
    color: "#10b981", // Verde
    startPoint: { lat: 1.2012, lng: -77.2748, label: "Salida: Escuela Normal Superior" },
    endPoint: { lat: 1.2225, lng: -77.2862, label: "Llegada: Champagnat" },
    closedPoints: [
      { lat: 1.2012, lng: -77.2748, label: "Cierre total Carrera 27" },
      { lat: 1.2140, lng: -77.2780, label: "Cierre Calle 19" },
      { lat: 1.2260, lng: -77.2880, label: "Restricción cruces Av. Los Estudiantes" }
    ],
    route: [
      [1.2012, -77.2748],
      [1.2085, -77.2762],
      [1.2140, -77.2780],
      [1.2180, -77.2825],
      [1.2225, -77.2862]
    ]
  },

  '04-ene': {
    name: "Llegada de la Familia Castañeda",
    hours: "08:00 - 15:00",
    description: "Teatro callejero y estampas de época recreando la bienvenida campesina de 1929.",
    color: "#8b5cf6", // Violeta
    startPoint: { lat: 1.2012, lng: -77.2748, label: "Salida: Normal Superior" },
    endPoint: { lat: 1.2225, lng: -77.2862, label: "Llegada: Champagnat" },
    closedPoints: [
      { lat: 1.2012, lng: -77.2748, label: "Cierre Cra 27" },
      { lat: 1.2140, lng: -77.2780, label: "Cierre Calle 19 y Plaza de Nariño" }
    ],
    route: [
      [1.2012, -77.2748],
      [1.2085, -77.2762],
      [1.2140, -77.2780],
      [1.2180, -77.2825],
      [1.2225, -77.2862]
    ]
  },

  '05-ene': {
    name: "Día de Negros (Juego de la Pintica)",
    hours: "11:00 - 23:00",
    description: "Conmemoración de la igualdad étnica, juego con cosmético negro y orquestas en plazas.",
    color: "#334155", // Pizarra oscuro
    closedPoints: [
      { lat: 1.2115, lng: -77.2785, label: "Peatonalización Plaza del Carnaval" },
      { lat: 1.2145, lng: -77.2782, label: "Peatonalización Plaza de Nariño" },
      { lat: 1.2090, lng: -77.2765, label: "Zona de Graderías controladas (San Juan Bosco)" }
    ],
    route: [] // No hay desfile con carrozas, las plazas son peatonales
  },

  '06-ene': {
    name: "Día de Blancos (El Desfile Magno)",
    hours: "05:00 - 17:00",
    description: "Paso de Carrozas Monumentales gigantes de 12 metros, murgas, comparsas, talco y carioca.",
    color: "#dc2626", // Rojo festivo
    startPoint: { lat: 1.2185, lng: -77.2970, label: "Salida: Avenida Emmanuel (Tamasagra / Anganoy)" },
    endPoint: { lat: 1.2045, lng: -77.2680, label: "Llegada: Avenida Alfonso Zambrano (Estadio Libertad)" },
    closedPoints: [
      { lat: 1.2185, lng: -77.2970, label: "Cierre Av. Emmanuel desde las 5:00 AM" },
      { lat: 1.2155, lng: -77.2910, label: "Cierre Avenida Mijitayo" },
      { lat: 1.2120, lng: -77.2840, label: "Corte cruce Av. Panamericana" },
      { lat: 1.2085, lng: -77.2762, label: "Cierre Carrera 27" },
      { lat: 1.2140, lng: -77.2780, label: "Cierre Calle 19" },
      { lat: 1.2045, lng: -77.2680, label: "Cierre Av. Alfonso Zambrano" }
    ],
    route: [
      [1.2185, -77.2970], // Av. Emmanuel
      [1.2155, -77.2910], // Mijitayo
      [1.2120, -77.2840], // Panamericana
      [1.2085, -77.2762], // Cra 27
      [1.2140, -77.2780], // Cll 19
      [1.2100, -77.2730], // Hacia el oriente
      [1.2045, -77.2680]  // Alfonso Zambrano / Estadio Libertad
    ]
  },

  '07-ene': {
    name: "Festival del Cuy y la Cultura Campesina",
    hours: "09:00 - 17:00",
    description: "Gastronomía tradicional andina y música campesina en corregimientos.",
    color: "#ea580c", // Naranja
    closedPoints: [
      { lat: 1.1850, lng: -77.2950, label: "Cierre plaza corregimiento de Obonuco" },
      { lat: 1.1680, lng: -77.2750, label: "Cierre plaza corregimiento de Catambuco" }
    ],
    route: [] // Rutas rurales despejadas en el casco urbano
  }
};
