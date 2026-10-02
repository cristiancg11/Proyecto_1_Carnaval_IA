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
    <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-slate-900/75 border-b border-white/10 px-4 lg:px-6 py-3 transition-all shadow-lg shadow-black/40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Marca y Título con estética del Centenario */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-500 to-violet-600 shadow-lg shadow-pink-500/25 border border-white/20 text-white font-black text-xl">
            🎭
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg lg:text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-500 to-cyan-400">
                CarnavalIA
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full centenary-badge text-amber-300">
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                <span>Centenario 1927 - 2027</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-300 hidden md:block">
              Carnaval de Negros y Blancos • Patrimonio de la Humanidad
            </p>
          </div>
        </div>

        {/* Acciones principales y estado del sistema */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Indicador de estado del servidor en píldora de cristal */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
              isServerHealthy
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
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
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-slate-200 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 hover:border-amber-400/40 backdrop-blur-md shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
            title="Crear un nuevo reporte de incidencia"
          >
            <PlusCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="hidden sm:inline">Reportar</span>
          </button>

          {/* Botón Asistente IA con gradiente vibrante y halo de resplandor */}
          <button
            onClick={onOpenChat}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
              chatOpen
                ? 'bg-gradient-to-r from-violet-600 via-rose-500 to-amber-500 text-white shadow-lg shadow-pink-500/30 ring-2 ring-white/30'
                : 'bg-gradient-to-r from-amber-500 via-pink-500 to-cyan-500 hover:from-amber-600 hover:via-pink-600 hover:to-cyan-600 text-white shadow-md hover:shadow-pink-500/40'
            }`}
          >
            <Bot className="w-4 h-4 animate-bounce" />
            <span>Asistente IA</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-200 hidden sm:inline" />
          </button>

          {/* Separador de cristal sutil */}
          <div className="h-6 w-px bg-white/10 hidden sm:block"></div>

          {/* Sección de Autenticación */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              {/* Badge de usuario autenticado en píldora translúcida */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-white/10 shadow-sm"
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
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r from-amber-500 via-pink-500 to-cyan-500 hover:from-amber-600 hover:via-pink-600 hover:to-cyan-600 shadow-md shadow-pink-500/20 transition-all duration-200 active:scale-95"
              title="Iniciar sesión o registrarse"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-200" />
              <span>Iniciar Sesión</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;

