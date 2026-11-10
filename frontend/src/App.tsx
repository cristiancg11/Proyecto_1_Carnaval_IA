import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from './components/layout/Navbar';
import Header from './components/Header';
import MapView from './components/MapView';
import ReportModal from './components/ReportModal';
import CitizenReportsModal from './components/CitizenReportsModal';
import EventsCalendarModal from './components/EventsCalendarModal';
import ChatBot from './components/ChatBot';
import GuanenaChat from './components/GuanenaChat';
import InstallPwaPrompt from './components/InstallPwaPrompt';
import LoginView from './components/LoginView';
import Toast from './components/Toast';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { api } from './services/api';
import { fetchActiveReports, submitIncidentReport } from './services/reportService';
import { useAuth } from './context/AuthContext';
import { RefreshCw, ShieldAlert, MapPin, Crosshair } from 'lucide-react';
import { useRealtimeLocation } from './hooks/useRealtimeLocation';

export function App() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Auditar estrictamente el estado de autenticación desde localStorage con manejo seguro de excepciones
  const [isSessionActive, setIsSessionActive] = useState<boolean>(() => {
    try {
      return Boolean(
        typeof window !== 'undefined' &&
        localStorage.getItem('carnavalia_session') === 'active'
      );
    } catch (e) {
      console.warn('Error leyendo carnavalia_session en inicialización:', e);
      return false;
    }
  });

  useEffect(() => {
    try {
      const active = Boolean(
        isAuthenticated &&
        typeof window !== 'undefined' &&
        localStorage.getItem('carnavalia_session') === 'active'
      );
      setIsSessionActive(active);
    } catch (e) {
      console.warn('Error actualizando carnavalia_session:', e);
      setIsSessionActive(false);
    }
  }, [isAuthenticated]);

  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem('carnavalia_session');
      localStorage.removeItem('carnavalia_user');
      localStorage.removeItem('carnavalia_token');
    } catch (e) {
      console.warn('Error clearing session:', e);
    }
    if (logout) logout();
    setIsSessionActive(false);
  }, [logout]);

  const [pois, setPois] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [isServerHealthy, setIsServerHealthy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [reportsModalOpen, setReportsModalOpen] = useState(false);
  const [activeView, setActiveView] = useState('senda');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [currentCarnivalDay, setCurrentCarnivalDay] = useState('06-ene');
  const { centerOnMe, location: realtimeLocation } = useRealtimeLocation();
  const [userGps, setUserGps] = useState<any>(null);
  const userGpsRef = useRef<any>(null);
  useEffect(() => {
    userGpsRef.current = userGps;
  }, [userGps]);

  useEffect(() => {
    if (realtimeLocation) {
      setUserGps(realtimeLocation);
    }
  }, [realtimeLocation]);

  const [navRoute, setNavRoute] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Estado para la capa y foco de la Senda del Carnaval
  const [showSenda, setShowSenda] = useState(false);
  const [focusSendaTrigger, setFocusSendaTrigger] = useState(0);

  // Estado para la ruta dinámica y telemetría trazada por GuaneñaBot (Gemini 2.5 Flash)
  const [activeRouteCoordinates, setActiveRouteCoordinates] = useState<[number, number][]>([]);
  const [shouldDrawRoute, setShouldDrawRoute] = useState<boolean>(false);
  const [routeTitle, setRouteTitle] = useState<string>('');
  const [activeSchedule, setActiveSchedule] = useState<any>(null);
  const [activeNearbyPlaces, setActiveNearbyPlaces] = useState<any[]>([]);

  const handleRouteReceived = useCallback((
    waypoints: [number, number][],
    shouldDraw: boolean,
    title?: string,
    schedule?: any,
    nearbyPlaces?: any[]
  ) => {
    setActiveRouteCoordinates(waypoints);
    setShouldDrawRoute(shouldDraw);
    if (title) setRouteTitle(title);
    if (schedule) setActiveSchedule(schedule);
    if (nearbyPlaces) setActiveNearbyPlaces(nearbyPlaces);
    setShowSenda(true);
    if (waypoints && waypoints.length >= 2) {
      setNavRoute({
        startCoords: waypoints[0],
        targetCoords: waypoints[waypoints.length - 1],
        targetName: title || 'Ruta guiada por GuaneñaBot',
        isGeminiRoute: true,
        waypoints: waypoints,
        schedule: schedule || null,
        nearbyPlaces: nearbyPlaces || [],
      });
    }
  }, []);

  const handleFocusSenda = useCallback(() => {
    setShowSenda(true);
    setFocusSendaTrigger((prev) => prev + 1);
    if (activeRouteCoordinates && activeRouteCoordinates.length >= 2) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('FOCUS_MAP_BOUNDS', {
            detail: { coordinates: activeRouteCoordinates },
          })
        );
      }
    }
  }, [activeRouteCoordinates]);

  // Manejador reactivo cuando GuaneñaBot selecciona un destino espacial
  const handleSelectDestination = useCallback((targetCoords: [number, number], targetName: string) => {
    const currentGps = userGpsRef.current;
    const start = currentGps ? [currentGps.lat, currentGps.lng] : [1.2136, -77.2811];
    setNavRoute({
      startCoords: start,
      targetCoords,
      targetName,
    });
  }, []);

  // Escuchar comandos de IA emitidos desde GuaneñaBot para cambiar fecha de carnaval o trazar ruta OSRM
  useEffect(() => {
    const handleDayEvent = (e: any) => {
      if (e?.detail?.dayId) {
        setCurrentCarnivalDay(e.detail.dayId);
      }
    };
    const handleRouteEvent = (e: any) => {
      if (e?.detail) {
        const detail = e.detail;
        const currentGps = userGpsRef.current;
        const start = detail.startCoords || (currentGps ? [currentGps.lat, currentGps.lng] : [1.2136, -77.2811]);
        setNavRoute({
          ...detail,
          startCoords: start,
        });
      }
    };
    window.addEventListener('focus-carnival-day', handleDayEvent);
    window.addEventListener('route-to-poi', handleRouteEvent);
    return () => {
      window.removeEventListener('focus-carnival-day', handleDayEvent);
      window.removeEventListener('route-to-poi', handleRouteEvent);
    };
  }, []);

  // Estado para Toast de notificaciones
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: '', type: 'success' });
    }, 4000);
  }, []);

  // Carga sincronizada de datos desde el backend y Supabase
  const loadDashboardData = useCallback(async () => {
    try {
      const [healthRes, poisRes, reportsRes, zonesRes, supabaseReportsRes] = await Promise.allSettled([
        api.checkHealth(),
        api.getPOIs(),
        api.getReports(),
        api.getZonesRisk(),
        fetchActiveReports(),
      ]);

      if (healthRes.status === 'fulfilled' && healthRes.value?.status === 'healthy') {
        setIsServerHealthy(true);
      } else {
        setIsServerHealthy(false);
      }

      if (poisRes.status === 'fulfilled') {
        setPois(poisRes.value || []);
      }

      // Priorizar o fusionar reportes de Supabase y API de respaldo
      if (supabaseReportsRes.status === 'fulfilled' && Array.isArray(supabaseReportsRes.value) && supabaseReportsRes.value.length > 0) {
        setReports(supabaseReportsRes.value);
      } else if (reportsRes.status === 'fulfilled') {
        setReports(reportsRes.value || []);
      }

      if (zonesRes.status === 'fulfilled') {
        setZones(zonesRes.value || []);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error al sincronizar datos:', err);
      setIsServerHealthy(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Polling periódico cada 30 segundos solo si está autenticado
  useEffect(() => {
    if (isSessionActive) {
      loadDashboardData();
      const interval = setInterval(loadDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [isSessionActive, loadDashboardData]);

  // Al iniciar sesión, asegurar que la vista por defecto sea el mapa principal (Senda)
  useEffect(() => {
    if (isSessionActive) {
      setActiveView('senda');
      setCalendarOpen(false);
      setReportsModalOpen(false);
      setReportModalOpen(false);
    }
  }, [isSessionActive]);

  // Manejar selección de coordenadas al hacer clic en el mapa (solo en modo de reporte)
  const handleSelectCoordinates = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
  };

  // Callback al crearse un nuevo reporte
  const handleReportCreated = (newReport: any) => {
    setReports((prev) => [newReport, ...prev]);
    setSelectedLocation(null);
    api.getZonesRisk().then(setZones).catch(console.error);
  };

  // Conteo de reportes por severidad
  const highRiskCount = reports.filter((r) => r.ai_risk_level === 'Alto').length;

  // 1. Pantalla de carga mientras se verifica sesión local
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-[#08080a] text-slate-100">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-yellow-400 text-stone-950 text-2xl shadow-lg shadow-yellow-500/30 animate-bounce">
          <span className="material-symbols-outlined text-[32px] font-bold">theater_comedy</span>
        </div>
        <p className="text-xs font-bold tracking-widest uppercase text-yellow-400 mt-4 font-mono">
          Iniciando CarnavalIA GIS Pasto...
        </p>
      </div>
    );
  }

  // 2. Si NO existe sesión activa, renderizar ÚNICA Y EXCLUSIVAMENTE Login (bloqueo total de mapa, chat y modales)
  if (!isSessionActive) {
    return <LoginView />;
  }

  const carnivalDayNames: Record<string, string> = {
    '28-dic': 'Pre-Carnaval: Arcoíris',
    '31-dic': '31 Dic: Años Viejos',
    '02-ene': 'Día 2: Carnavalito',
    '03-ene': 'Día 3: Canto a la Tierra',
    '04-ene': 'Día 4: Familia Castañeda',
    '05-ene': 'Día 5: Día de Negros',
    '06-ene': 'Día 6: Desfile Magno',
    '07-ene': 'Día 7: Festival del Cuy',
  };

  const displayName = user?.full_name || user?.name || user?.email?.split('@')[0] || 'Turista Pasto';

  // 3. Una vez autenticado con sesión activa, renderizar el Dashboard GIS Stitch Oficial
  return (
    <div className="min-h-screen bg-[#08080a] text-slate-100 font-sans selection:bg-yellow-400 selection:text-stone-950 overflow-hidden relative">
      {/* 1. SIDEBAR IZQUIERDA (Especificación Stitch) */}
      <aside className={`fixed left-0 top-0 h-full w-72 bg-[#0c0c10]/95 border-r border-[#1e1e28] backdrop-blur-2xl z-40 flex flex-col justify-between p-4 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.85)] transition-transform duration-300 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex flex-col gap-6">
          {/* Logo con icono Satellite */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center shadow-[0_0_18px_rgba(250,204,21,0.45)]">
                <span className="material-symbols-outlined text-[#1a1400] text-[24px] font-bold">theater_comedy</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[20px] tracking-tight text-white font-bold leading-tight">CarnavalIA</span>
                <span className="text-[11px] text-yellow-400 tracking-widest uppercase font-semibold">GIS Pasto · UNESCO</span>
              </div>
            </div>
            {/* Cerrar en móvil */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden p-1.5 text-neutral-400 hover:text-white"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Badge Día en Vivo */}
          <div
            onClick={() => setCalendarOpen(true)}
            className="p-2.5 rounded-xl bg-[#15151c]/90 border border-yellow-500/20 backdrop-blur-md flex items-center justify-between cursor-pointer hover:border-yellow-500/40 transition group"
            title="Cambiar fecha del Carnaval"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_8px_#facc15] shrink-0" />
              <span className="text-[12px] text-gray-200 font-semibold truncate">
                {carnivalDayNames[currentCarnivalDay] || 'Día 6: Desfile Magno'}
              </span>
            </div>
            <span className="text-[11px] text-yellow-400 font-bold shrink-0 ml-1">LIVE</span>
          </div>

          {/* Menú de Navegación Vertical */}
          <nav className="flex flex-col gap-1.5" aria-label="Navegación principal">
            <button
              type="button"
              onClick={() => {
                setActiveView('senda');
                setCalendarOpen(false);
                setReportsModalOpen(false);
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition-all text-left cursor-pointer ${
                activeView === 'senda' && !reportsModalOpen && !calendarOpen
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-stone-950 shadow-[0_0_20px_rgba(250,204,21,0.45)] border border-yellow-200'
                  : 'text-neutral-300 hover:bg-[#1a1a24] hover:text-yellow-400 border border-transparent hover:border-yellow-500/20'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">map</span>
              <span className="text-[14px]">Mapa Principal</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (showSenda) {
                  setShowSenda(false);
                } else {
                  handleFocusSenda();
                }
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition-all text-left cursor-pointer ${
                showSenda
                  ? 'text-yellow-400 bg-[#1a1a24] border border-yellow-500/30'
                  : 'text-neutral-300 hover:bg-[#1a1a24] hover:text-yellow-400 border border-transparent hover:border-yellow-500/20'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">route</span>
              <span className="text-[14px]">Senda del Carnaval</span>
              <span className={`ml-auto w-2 h-2 rounded-full ${showSenda ? 'bg-yellow-400 shadow-[0_0_8px_#facc15]' : 'bg-neutral-600'}`} />
            </button>

            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('toggle-guanena-chat'));
                }
                setIsMobileSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-neutral-300 hover:bg-[#1a1a24] hover:text-yellow-400 border border-transparent hover:border-yellow-500/20 transition-all font-semibold text-left cursor-pointer group"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:text-yellow-400">smart_toy</span>
              <span className="text-[14px]">GuaneñaBot AI</span>
              <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-300 font-bold">2.5</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCalendarOpen(true);
                setReportsModalOpen(false);
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold transition-all text-left cursor-pointer ${
                calendarOpen
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-stone-950 font-bold border border-yellow-200'
                  : 'text-neutral-300 hover:bg-[#1a1a24] hover:text-yellow-400 border border-transparent hover:border-yellow-500/20'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">emergency</span>
              <span className="text-[14px]">Puntos Cívicos y Salud</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setReportsModalOpen(true);
                setCalendarOpen(false);
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold transition-all text-left cursor-pointer ${
                reportsModalOpen
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold shadow-lg border border-red-400'
                  : 'text-neutral-300 hover:bg-[#1a1a24] hover:text-yellow-400 border border-transparent hover:border-yellow-500/20'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">warning</span>
              <span className="text-[14px]">Centro de Alertas</span>
              {reports.length > 0 && (
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white">
                  {reports.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Bloque Inferior: Datum Telemetría + Usuario y Salir */}
        <div className="flex flex-col gap-3">
          <div className="p-2.5 rounded-xl bg-[#121218] border border-[#22222e] flex flex-col gap-1 text-[11px] font-mono">
            <span className="text-neutral-400">DATUM TELEMETRÍA</span>
            <div className="flex justify-between items-center text-yellow-400 font-semibold">
              <span>{userGps?.lat ? `${userGps.lat.toFixed(4)}°N` : "01°12'54\"N"}</span>
              <span>{userGps?.lng ? `${userGps.lng.toFixed(4)}°W` : "77°16'44\"W"}</span>
            </div>
            <div className="flex justify-between items-center text-neutral-400">
              <span>ALT: 2,527m</span>
              <span className="text-amber-400 font-semibold">{userGps ? 'GPS ACTIVO' : 'GNSS: RTK FIX'}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#1e1e28] flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center text-xs font-bold text-yellow-300 shrink-0">
                👤
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-white truncate max-w-[110px]">
                  {displayName}
                </span>
                <span className="text-[10px] text-emerald-400">En línea</span>
              </div>
            </div>

            <button
              id="sidebar-logout-btn"
              type="button"
              onClick={handleLogout}
              className="p-1.5 px-2 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition cursor-pointer text-xs flex items-center gap-1 shrink-0"
              title="Cerrar sesión e ir al login"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span className="text-[11px] font-bold">Salir</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop para cerrar sidebar en móvil */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
        />
      )}

      {/* 2. CONTENEDOR PRINCIPAL */}
      <div className="md:pl-72 min-h-screen bg-[#08080a] relative flex flex-col h-screen overflow-hidden">
        {/* HEADER SUPERIOR */}
        <header className="fixed top-0 left-0 md:left-72 right-0 h-16 bg-[#0c0c10]/90 border-b border-[#1e1e28] backdrop-blur-xl z-30 flex items-center justify-between px-4 sm:px-6 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-[#16161f] border border-[#272735] text-yellow-400 hover:text-white cursor-pointer"
              title="Abrir menú"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>
            <div className="flex items-center gap-2 bg-[#16161f] border border-yellow-500/30 px-3 py-1 rounded-full text-xs font-mono text-yellow-300 shadow-sm">
              <span className="material-symbols-outlined text-[16px] text-yellow-400 animate-pulse">near_me</span>
              <span className="hidden sm:inline">PASTO_CAM_VECTOR_FEED</span>
              <span className="sm:hidden font-bold">PASTO SIG</span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex items-center bg-[#15151d] border border-[#272735] focus-within:border-yellow-500/50 rounded-xl px-3 py-1.5 gap-2 transition">
              <span className="material-symbols-outlined text-neutral-400 text-[18px]">search</span>
              <input
                className="bg-transparent text-white text-xs placeholder:text-neutral-500 outline-none w-44 md:w-56"
                placeholder="Buscar cuadrilla, carroza, tarima..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedLocation(null);
                setReportModalOpen(true);
              }}
              className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.45)] border border-amber-300/40 active:scale-95 transition cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">sos</span>
              <span className="text-xs uppercase tracking-wider font-extrabold">Alerta SOS</span>
            </button>
          </div>
        </header>

        {/* LIENZO DEL MAPA INTERACTIVO (LEAFLET REAL CON MAPCONTAINER DE FONDO) */}
        <main className="w-full pt-16 h-screen relative overflow-hidden flex-1">
          {/* MAPCONTAINER REAL DE LEAFLET */}
          <div className="absolute inset-0 z-0">
            <ErrorBoundary>
              <MapView
                pois={pois}
                reports={reports}
                zones={zones}
                onSelectCoordinates={handleSelectCoordinates}
                isSelectingLocation={reportModalOpen}
                selectedLocation={selectedLocation}
                currentCarnivalDay={currentCarnivalDay}
                selectedDay={currentCarnivalDay}
                onSelectDay={setCurrentCarnivalDay}
                onUserLocationChange={setUserGps}
                navRoute={navRoute}
                setNavRoute={setNavRoute}
                showSenda={showSenda}
                onToggleSenda={() => setShowSenda((prev) => !prev)}
                focusSendaTrigger={focusSendaTrigger}
                schedule={activeSchedule}
                nearbyPlaces={activeNearbyPlaces}
                hideTopBar={true}
              />
            </ErrorBoundary>
          </div>

          {/* FILTROS FLOTANTES ARRIBA */}
          <div className="absolute left-4 sm:left-6 top-20 z-20 flex items-center gap-2 flex-wrap max-w-2xl pointer-events-auto select-none">
            <button
              type="button"
              onClick={() => {
                if (showSenda) {
                  setShowSenda(false);
                } else {
                  handleFocusSenda();
                }
              }}
              className={`h-8 px-3 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer active:scale-95 ${
                showSenda
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-stone-950 shadow-[0_0_18px_rgba(250,204,21,0.4)] border border-yellow-200'
                  : 'bg-[#101016]/95 border border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/20 shadow-lg'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">route</span>
              <span>Senda Oficial (7.5 km)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('show-poi-category', { detail: { category: 'restaurantes' } }));
                }
              }}
              className="h-8 px-3 rounded-xl bg-[#101016]/95 border border-yellow-500/40 hover:border-yellow-400 text-yellow-200 text-xs font-bold flex items-center gap-1.5 shadow-lg active:scale-95 transition cursor-pointer"
            >
              <span>🍴</span>
              <span>Gastronomía (34)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('show-poi-category', { detail: { category: 'salud' } }));
                }
              }}
              className="h-8 px-3 rounded-xl bg-[#101016]/95 border border-rose-500/30 hover:border-rose-400 text-rose-200 text-xs font-bold flex items-center gap-1.5 shadow-lg active:scale-95 transition cursor-pointer"
            >
              <span>🚑</span>
              <span>Puestos Salud (12)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('show-poi-category', { detail: { category: 'policia' } }));
                }
              }}
              className="h-8 px-3 rounded-xl bg-[#101016]/95 border border-blue-500/30 hover:border-blue-400 text-blue-200 text-xs font-bold flex items-center gap-1.5 shadow-lg active:scale-95 transition cursor-pointer"
            >
              <span>👮</span>
              <span>CAIs Policía</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('show-poi-category', { detail: { category: 'banio' } }));
                }
              }}
              className="h-8 px-3 rounded-xl bg-[#101016]/95 border border-emerald-500/30 hover:border-emerald-400 text-emerald-200 text-xs font-bold flex items-center gap-1.5 shadow-lg active:scale-95 transition cursor-pointer"
            >
              <span>🚻</span>
              <span>Baños</span>
            </button>
          </div>

          {/* BARRA DE TELEMETRÍA INFERIOR IZQUIERDA */}
          <div className="absolute left-4 sm:left-6 bottom-6 z-20 hidden md:flex items-center gap-3 bg-[#0c0c10]/95 border border-[#222230] backdrop-blur-xl px-4 py-2 rounded-xl shadow-xl text-xs font-mono select-none">
            <span className="text-white font-bold">SENDA: 7.5 KM</span>
            <span className="text-neutral-600">|</span>
            <span className="text-yellow-300 font-bold">ESPECTADORES: 420,000</span>
            <span className="text-neutral-600">|</span>
            <span className="text-yellow-400 font-bold">16°C • PASTOLUZ</span>
          </div>

          {/* BOTÓN FLOTANTE GPS CENTRAR EN MI UBICACIÓN */}
          <button
            type="button"
            onClick={() => centerOnMe()}
            className="absolute left-4 sm:left-6 bottom-16 md:bottom-18 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#101016]/90 border border-yellow-500/30 hover:border-yellow-400 text-yellow-300 text-xs font-mono font-bold shadow-lg transition active:scale-95 cursor-pointer"
            title="Centrar mapa en mi GPS"
          >
            <Crosshair className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-[11px] font-mono">GPS EN VIVO</span>
          </button>

          {/* GUANEÑABOT HUD FLOTANTE ABAJO A LA DERECHA */}
          <GuanenaChat
            onRouteReceived={handleRouteReceived}
            onFocusSenda={handleFocusSenda}
            onSelectDestination={handleSelectDestination}
          />

          {/* Prompt para Instalar PWA */}
          <InstallPwaPrompt />
        </main>
      </div>

      {/* Modal para Registro de Reportes */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => {
          setReportModalOpen(false);
          setSelectedLocation(null);
        }}
        initialCoordinates={selectedLocation || userGps}
        userGps={userGps}
        onReportCreated={handleReportCreated}
        onShowToast={showToast}
      />

      {/* Modal de Lista de Reportes Ciudadanos */}
      <CitizenReportsModal
        isOpen={reportsModalOpen}
        onClose={() => setReportsModalOpen(false)}
        reports={reports}
        onOpenNewReport={() => {
          setSelectedLocation(null);
          setReportModalOpen(true);
        }}
      />

      {/* Modal de Calendario de Eventos */}
      <EventsCalendarModal
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        selectedDay={currentCarnivalDay}
        onSelectDay={(day: string) => {
          setCurrentCarnivalDay(day);
          setActiveView('senda');
        }}
      />

      {/* Notificación Toast flotante */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
}

export default App;

