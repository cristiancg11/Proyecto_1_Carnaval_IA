import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import MapView from './components/MapView';
import ReportModal from './components/ReportModal';
import ChatbotDrawer from './components/ChatbotDrawer';
import AuthModal from './components/AuthModal';
import { api } from './services/api';
import { useAuth } from './context/AuthContext';
import { RefreshCw, ShieldAlert, MapPin } from 'lucide-react';

export function App() {
  const { isAuthenticated } = useAuth();
  const [pois, setPois] = useState([]);
  const [reports, setReports] = useState([]);
  const [zones, setZones] = useState([]);
  const [isServerHealthy, setIsServerHealthy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState('login');
  const [authPromptMessage, setAuthPromptMessage] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
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

  // Polling periódico cada 30 segundos
  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  // Manejar selección de coordenadas al hacer clic en el mapa
  const handleSelectCoordinates = (lat, lng) => {
    setSelectedLocation({ lat, lng });
    if (!isAuthenticated) {
      setAuthPromptMessage('Debes iniciar sesión para reportar un incidente ciudadano');
      setAuthInitialTab('login');
      setAuthModalOpen(true);
      return;
    }
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

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* 1. Barra de Navegación Superior */}
      <Header
        isServerHealthy={isServerHealthy}
        onOpenChat={() => setChatOpen(!chatOpen)}
        onOpenReportModal={() => {
          if (!isAuthenticated) {
            setSelectedLocation(null);
            setAuthPromptMessage('Debes iniciar sesión para reportar un incidente ciudadano');
            setAuthInitialTab('login');
            setAuthModalOpen(true);
            return;
          }
          setSelectedLocation(null);
          setReportModalOpen(true);
        }}
        onOpenAuth={(tab = 'login') => {
          setAuthPromptMessage(null);
          setAuthInitialTab(tab);
          setAuthModalOpen(true);
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
        />

        {/* Panel Superior Flotante: Métricas en Vivo */}
        <div className="absolute top-4 right-4 z-[900] flex flex-col sm:flex-row items-end sm:items-center gap-2">
          {/* Badge de Alertas Críticas */}
          {highRiskCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-600/90 backdrop-blur-md text-white text-xs font-bold shadow-lg shadow-rose-600/30 border border-rose-400/30 animate-pulse">
              <ShieldAlert className="w-4 h-4" />
              <span>{highRiskCount} Alerta{highRiskCount > 1 ? 's' : ''} Crítica{highRiskCount > 1 ? 's' : ''} en la Senda</span>
            </div>
          )}

          {/* Tarjeta de Resumen Rápido */}
          <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-xl text-xs">
            <div className="flex items-center gap-1.5 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span><strong>{pois.length}</strong> Puntos</span>
            </div>
            <span className="text-slate-700">•</span>
            <div className="flex items-center gap-1.5 text-slate-300">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span><strong>{reports.length}</strong> Reportes</span>
            </div>
            <span className="text-slate-700">•</span>
            <button
              onClick={loadDashboardData}
              disabled={loading}
              className="text-slate-400 hover:text-white transition p-0.5"
              title={`Actualizar datos (Última: ${lastUpdated.toLocaleTimeString()})`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rose-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* 3. Panel Lateral Flotante del Chatbot IA */}
        <ChatbotDrawer
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          userLocation={selectedLocation || { lat: 1.2136, lng: -77.2811 }}
        />

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

        {/* 5. Modal de Autenticación (Login / Registro) */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => {
            setAuthModalOpen(false);
            setAuthPromptMessage(null);
          }}
          initialTab={authInitialTab}
          promptMessage={authPromptMessage}
          onSuccess={() => {
            if (authPromptMessage) {
              setReportModalOpen(true);
            }
          }}
        />
      </main>
    </div>
  );
}

export default App;
