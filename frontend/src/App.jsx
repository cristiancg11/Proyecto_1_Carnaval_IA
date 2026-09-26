import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import MapView from './components/MapView';
import ReportModal from './components/ReportModal';
import ChatbotDrawer from './components/ChatbotDrawer';
import InstallPwaPrompt from './components/InstallPwaPrompt';
import LoginView from './components/LoginView';
import { api } from './services/api';
import { useAuth } from './context/AuthContext';
import { RefreshCw, ShieldAlert, MapPin, Bot, Sparkles } from 'lucide-react';

export function App() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [pois, setPois] = useState([]);
  const [reports, setReports] = useState([]);
  const [zones, setZones] = useState([]);
  const [isServerHealthy, setIsServerHealthy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedDay, setSelectedDay] = useState('06-ene');
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
    // Recargar zonas para recalcular riesgos
    api.getZonesRisk().then(setZones).catch(console.error);
  };

  // Conteo de reportes por severidad
  const highRiskCount = reports.filter((r) => r.ai_risk_level === 'Alto').length;

  // 1. Pantalla de carga mientras se verifica sesión local
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-slate-950 text-slate-100">
        <div className="relative flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 via-fuchsia-600 to-violet-600 shadow-[0_0_35px_rgba(217,70,239,0.6)] border border-white/25 text-3xl animate-bounce">
          🎭
          <span className="absolute inset-0 rounded-3xl bg-fuchsia-500/30 animate-ping"></span>
        </div>
        <p className="text-xs font-black tracking-widest uppercase bg-gradient-to-r from-amber-400 via-rose-300 to-purple-400 bg-clip-text text-transparent mt-6">
          Iniciando CarnavalIA...
        </p>
      </div>
    );
  }

  // 2. Si no está autenticado, mostrar pantalla completa de Login / Registro
  if (!isAuthenticated) {
    return <LoginView />;
  }

  // 3. Una vez logueado, mostrar la aplicación completa y el mapa
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* 1. Barra de Navegación Superior */}
      <Header
        isServerHealthy={isServerHealthy}
        onOpenChat={() => setChatOpen(!chatOpen)}
        onOpenReportModal={() => {
          setSelectedLocation(null);
          setReportModalOpen(true);
        }}
        chatOpen={chatOpen}
        reportsCount={reports.length}
        zonesCount={zones.length}
      />

      {/* 2. Cuerpo Principal (Mapa + Widgets flotantes) */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {/* Mapa Interactivo Leaflet */}
        <MapView
          pois={pois}
          reports={reports}
          zones={zones}
          onSelectCoordinates={handleSelectCoordinates}
          selectedLocation={selectedLocation}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          onUserLocationChange={setUserGps}
          navRoute={navRoute}
          setNavRoute={setNavRoute}
        />

        {/* Panel Superior Flotante: Métricas en Vivo */}
        <div className="absolute top-4 right-4 z-[900] flex flex-col sm:flex-row items-end sm:items-center gap-2">
          {/* Badge de Alertas Críticas */}
          {highRiskCount > 0 && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-600/90 backdrop-blur-2xl text-white text-xs font-black shadow-[0_0_20px_rgba(244,63,94,0.55)] border border-rose-400/40 animate-pulse">
              <ShieldAlert className="w-4 h-4 text-amber-300" />
              <span>{highRiskCount} Alerta{highRiskCount > 1 ? 's' : ''} Crítica{highRiskCount > 1 ? 's' : ''}</span>
            </div>
          )}

          {/* Tarjeta Cápsula de Resumen Rápido */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-slate-950/80 backdrop-blur-2xl border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.6)] text-xs">
            <div className="flex items-center gap-1.5 text-slate-200">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span><strong className="text-white font-black">{pois.length}</strong> Puntos</span>
            </div>
            <span className="text-white/20">•</span>
            <div className="flex items-center gap-1.5 text-slate-200">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span><strong className="text-white font-black">{reports.length}</strong> Reportes</span>
            </div>
            <span className="text-white/20">•</span>
            <button
              onClick={loadDashboardData}
              disabled={loading}
              className="text-slate-400 hover:text-white transition p-1 hover:bg-white/10 rounded-full active:scale-95"
              title={`Actualizar datos (Última: ${lastUpdated.toLocaleTimeString()})`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-fuchsia-400' : 'hover:text-amber-400'}`} />
            </button>
          </div>
        </div>

        {/* Botón Flotante de Acceso Rápido al Asistente IA (FAB) */}
        {!chatOpen && (
          <button
            type="button"
            onClick={() => setChatOpen(true)}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:right-24 z-[1000] flex items-center gap-2.5 px-5 py-3 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-amber-500 hover:from-violet-500 hover:via-fuchsia-500 hover:to-amber-400 text-white font-black text-xs sm:text-sm shadow-[0_0_30px_rgba(217,70,239,0.7)] hover:shadow-[0_0_40px_rgba(217,70,239,0.95)] border border-white/30 transition-all duration-300 hover:scale-105 active:scale-95 group select-none pointer-events-auto"
            title="Abrir Asistente Virtual con IA (Gemini 2.5 Flash)"
          >
            <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-white/20">
              <Bot className="w-4 h-4 animate-bounce" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <span>Preguntar a la IA</span>
            <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
          </button>
        )}

        {/* 4. Modal para Registro de Reportes */}
        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => {
            setReportModalOpen(false);
            setSelectedLocation(null);
          }}
          initialCoordinates={selectedLocation}
          onReportCreated={handleReportCreated}
        />

        {/* 5. Prompt para Instalar PWA */}
        <InstallPwaPrompt />
      </main>

      {/* 3. Panel Lateral Flotante del Chatbot IA (Nivel Raíz con z-[9999]) */}
      <ChatbotDrawer
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        userLocation={selectedLocation || userGps || { lat: 1.2136, lng: -77.2811 }}
        userGps={userGps}
        selectedDay={selectedDay}
        setNavRoute={setNavRoute}
      />
    </div>
  );
}

export default App;
