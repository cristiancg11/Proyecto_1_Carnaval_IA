import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import MapView from './components/MapView';
import ReportModal from './components/ReportModal';
import ChatIA from './components/ChatIA';
import InstallPwaPrompt from './components/InstallPwaPrompt';
import LoginView from './components/LoginView';
import EventsCalendarModal from './components/EventsCalendarModal';
import { api } from './services/api';
import { useAuth } from './context/AuthContext';
import { RefreshCw, ShieldAlert, MapPin } from 'lucide-react';

export function App() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [pois, setPois] = useState([]);
  const [reports, setReports] = useState([]);
  const [zones, setZones] = useState([]);
  const [isServerHealthy, setIsServerHealthy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [activeView, setActiveView] = useState('senda');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [currentCarnivalDay, setCurrentCarnivalDay] = useState('06-ene');
  const [userGps, setUserGps] = useState(null);
  const [navRoute, setNavRoute] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Carga sincronizada de datos desde el backend
  const loadDashboardData = useCallback(async () => {
    try {
      const [healthRes, poisRes, reportsRes, zonesRes] = await Promise.allSettled([
        api.checkHealth(),
        api.getPOIs(),
        api.getReports(),
        api.getZonesRisk(),
      ]);

      if (healthRes.status === 'fulfilled' && healthRes.value?.status === 'healthy') {
        setIsServerHealthy(true);
      } else {
        setIsServerHealthy(false);
      }

      if (poisRes.status === 'fulfilled') {
        setPois(poisRes.value || []);
      }

      if (reportsRes.status === 'fulfilled') {
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
    if (isAuthenticated) {
      loadDashboardData();
      const interval = setInterval(loadDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, loadDashboardData]);

  // Manejar selección de coordenadas al hacer clic en el mapa
  const handleSelectCoordinates = (lat, lng) => {
    setSelectedLocation({ lat, lng });
    setReportModalOpen(true);
  };

  // Callback al crearse un nuevo reporte
  const handleReportCreated = (newReport) => {
    setReports((prev) => [newReport, ...prev]);
    setSelectedLocation(null);
    api.getZonesRisk().then(setZones).catch(console.error);
  };

  // Conteo de reportes por severidad
  const highRiskCount = reports.filter((r) => r.ai_risk_level === 'Alto').length;

  // 1. Pantalla de carga mientras se verifica sesión local
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-slate-950 text-slate-100">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-800/80 border border-white/10 text-2xl shadow-sm animate-bounce">
          🎭
        </div>
        <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mt-4">
          Iniciando CarnavalIA...
        </p>
      </div>
    );
  }

  // 2. Si no está autenticado, mostrar pantalla completa de Login / Registro minimalista
  if (!isAuthenticated) {
    return <LoginView />;
  }

  // 3. Una vez logueado, mostrar la aplicación principal
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* 1. Barra de Navegación Superior Limpia */}
      <Header
        activeView={calendarOpen ? 'calendario' : activeView}
        onSelectSenda={() => {
          setActiveView('senda');
          setCalendarOpen(false);
        }}
        onOpenCalendar={() => setCalendarOpen(true)}
      />

      {/* 2. Cuerpo Principal (Mapa de la Senda + Widgets flotantes) */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {/* Mapa Interactivo Leaflet */}
        <MapView
          pois={pois}
          reports={reports}
          zones={zones}
          onSelectCoordinates={handleSelectCoordinates}
          selectedLocation={selectedLocation}
          currentCarnivalDay={currentCarnivalDay}
          selectedDay={currentCarnivalDay}
          onSelectDay={setCurrentCarnivalDay}
          onUserLocationChange={setUserGps}
          navRoute={navRoute}
          setNavRoute={setNavRoute}
        />

        {/* Panel Superior Flotante: Métricas en Vivo */}
        <div className="absolute top-4 right-4 z-[900] flex flex-col sm:flex-row items-end sm:items-center gap-2 pointer-events-auto">
          {/* Badge de Alertas Críticas */}
          {highRiskCount > 0 && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-rose-500/15 backdrop-blur-md text-rose-300 text-xs font-bold border border-rose-500/30 shadow-sm animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>{highRiskCount} Alerta{highRiskCount > 1 ? 's' : ''} Crítica{highRiskCount > 1 ? 's' : ''}</span>
            </div>
          )}

          {/* Tarjeta Cápsula de Resumen Rápido */}
          <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-2xl backdrop-blur-md bg-slate-900/90 border border-white/10 shadow-sm text-xs">
            <div className="flex items-center gap-1.5 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span><strong className="text-white font-bold">{pois.length}</strong> Puntos</span>
            </div>
            <span className="text-white/20">•</span>
            <div className="flex items-center gap-1.5 text-slate-300">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
              <span><strong className="text-white font-bold">{reports.length}</strong> Reportes</span>
            </div>
            <span className="text-white/20">•</span>
            <button
              onClick={loadDashboardData}
              disabled={loading}
              className="text-slate-400 hover:text-white transition p-1 hover:bg-white/10 rounded-xl active:scale-95 cursor-pointer"
              title={`Actualizar datos (Última: ${lastUpdated.toLocaleTimeString()})`}
              aria-label="Actualizar datos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : 'hover:text-amber-300'}`} />
            </button>
          </div>
        </div>

        {/* Prompt para Instalar PWA */}
        <InstallPwaPrompt />

        {/* Componente del Asistente GuaneñaBot (Chatbot UI Flotante en esquina inferior derecha) */}
        <ChatIA
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
        />
      </main>

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
      />

      {/* Modal de Calendario de Eventos */}
      <EventsCalendarModal
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        selectedDay={currentCarnivalDay}
        onSelectDay={(day) => {
          setCurrentCarnivalDay(day);
          setActiveView('senda');
        }}
      />
    </div>
  );
}

export default App;
