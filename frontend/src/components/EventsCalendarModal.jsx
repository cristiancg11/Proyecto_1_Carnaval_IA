import React from 'react';
import { X, Calendar, Clock, MapPin, Sparkles, ChevronRight, AlertCircle, ArrowUpRight } from 'lucide-react';
import { CARNIVAL_DAYS, CARNIVAL_ROUTES } from '../data/carnivalRoutes';

export function EventsCalendarModal({
  isOpen,
  onClose,
  selectedDay,
  onSelectDay,
}) {
  if (!isOpen) return null;

  const handleSelectEvent = (dayId) => {
    onSelectDay(dayId);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendar-modal-title"
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Fondo difuminado oscuro */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity duration-200 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Contenedor Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Encabezado */}
        <header className="px-6 py-5 border-b border-white/10 flex items-center justify-between gap-4 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-slate-800/80 border border-white/10 text-amber-400 shadow-sm">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="calendar-modal-title" className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Calendario de Eventos
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  <Sparkles className="w-2.5 h-2.5" />
                  Pasto 2026
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Programación oficial del Carnaval de Negros y Blancos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            aria-label="Cerrar calendario"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Lista de Eventos */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {CARNIVAL_DAYS.map((day) => {
              const event = CARNIVAL_ROUTES[day.id];
              const isSelected = selectedDay === day.id;

              return (
                <div
                  key={day.id}
                  onClick={() => handleSelectEvent(day.id)}
                  className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-800/90 border-amber-500/40 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40'
                      : 'bg-slate-950/40 hover:bg-slate-800/50 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div>
                    {/* Fila superior: Fecha y Horario */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: event?.color || '#06b6d4' }}
                        />
                        <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                          {day.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{event?.hours}</span>
                      </div>
                    </div>

                    {/* Título */}
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors leading-snug">
                      {event?.name}
                    </h3>

                    {/* Descripción */}
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                      {event?.description}
                    </p>
                  </div>

                  {/* Fila inferior: Estado de Vía y Botón de Acción */}
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      {event?.closedPoints && event.closedPoints.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-rose-300 font-medium">
                          <span>⛔</span>
                          <span>{event.closedPoints.length} cierres viales</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-300 font-medium">
                          <span>✅</span>
                          <span>Vías habilitadas</span>
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectEvent(day.id);
                      }}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                          : 'bg-white/5 group-hover:bg-amber-500/20 text-slate-300 group-hover:text-amber-300 border border-white/10'
                      }`}
                    >
                      <span>{isSelected ? 'Viendo en la Senda' : 'Ver en la Senda'}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pie de modal */}
        <footer className="px-6 py-3.5 border-t border-white/10 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Selecciona cualquier evento para ubicar su recorrido en el mapa</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition cursor-pointer"
          >
            Cerrar
          </button>
        </footer>
      </div>
    </div>
  );
}

export default EventsCalendarModal;
