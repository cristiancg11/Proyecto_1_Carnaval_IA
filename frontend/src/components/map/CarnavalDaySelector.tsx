import React from 'react';
import { Sparkles } from 'lucide-react';
import { useMap } from 'react-leaflet';
import { SENDA_OFICIAL_COORDS } from '../../data/sendaCoords';

export interface CarnivalDayOption {
  id: string;
  dateLabel: string;
  name: string;
  color: string;
  description: string;
  badge: string;
}

export const OFFICIAL_CARNIVAL_DATES: CarnivalDayOption[] = [
  {
    id: '03-ene',
    dateLabel: '3 Ene',
    name: 'Canto a la Tierra',
    color: '#dc2626', // Ámbar
    description: 'Recorrido completo por la Senda con trazo Ámbar',
    badge: 'Colectivos Coreográficos',
  },
  {
    id: '04-ene',
    dateLabel: '4 Ene',
    name: 'Familia Castañeda',
    color: '#be123c', // Magenta
    description: 'Recorrido completo por la Senda con trazo Magenta',
    badge: 'Estampas y Carretas',
  },
  {
    id: '05-ene',
    dateLabel: '5 Ene',
    name: 'Día de Negros',
    color: '#a8a29e', // Cyan festivo / Tablados
    description: 'Tablados y zonas de juego en Plaza del Carnaval y Plaza de Nariño',
    badge: 'Juego de Cosmético',
  },
  {
    id: '06-ene',
    dateLabel: '6 Ene',
    name: 'Desfile Magno',
    color: '#dc2626', // Rojo Carmesí
    description: 'Recorrido oficial completo con trazo Rojo Carmesí y todos los hitos',
    badge: 'Carrozas Monumentales',
  },
];

export function CarnavalDaySelector({
  selectedDay,
  onSelectDay,
}: {
  selectedDay: string;
  onSelectDay: (dayId: string) => void;
}) {
  return (
    <nav
      aria-label="Selector de días oficiales del Carnaval"
      className="pointer-events-auto flex items-center justify-center p-1.5 sm:p-2 rounded-full bg-white/95 border border-slate-200 text-slate-900 dark:bg-slate-900/85 dark:border-white/15 dark:text-white backdrop-blur-xl shadow-xl dark:shadow-2xl dark:shadow-black/60 overflow-x-auto no-scrollbar max-w-full mx-auto select-none transition-all"
    >
      <div className="flex items-center gap-1.5 sm:gap-2">
        {OFFICIAL_CARNIVAL_DATES.map((day) => {
          const isSelected = selectedDay === day.id;

          return (
            <button
              key={day.id}
              type="button"
              onClick={() => onSelectDay(day.id)}
              className={`rounded-full px-3.5 sm:px-4 py-1.5 sm:py-2 text-sm font-semibold transition-all duration-300 flex flex-col items-center justify-center cursor-pointer whitespace-nowrap min-w-[95px] sm:min-w-[120px] ${
                isSelected
                  ? 'text-white scale-105 shadow-lg ring-2 ring-white/30 font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-300 dark:hover:text-white dark:border-white/5 dark:hover:border-white/15 hover:scale-[1.02]'
              }`}
              style={
                isSelected
                  ? {
                      backgroundColor: day.color,
                      boxShadow: `0 0 24px ${day.color}90`,
                    }
                  : {}
              }
              title={`${day.dateLabel} - ${day.name}: ${day.description}`}
              aria-pressed={isSelected}
            >
              {/* Fecha principal en píldora */}
              <div className="flex items-center gap-1">
                {isSelected && <Sparkles className="w-3 h-3 text-white/90 animate-pulse" />}
                <span className="text-xs sm:text-sm font-black tracking-tight leading-tight">
                  {day.dateLabel}
                </span>
              </div>

              {/* Microcopia cultural visible */}
              <span
                className={`text-[9px] sm:text-[10px] tracking-tight leading-tight mt-0.5 truncate max-w-[90px] sm:max-w-[115px] ${
                  isSelected ? 'text-white/95 font-semibold' : 'text-slate-400 font-medium'
                }`}
              >
                {day.name}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Controlador de Leaflet que encuadra la cámara con fitBounds cada vez que cambia el día oficial
 */
export function DayCameraController({ selectedDay }: { selectedDay?: string | null }) {
  const map = useMap();

  React.useEffect(() => {
    if (!map || !selectedDay) return;
    try {
      if (typeof map.fitBounds === 'function') {
        map.fitBounds(SENDA_OFICIAL_COORDS as any, {
          padding: [50, 50],
          animate: true,
          duration: 1.2,
        });
      }
    } catch (err) {
      console.warn('Error ejecutando fitBounds en cambio de día:', err);
    }
  }, [map, selectedDay]);

  return null;
}

export default CarnavalDaySelector;
