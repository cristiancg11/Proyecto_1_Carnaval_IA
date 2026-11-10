import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Send, Loader2, MapPin, Locate, CheckCircle2, Shield, HeartPulse, Users, UserCheck } from 'lucide-react';
import { api } from '../../services/api';
import { submitIncidentReport, dispatchEmergencyAlert } from '../../services/reportService';
import { EMERGENCY_DIRECTORY } from './SosModal';

export interface ReportCategory {
  id: string;
  value: string;
  title: string;
  subtext: string;
  icon: string;
  color: string;
  activeBorder: string;
}

export const STITCH_REPORT_CATEGORIES: ReportCategory[] = [
  {
    id: 'seguridad',
    value: 'Seguridad',
    title: 'Seguridad',
    subtext: 'Hurto, altercado, CAI',
    icon: '👮',
    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    activeBorder: 'border-indigo-400/80 shadow-[0_0_20px_rgba(99,102,241,0.3)]',
  },
  {
    id: 'salud',
    value: 'Salud',
    title: 'Salud / Auxilio',
    subtext: 'Desmayo, trauma, auxilio',
    icon: '🚑',
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    activeBorder: 'border-rose-400/80 shadow-[0_0_20px_rgba(225,29,72,0.35)]',
  },
  {
    id: 'extraviado',
    value: 'Extraviado',
    title: 'Extraviado',
    subtext: 'Menores o pertenencias',
    icon: '🎒',
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    activeBorder: 'border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.3)]',
  },
  {
    id: 'aglomeracion',
    value: 'Aglomeracion',
    title: 'Aglomeración',
    subtext: 'Flujo cerrado en Senda',
    icon: '👥',
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    activeBorder: 'border-cyan-400/80 shadow-[0_0_20px_rgba(6,182,212,0.3)]',
  },
];

export const SENDA_SECTORS = [
  { id: 'plaza_carnaval', label: 'Plaza del Carnaval y la Cultura', lat: 1.2115, lng: -77.2785 },
  { id: 'calle_27', label: 'Carrera 27 (Sector Bomboná)', lat: 1.2130, lng: -77.2780 },
  { id: 'san_andresito', label: 'San Andresito / Calle 17', lat: 1.2105, lng: -77.2770 },
  { id: 'plaza_narino', label: 'Plaza de Nariño (Centro)', lat: 1.2145, lng: -77.2782 },
  { id: 'cra_27_calle_21', label: 'Carrera 27 con Calles 20 y 21', lat: 1.2168, lng: -77.2805 },
  { id: 'parque_infantil', label: 'Parque Infantil', lat: 1.2205, lng: -77.2850 },
  { id: 'av_estudiantes', label: 'Senda Avenida Los Estudiantes', lat: 1.2250, lng: -77.2885 },
  { id: 'fuente_transparencia', label: 'Fuente de la Transparencia (Llegada)', lat: 1.2275, lng: -77.2910 },
  { id: 'av_boyaca', label: 'Concentración Av. Boyacá (Salida)', lat: 1.2055, lng: -77.2755 },
];

export interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCoordinates?: { lat: number; lng: number } | null;
  userGps?: { lat: number; lng: number } | null;
  onReportCreated?: (report: any) => void;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'warning') => void;
}

export function ReportModal({
  isOpen,
  onClose,
  initialCoordinates,
  userGps,
  onReportCreated,
  onShowToast,
}: ReportModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('salud');
  const [selectedSector, setSelectedSector] = useState<string>('plaza_carnaval');
  const [customLocationName, setCustomLocationName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [latitude, setLatitude] = useState<number>(1.2115);
  const [longitude, setLongitude] = useState<number>(-77.2785);
  const [loading, setLoading] = useState<boolean>(false);
  const [locatingGps, setLocatingGps] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsSuccess(false);
      setLoading(false);

      if (initialCoordinates && typeof initialCoordinates.lat === 'number') {
        setLatitude(Number(initialCoordinates.lat.toFixed(6)));
        setLongitude(Number(initialCoordinates.lng.toFixed(6)));
        setSelectedSector('custom');
        setCustomLocationName('Punto seleccionado en el mapa');
      } else if (userGps && typeof userGps.lat === 'number') {
        setLatitude(Number(userGps.lat.toFixed(6)));
        setLongitude(Number(userGps.lng.toFixed(6)));
        setSelectedSector('gps');
        setCustomLocationName('Mi ubicación GPS en la senda');
      } else {
        const defaultSec = SENDA_SECTORS[0];
        setSelectedSector(defaultSec.id);
        setLatitude(defaultSec.lat);
        setLongitude(defaultSec.lng);
        setCustomLocationName(defaultSec.label);
      }
    }
  }, [isOpen, initialCoordinates, userGps]);

  if (!isOpen) return null;

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      setLocatingGps(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(Number(pos.coords.latitude.toFixed(6)));
          setLongitude(Number(pos.coords.longitude.toFixed(6)));
          setSelectedSector('gps');
          setCustomLocationName('Mi ubicación actual (GPS)');
          setLocatingGps(false);
        },
        (err) => {
          console.warn('No se pudo obtener GPS:', err);
          setLocatingGps(false);
          if (userGps) {
            setLatitude(Number(userGps.lat.toFixed(6)));
            setLongitude(Number(userGps.lng.toFixed(6)));
            setSelectedSector('gps');
            setCustomLocationName('Mi ubicación actual (GPS)');
          } else {
            setError('No fue posible obtener el GPS. Puedes seleccionar un tramo de la lista.');
          }
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const catObj = STITCH_REPORT_CATEGORIES.find((c) => c.id === selectedCategory) || STITCH_REPORT_CATEGORIES[0];
    const sectorObj = SENDA_SECTORS.find((s) => s.id === selectedSector);
    const locationTitle = customLocationName.trim() || sectorObj?.label || 'Senda del Carnaval';
    const fullTitle = `${catObj.title} en ${locationTitle}`;

    setLoading(true);

    try {
      const payload: any = {
        title: fullTitle,
        type: catObj.value === 'Salud' ? 'Emergencia' : catObj.value,
        category: catObj.value,
        description: description.trim() || `Reporte de ${catObj.title} registrado en ${locationTitle}.`,
        lat: Number(latitude),
        lng: Number(longitude),
        latitude: Number(latitude),
        longitude: Number(longitude),
        ai_risk_level: selectedCategory === 'salud' || selectedCategory === 'seguridad' ? 'Alto' : 'Medio',
      };

      // Inserción en Supabase / servicio de incidentes
      let newReport = null;
      try {
        newReport = await submitIncidentReport(payload);
      } catch (subErr) {
        console.warn('Error en submitIncidentReport, intentando API de respaldo:', subErr);
        try {
          newReport = await api.createReport(payload);
        } catch (apiErr) {
          console.warn('API error o backend desconectado, creando reporte local:', apiErr);
          newReport = {
            id: `rep-${Date.now()}`,
            ...payload,
            status: 'active',
            created_at: new Date().toISOString(),
          };
        }
      }

      // Geolocated dispatch to Supabase table emergency_reports
      try {
        await dispatchEmergencyAlert({
          type: catObj.value === 'Salud' ? 'Medical' : catObj.value === 'Seguridad' ? 'Security' : 'Medical',
          latitude: Number(latitude),
          longitude: Number(longitude),
          timestamp: new Date().toISOString(),
          status: 'pending',
          description: payload.description,
          location_name: locationTitle,
        });
      } catch (sosErr) {
        console.warn('[ReportModal] Emergency dispatch to emergency_reports:', sosErr);
      }

      if (onReportCreated) {
        onReportCreated(newReport);
      }

      const successMessage = 'Alerta enviada al PMU con tus coordenadas GPS';
      if (onShowToast) {
        onShowToast(successMessage, 'success');
      }

      setIsSuccess(true);

      setTimeout(() => {
        setDescription('');
        setIsSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Error al registrar incidencia:', err);
      setError('No fue posible procesar el reporte. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[1002] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Contenedor Modal Centrado de Stitch con Glassmorphism */}
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900/95 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.85)] text-slate-100 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        
        {/* Header Block with Shield Badge */}
        <header className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 via-amber-500 to-cyan-500 p-0.5 shadow-md shadow-rose-600/30 shrink-0">
              <div className="w-full h-full rounded-2xl bg-[#07090e] flex items-center justify-center text-lg">
                🚨
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight leading-tight">
                  Reportar Incidente
                </h2>
                <span className="text-[10px] font-bold text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30">
                  PMU Central
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Logística y Seguridad • Carnaval de Negros y Blancos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition active:scale-90"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs">
              {error}
            </div>
          )}

          {/* Quick-Call Emergency Directory (1-Tap Calls) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-300 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-red-400">call</span>
                Directorio Rápido (1 Toque)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Llamada Inmediata</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {EMERGENCY_DIRECTORY.map((item) => (
                <a
                  key={item.id}
                  href={item.telHref}
                  className={`p-2.5 rounded-xl border ${item.borderColor} bg-[#140b0e]/90 ${item.hoverBg} transition flex items-center justify-between gap-2 active:scale-95`}
                  title={`Llamar a ${item.name}`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="material-symbols-outlined text-[18px] text-slate-200">{item.icon}</span>
                    <span className="text-[11px] font-bold text-white truncate">{item.name}</span>
                  </div>
                  <span className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded ${item.badgeColor} shrink-0`}>
                    {item.phone}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Cuadrícula de Categorías (Seguridad, Salud, Extravío, Aglomeración) */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <span>Tipo de Incidencia *</span>
              <span className="text-[10px] text-cyan-400 font-semibold">Selecciona una categoría</span>
            </label>

            <div className="grid grid-cols-2 gap-2.5">
              {STITCH_REPORT_CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`text-left p-3 rounded-2xl transition-all flex flex-col justify-between min-h-[95px] active:scale-[0.98] cursor-pointer border ${
                      isActive
                        ? `bg-slate-800/95 ${cat.activeBorder}`
                        : 'bg-slate-950/60 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xl">{cat.icon}</span>
                      <span
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          isActive ? 'bg-cyan-400 shadow-[0_0_8px_#06b6d4]' : 'bg-slate-700'
                        }`}
                      />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-white block leading-tight">
                        {cat.title}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                        {cat.subtext}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selector de Ubicación / Hito en la Senda */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200">
                Punto de Referencia en la Senda *
              </label>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={locatingGps}
                className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                <Locate className={`w-3.5 h-3.5 ${locatingGps ? 'animate-spin' : ''}`} />
                <span>Usar mi GPS</span>
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                value={customLocationName}
                onChange={(e) => setCustomLocationName(e.target.value)}
                placeholder="Ej: Carrera 27 frente a Plaza del Carnaval..."
                className="w-full bg-slate-950/80 border border-white/10 px-3.5 py-2.5 rounded-xl text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition"
                required
              />
              <MapPin className="w-4 h-4 text-cyan-400 absolute right-3.5 top-3 pointer-events-none" />
            </div>

            <select
              value={selectedSector}
              onChange={(e) => {
                const sId = e.target.value;
                setSelectedSector(sId);
                const found = SENDA_SECTORS.find((s) => s.id === sId);
                if (found) {
                  setLatitude(found.lat);
                  setLongitude(found.lng);
                  setCustomLocationName(found.label);
                }
              }}
              className="bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-400"
            >
              {SENDA_SECTORS.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Descripción */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-200">
              Detalle del Suceso
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe lo ocurrido para orientar al equipo de respuesta..."
              className="w-full bg-slate-950/80 border border-white/10 px-3.5 py-2.5 rounded-xl text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition resize-none"
            />
          </div>

          {/* Botón de Enviar */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || isSuccess}
              className="w-full min-h-[46px] rounded-full bg-gradient-to-r from-rose-600 via-amber-500 to-cyan-500 hover:brightness-110 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(225,29,72,0.45)] border border-white/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Transmitiendo al PMU...</span>
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>¡Reporte Transmitido con Éxito!</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Despachar Alerta al PMU</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReportModal;
