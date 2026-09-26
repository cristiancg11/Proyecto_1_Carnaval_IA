import React from 'react';
import { Calendar, Sparkles } from 'lucide-react';
import { CARNIVAL_DAYS, CARNIVAL_ROUTES } from '../data/carnivalRoutes';

export function ScheduleBar({ selectedDay, onSelectDay }) {
  return (
    <div className="w-full max-w-full overflow-x-auto pb-1 no-scrollbar select-none">
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl sm:rounded-full bg-slate-950/85 backdrop-blur-2xl border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.65)] min-w-max">
        {/* Etiqueta / Icono de Agenda */}
        <div className="hidden sm:flex items-center gap-1.5 pl-3 pr-2 text-xs font-black tracking-wider uppercase text-amber-300">
          <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Agenda:</span>
        </div>

        {/* Pestañas horizontales de cada día */}
        {CARNIVAL_DAYS.map((day) => {
          const isActive = selectedDay === day.id;
          const routeData = CARNIVAL_ROUTES[day.id];
          const accentColor = routeData?.color || '#ec4899';

          return (
            <button
              key={day.id}
              onClick={() => onSelectDay(day.id)}
              className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold transition-all duration-200 whitespace-nowrap active:scale-95 ${
                isActive
                  ? 'text-white shadow-lg ring-1 ring-white/30 scale-[1.03]'
                  : 'text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.06] hover:border-white/20'
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
                className={`hidden md:inline-block text-[10px] font-semibold px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-black/25 text-white' : 'text-slate-400'
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
