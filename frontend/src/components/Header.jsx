import React from 'react';
import { Map, Calendar, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Header({
  activeView = 'senda',
  onSelectSenda,
  onOpenCalendar,
  onOpenAuth,
}) {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-slate-900/90 border-b border-white/10 px-4 sm:px-6 py-3 transition-all shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* 1. Logotipo e identidad visual ("CarnavalIA") */}
        <div
          onClick={onSelectSenda}
          className="flex items-center gap-3 cursor-pointer group select-none"
          title="CarnavalIA - Senda del Carnaval de Pasto"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-slate-800/80 border border-white/10 shadow-sm text-xl group-hover:scale-105 transition-transform">
            🎭
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg sm:text-xl font-black tracking-tight text-white">
                Carnaval<span className="text-amber-400">IA</span>
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium hidden sm:block">
              San Juan de Pasto • Centenario
            </p>
          </div>
        </div>

        {/* 2. Enlaces directos de navegación principal */}
        <nav aria-label="Navegación principal" className="flex items-center gap-1 sm:gap-2">
          {/* Enlace: Senda del Carnaval (Mapa) */}
          <button
            type="button"
            onClick={onSelectSenda}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
              activeView === 'senda'
                ? 'bg-slate-800 text-white border border-white/10 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Ver mapa de la Senda del Carnaval"
          >
            <Map className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Senda del Carnaval</span>
          </button>

          {/* Enlace: Calendario de Eventos */}
          <button
            type="button"
            onClick={onOpenCalendar}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
              activeView === 'calendario'
                ? 'bg-slate-800 text-white border border-white/10 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Abrir programación y calendario de eventos"
          >
            <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Calendario de Eventos</span>
          </button>
        </nav>

        {/* 3. Botón de autenticación (Iniciar Sesión / Perfil con avatar) */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Perfil con avatar */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-800/80 border border-white/10 shadow-sm select-none"
                title={`Sesión iniciada: ${user?.name || user?.email}`}
              >
                <div className="w-6 h-6 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-[11px] font-black text-white shadow-sm shrink-0">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="text-xs font-semibold text-slate-200 max-w-[90px] sm:max-w-[130px] truncate hidden sm:inline">
                  {user?.name || user?.email?.split('@')[0]}
                </span>
              </div>

              {/* Botón Salir */}
              <button
                type="button"
                onClick={logout}
                className="p-2 sm:px-3 sm:py-1.5 rounded-2xl text-xs font-semibold text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all duration-200 cursor-pointer flex items-center gap-1.5"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Salir</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onOpenAuth && onOpenAuth('login')}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold text-white bg-slate-800 hover:bg-slate-700 border border-white/10 shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
              title="Iniciar sesión"
            >
              <LogIn className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Iniciar Sesión</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
