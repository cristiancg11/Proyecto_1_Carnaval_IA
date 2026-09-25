import React from 'react';
import { Bot, Sparkles, Activity, ShieldAlert, PlusCircle } from 'lucide-react';

export function Header({
  isServerHealthy,
  onOpenChat,
  onOpenReportModal,
  chatOpen,
  reportsCount = 0,
  zonesCount = 0,
}) {
  return (
    <header className="sticky top-0 z-30 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-6 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Marca y Título */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-lg shadow-rose-500/20 text-white font-bold text-xl">
            🎭
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg lg:text-xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 via-rose-300 to-purple-400 bg-clip-text text-transparent">
                CarnavalIA
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-semibold tracking-wider uppercase rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
                Pasto 2026
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden md:block">
              Sistema Inteligente • Carnaval de Negros y Blancos de Pasto (UNESCO)
            </p>
          </div>
        </div>

        {/* Estadísticas rápidas y estado del servidor */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Indicador de estado del servidor */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isServerHealthy
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}
            title={isServerHealthy ? 'Servidor API en línea y conectado a Supabase' : 'Conexión con el servidor no disponible'}
          >
            <Activity className={`w-3.5 h-3.5 ${isServerHealthy ? 'animate-pulse' : ''}`} />
            <span className="hidden sm:inline">
              {isServerHealthy ? 'API Online' : 'Desconectado'}
            </span>
          </div>

          {/* Botón para reportar incidencia */}
          <button
            onClick={() => onOpenReportModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 hover:border-slate-600 transition shadow-sm active:scale-95"
            title="Crear un nuevo reporte de incidencia"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Reportar</span>
          </button>

          {/* Botón para abrir el Chatbot IA */}
          <button
            onClick={onOpenChat}
            className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-lg active:scale-95 ${
              chatOpen
                ? 'bg-gradient-to-r from-purple-600 to-rose-600 text-white shadow-purple-500/25 ring-2 ring-purple-400/40'
                : 'bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white shadow-rose-500/20 hover:shadow-rose-500/30'
            }`}
          >
            <Bot className="w-4 h-4 animate-bounce" />
            <span>Asistente IA</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-300 hidden sm:inline" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
