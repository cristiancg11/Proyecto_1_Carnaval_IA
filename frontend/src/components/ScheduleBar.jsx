import React from 'react';
import { Calendar, Sparkles } from 'lucide-react';
import { CARNIVAL_DAYS, CARNIVAL_ROUTES } from '../data/carnivalRoutes';

export function ScheduleBar({ selectedDay, onSelectDay }) {
  return (
    <div className="w-full max-w-full overflow-x-auto pb-1 no-scrollbar select-none">
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl sm:rounded-full bg-slate-900/90 backdrop-blur-2xl border border-cyan-500/20 shadow-[0_12px_36px_rgba(0,0,0,0.65)] min-w-max">
        {/* Etiqueta / Icono de Agenda */}
        <div className="hidden sm:flex items-center gap-1.5 pl-3 pr-2 text-xs font-black tracking-wider uppercase text-cyan-300">
          <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Agenda:</span>
        </div>

        {/* Pestañas horizontales de cada día */}
        {CARNIVAL_DAYS.map((day) => {
          const isActive = selectedDay === day.id;
          const routeData = CARNIVAL_ROUTES[day.id];
          const accentColor = routeData?.color || '#06b6d4';

          return (
            <button
              key={day.id}
              onClick={() => onSelectDay(day.id)}
              className={`group relative flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-black transition-all duration-200 whitespace-nowrap active:scale-95 cursor-pointer ${
                isActive
                  ? 'text-white shadow-xl ring-2 ring-white/40 scale-[1.03]'
                  : 'text-slate-200 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 border border-white/10 hover:border-cyan-400/40'
              }`}
              style={
                isActive
                  ? {
                      backgroundColor: accentColor,
                      boxShadow: `0 0 20px ${accentColor}80`,
                    }
                  : {}
              }
              title={`${day.label}: ${routeData?.name || ''}`}
            >
              <span>{day.label}</span>
              <span
                className={`hidden md:inline-block text-[11px] font-extrabold px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-black/30 text-white' : 'text-slate-400'
                }`}
              >
                {day.shortName}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ScheduleBar;
