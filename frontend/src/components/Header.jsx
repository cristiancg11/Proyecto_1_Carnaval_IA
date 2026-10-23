import React from 'react';
import { Map, Calendar, ShieldAlert, Plus, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Header({
  activeView = 'senda',
  onSelectSenda,
  onOpenCalendar,
  onOpenReports,
  onOpenReportModal,
  reportsCount = 0,
  onOpenAuth,
}) {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 w-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 px-4 sm:px-6 py-2.5 transition-all shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* 1. Logotipo e identidad visual ("CarnavalIA") */}
        <div
          onClick={onSelectSenda}
          className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
          title="CarnavalIA - Sistema Inteligente del Carnaval de Pasto"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20 text-xl group-hover:scale-105 transition-transform">
            🎭
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Carnaval<span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">IA</span>
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
              San Juan de Pasto • Centenario
            </p>
          </div>
        </div>

        {/* 2. Enlaces directos de navegación principal */}
        <nav aria-label="Navegación principal" className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
          {/* Pestaña: Senda del Carnaval */}
          <button
            type="button"
            onClick={onSelectSenda}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
              activeView === 'senda'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
            title="Ver mapa de la Senda del Carnaval"
          >
            <Map className="w-4 h-4 shrink-0" />
            <span>Senda del Carnaval</span>
          </button>

          {/* Pestaña: Calendario de Eventos */}
          <button
            type="button"
            onClick={onOpenCalendar}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
              activeView === 'calendario'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
            title="Abrir programación y calendario oficial"
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span>Calendario de Eventos</span>
          </button>

          {/* Pestaña: Reportes Ciudadanos */}
          <button
            type="button"
            onClick={onOpenReports}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
              activeView === 'reportes'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
            title="Ver incidencias y reportes ciudadanos"
          >
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Reportes Ciudadanos</span>
            {reportsCount > 0 && (
              <span className={`px-1.5 py-0.2 text-[10px] font-black rounded-full ${
                activeView === 'reportes' ? 'bg-white/25 text-white' : 'bg-amber-500/20 text-amber-500'
              }`}>
                {reportsCount}
              </span>
            )}
          </button>
        </nav>

        {/* 3. CTA Destacado + Autenticación */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Botón CTA Destacado: + Reportar Incidente */}
          <button
            type="button"
            onClick={onOpenReportModal}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:via-orange-400 hover:to-rose-400 shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 cursor-pointer"
            title="Crear un reporte rápido de incidencia en la senda"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden xs:inline sm:inline">Reportar Incidente</span>
          </button>

          {/* Sección de Usuario / Sesión */}
          {isAuthenticated ? (
            <div className="flex items-center gap-1.5">
              {/* Avatar Pill */}
              <div
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 shadow-sm select-none"
                title={`Sesión iniciada: ${user?.name || user?.email}`}
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-[11px] font-black text-white shadow-sm shrink-0">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[80px] sm:max-w-[120px] truncate hidden md:inline">
                  {user?.name || user?.email?.split('@')[0]}
                </span>
              </div>

              {/* Botón Salir */}
              <button
                type="button"
                onClick={logout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition cursor-pointer flex items-center"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onOpenAuth && onOpenAuth('login')}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10 shadow-sm transition active:scale-95 cursor-pointer"
              title="Iniciar sesión"
            >
              <LogIn className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">Iniciar Sesión</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
