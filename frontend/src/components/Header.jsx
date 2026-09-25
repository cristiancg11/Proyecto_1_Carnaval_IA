import React from 'react';
import { Bot, Sparkles, Activity, PlusCircle, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Header({
  isServerHealthy,
  onOpenChat,
  onOpenReportModal,
  onOpenAuth,
  chatOpen,
  reportsCount = 0,
  zonesCount = 0,
}) {
  const { user, isAuthenticated, logout } = useAuth();
  return (
    <header className="sticky top-0 z-30 w-full bg-slate-950/75 backdrop-blur-2xl border-b border-white/[0.08] px-4 lg:px-6 py-3 transition-all shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Marca y Título con estética 2026 */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-fuchsia-600 to-violet-600 shadow-[0_0_20px_rgba(217,70,239,0.45)] border border-white/20 text-white font-black text-xl">
            🎭
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg lg:text-xl font-black tracking-tight bg-gradient-to-r from-amber-400 via-rose-300 to-purple-400 bg-clip-text text-transparent">
                CarnavalIA
              </h1>
              <span className="hidden sm:inline-block px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.2)]">
                Pasto 2026
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">
              Sistema Inteligente • Carnaval de Negros y Blancos (UNESCO)
            </p>
          </div>
        </div>

        {/* Acciones principales y estado del sistema */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Indicador de estado del servidor en píldora de cristal */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
              isServerHealthy
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
            }`}
            title={isServerHealthy ? 'Servidor API en línea y conectado a Supabase' : 'Conexión con el servidor no disponible'}
          >
            <Activity className={`w-3.5 h-3.5 ${isServerHealthy ? 'animate-pulse text-emerald-400' : 'text-rose-400'}`} />
            <span className="hidden sm:inline">
              {isServerHealthy ? 'API Online' : 'Desconectado'}
            </span>
          </div>

          {/* Botón moderno de Cristal para reportar incidencia */}
          <button
            onClick={() => onOpenReportModal()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-slate-200 hover:text-white bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 hover:border-white/25 backdrop-blur-md shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
            title="Crear un nuevo reporte de incidencia"
          >
            <PlusCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="hidden sm:inline">Reportar</span>
          </button>

          {/* Botón Asistente IA con gradiente vibrante y halo de resplandor */}
          <button
            onClick={onOpenChat}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-xs font-extrabold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${
              chatOpen
                ? 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-600 text-white shadow-[0_0_25px_rgba(217,70,239,0.6)] ring-2 ring-white/30'
                : 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-amber-500 hover:from-violet-500 hover:via-fuchsia-500 hover:to-amber-400 text-white shadow-[0_0_22px_rgba(217,70,239,0.45)] hover:shadow-[0_0_30px_rgba(217,70,239,0.7)]'
            }`}
          >
            <Bot className="w-4 h-4 animate-bounce" />
            <span>Asistente IA</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-300 hidden sm:inline" />
          </button>

          {/* Separador de cristal sutil */}
          <div className="h-6 w-px bg-white/10 hidden sm:block"></div>

          {/* Sección de Autenticación */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              {/* Badge de usuario autenticado en píldora translúcida */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/10 shadow-sm"
                title={`Sesión iniciada como: ${user?.name} (${user?.email})`}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 flex items-center justify-center text-[11px] font-black text-white shadow-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="text-xs font-bold text-slate-200 max-w-[100px] sm:max-w-[130px] truncate">
                  {user?.name || user?.email}
                </span>
              </div>

              {/* Botón Cerrar Sesión */}
              <button
                onClick={logout}
                className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-full text-xs font-semibold text-slate-400 hover:text-rose-300 hover:bg-rose-500/15 border border-transparent hover:border-rose-500/30 transition-all duration-200 active:scale-95"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Salir</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => onOpenAuth && onOpenAuth('login')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-rose-600 hover:from-violet-500 hover:to-rose-500 shadow-md shadow-rose-500/20 transition-all duration-200 active:scale-95"
              title="Iniciar sesión o registrarse"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-300" />
              <span>Iniciar Sesión</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;

