import React, { useState, useEffect, useCallback } from 'react';
import { dispatchEmergencyAlert, EmergencyAlertPayload } from '../../services/reportService';

export interface EmergencyDirectoryEntry {
  id: string;
  name: string;
  phone: string;
  telHref: string;
  icon: string;
  badgeColor: string;
  borderColor: string;
  hoverBg: string;
}

export interface IncidentCategory {
  id: 'Medical' | 'Security' | 'Fire' | 'Lost Child';
  title: string;
  subtext: string;
  icon: string;
  colorClasses: string;
  activeRing: string;
}

export const EMERGENCY_DIRECTORY: EmergencyDirectoryEntry[] = [
  {
    id: 'linea-123',
    name: 'Línea de Emergencias 123',
    phone: '123',
    telHref: 'tel:123',
    icon: 'emergency',
    badgeColor: 'text-red-400 bg-red-500/20',
    borderColor: 'border-red-500/50',
    hoverBg: 'hover:bg-red-950/60 hover:border-red-400',
  },
  {
    id: 'policia-pasto',
    name: 'Policía Nacional Pasto',
    phone: '123',
    telHref: 'tel:123',
    icon: 'local_police',
    badgeColor: 'text-blue-400 bg-blue-500/20',
    borderColor: 'border-blue-500/50',
    hoverBg: 'hover:bg-blue-950/60 hover:border-blue-400',
  },
  {
    id: 'bomberos-pasto',
    name: 'Bomberos Pasto',
    phone: '119',
    telHref: 'tel:119',
    icon: 'local_fire_department',
    badgeColor: 'text-orange-400 bg-orange-500/20',
    borderColor: 'border-orange-500/50',
    hoverBg: 'hover:bg-orange-950/60 hover:border-orange-400',
  },
  {
    id: 'cruz-roja-pasto',
    name: 'Cruz Roja / Salud',
    phone: '132',
    telHref: 'tel:132',
    icon: 'medical_services',
    badgeColor: 'text-rose-400 bg-rose-500/20',
    borderColor: 'border-rose-500/50',
    hoverBg: 'hover:bg-rose-950/60 hover:border-rose-400',
  },
];

export const INCIDENT_CATEGORIES: IncidentCategory[] = [
  {
    id: 'Medical',
    title: 'Médica / Salud',
    subtext: 'Desmayo, trauma, triaje urgente',
    icon: 'medical_services',
    colorClasses: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    activeRing: 'border-rose-500 bg-rose-950/60 shadow-[0_0_20px_rgba(244,63,94,0.45)] text-white',
  },
  {
    id: 'Security',
    title: 'Seguridad / Policía',
    subtext: 'Hurto, riña, altercado o CAI',
    icon: 'local_police',
    colorClasses: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    activeRing: 'border-indigo-500 bg-indigo-950/60 shadow-[0_0_20px_rgba(99,102,241,0.45)] text-white',
  },
  {
    id: 'Fire',
    title: 'Incendio / Bomberos',
    subtext: 'Fuego, humo o escape de gas',
    icon: 'local_fire_department',
    colorClasses: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    activeRing: 'border-amber-500 bg-amber-950/60 shadow-[0_0_20px_rgba(245,158,11,0.45)] text-white',
  },
  {
    id: 'Lost Child',
    title: 'Menor Extraviado',
    subtext: 'Niño perdido o búsqueda urgente',
    icon: 'person_search',
    colorClasses: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    activeRing: 'border-yellow-400 bg-yellow-950/60 shadow-[0_0_20px_rgba(250,204,21,0.45)] text-white',
  },
];

export const PASTOS_SENDA_SECTORS = [
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

export interface SosModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation?: { lat: number; lng: number } | null;
  userGps?: { lat: number; lng: number } | null;
  initialCoordinates?: { lat: number; lng: number } | null;
  onReportCreated?: (report: any) => void;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'warning') => void;
}

export function SosModal({
  isOpen,
  onClose,
  userLocation,
  userGps,
  initialCoordinates,
  onReportCreated,
  onShowToast,
}: SosModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<'Medical' | 'Security' | 'Fire' | 'Lost Child'>('Medical');
  const [selectedSector, setSelectedSector] = useState<string>('plaza_carnaval');
  const [locationLabel, setLocationLabel] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [latitude, setLatitude] = useState<number>(1.2115);
  const [longitude, setLongitude] = useState<number>(-77.2785);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Synchronize coordinates whenever the modal is opened
  useEffect(() => {
    if (!isOpen) return;

    setConfirmationMessage(null);
    setErrorMessage(null);
    setIsSubmitting(false);

    const activeCoords = initialCoordinates || userLocation || userGps;
    if (activeCoords && typeof activeCoords.lat === 'number' && typeof activeCoords.lng === 'number') {
      setLatitude(Number(activeCoords.lat.toFixed(6)));
      setLongitude(Number(activeCoords.lng.toFixed(6)));
      setLocationLabel('Mi ubicación GPS en la Senda');
      setSelectedSector('gps');
    } else {
      const defaultSec = PASTOS_SENDA_SECTORS[0];
      setLatitude(defaultSec.lat);
      setLongitude(defaultSec.lng);
      setSelectedSector(defaultSec.id);
      setLocationLabel(defaultSec.label);
    }
  }, [isOpen, initialCoordinates, userLocation, userGps]);

  // Handle live browser geolocation refresh
  const handleRefreshGps = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(6));
          const lng = Number(pos.coords.longitude.toFixed(6));
          setLatitude(lat);
          setLongitude(lng);
          setSelectedSector('gps');
          setLocationLabel('Coordenadas GPS en vivo');
          setIsLocating(false);
          if (onShowToast) {
            onShowToast(`GPS capturado: [${lat}, ${lng}]`, 'success');
          }
        },
        (err) => {
          console.warn('[SosModal] Geolocation error:', err);
          setIsLocating(false);
          const fallback = userLocation || userGps;
          if (fallback && typeof fallback.lat === 'number') {
            setLatitude(Number(fallback.lat.toFixed(6)));
            setLongitude(Number(fallback.lng.toFixed(6)));
            setLocationLabel('Ubicación GPS guardada');
          } else {
            setErrorMessage('No se pudo acceder al GPS del dispositivo. Puedes seleccionar un hito de la lista.');
          }
        },
        { enableHighAccuracy: true, timeout: 7000 }
      );
    }
  }, [userLocation, userGps, onShowToast]);

  // Dispatch emergency alert to PMU and Supabase
  const handleDispatchAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setConfirmationMessage(null);
    setIsSubmitting(true);

    try {
      const activeCategory = INCIDENT_CATEGORIES.find((c) => c.id === selectedCategory) || INCIDENT_CATEGORIES[0];
      const sectorObj = PASTOS_SENDA_SECTORS.find((s) => s.id === selectedSector);
      const effectiveLocationName = locationLabel.trim() || sectorObj?.label || 'Senda del Carnaval de Pasto';

      const payload: EmergencyAlertPayload = {
        type: activeCategory.id,
        latitude: Number(latitude),
        longitude: Number(longitude),
        timestamp: new Date().toISOString(),
        status: 'pending',
        location_name: effectiveLocationName,
        description: description.trim() || `Alerta SOS de ${activeCategory.title} despachada al PMU desde ${effectiveLocationName}.`,
      };

      // Dispatch to Supabase table emergency_reports & persistent cache
      const dispatchedRecord = await dispatchEmergencyAlert(payload);

      if (onReportCreated) {
        onReportCreated(dispatchedRecord);
      }

      // Visual confirmation as strictly required
      const successFeedback = 'Alerta enviada al PMU con tus coordenadas GPS';
      setConfirmationMessage(successFeedback);

      if (onShowToast) {
        onShowToast(successFeedback, 'success');
      }

      // Auto close after acknowledging confirmation
      setTimeout(() => {
        setDescription('');
        setConfirmationMessage(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('[SosModal] Error dispatching alert to PMU:', err);
      setErrorMessage('Error al despachar la alerta al PMU. Inténtalo de nuevo o llama a la línea 123.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sos-modal-title"
      className="fixed inset-0 z-[1002] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Modal Glassmorphic Card Container with Dark-Red and Gold Aesthetic */}
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0c0c10]/95 backdrop-blur-2xl border border-red-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.95)] text-slate-100 overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        
        {/* Subtle Ambient Red Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 bg-red-600/15 blur-3xl pointer-events-none rounded-full" />

        {/* Modal Header */}
        <header className="px-5 py-4 border-b border-red-500/20 flex items-center justify-between gap-3 bg-[#12080a]/90 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 p-0.5 shadow-lg shadow-red-600/30 shrink-0">
              <div className="w-full h-full rounded-2xl bg-[#0c0c10] flex items-center justify-center text-red-400">
                <span className="material-symbols-outlined text-[26px] animate-pulse">emergency</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="sos-modal-title" className="text-base sm:text-lg font-black text-white tracking-tight leading-tight">
                  Alerta SOS & PMU
                </h2>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-400 px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                  Emergencias
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Puesto de Mando Unificado • San Juan de Pasto
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition active:scale-90 cursor-pointer"
            title="Cerrar modal"
            aria-label="Cerrar modal de emergencia"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </header>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 relative z-10 custom-scrollbar">

          {/* Success Banner */}
          {confirmationMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-in fade-in duration-200 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <span className="material-symbols-outlined text-[24px] text-emerald-400 shrink-0">verified</span>
              <span>{confirmationMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200 shadow-md">
              <span className="material-symbols-outlined text-[20px] text-red-400 shrink-0">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION 1: QUICK-CALL EMERGENCY DIRECTORY (1-TAP CALLS)       */}
          {/* ============================================================== */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-red-300 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-red-400">call</span>
                Directorio Rápido (1 Toque)
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Llamada Telefónica Directa</span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
              {EMERGENCY_DIRECTORY.map((item) => (
                <a
                  key={item.id}
                  href={item.telHref}
                  className={`p-3 rounded-2xl border ${item.borderColor} bg-[#140b0e]/80 ${item.hoverBg} transition-all duration-200 flex flex-col justify-between min-h-[78px] active:scale-95 group shadow-sm`}
                  title={`Llamar inmediatamente a ${item.name}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-slate-200 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                    </div>
                    <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${item.badgeColor} border border-white/10 font-mono tracking-wider flex items-center gap-1`}>
                      <span className="material-symbols-outlined text-[12px]">phone_enabled</span>
                      {item.phone}
                    </span>
                  </div>
                  <div className="mt-1">
                    <span className="text-xs font-bold text-slate-100 group-hover:text-white block leading-tight truncate">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Marcar ahora
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </section>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-[#0c0c10] px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider shrink-0">
              O Despachar Reporte al PMU
            </span>
            <div className="border-t border-white/10 w-full" />
          </div>

          {/* ============================================================== */}
          {/* SECTION 2: GEOLOCATED REPORT SUBMISSION (DISPATCH PMU)         */}
          {/* ============================================================== */}
          <form onSubmit={handleDispatchAlert} className="space-y-4">

            {/* Category Selector (Medical, Security/Police, Fire, Lost Child) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span>Tipo de Emergencia *</span>
                <span className="text-[10px] text-red-400 font-semibold">Selecciona una categoría</span>
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                {INCIDENT_CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`text-left p-3 rounded-2xl transition-all duration-200 flex flex-col justify-between min-h-[88px] active:scale-[0.98] cursor-pointer border ${
                        isActive
                          ? cat.activeRing
                          : 'bg-[#121218]/70 border-white/10 hover:border-white/20 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="material-symbols-outlined text-[24px]">
                          {cat.icon}
                        </span>
                        <span
                          className={`w-2.5 h-2.5 rounded-full transition-all ${
                            isActive ? 'bg-red-400 shadow-[0_0_8px_#f87171]' : 'bg-slate-700'
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

            {/* Live GPS Coordinates Capture Badge & Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-amber-400">my_location</span>
                  Ubicación de la Emergencia (GPS) *
                </label>
                <button
                  type="button"
                  onClick={handleRefreshGps}
                  disabled={isLocating}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition active:scale-95 disabled:opacity-50"
                  title="Actualizar coordenadas GPS actuales"
                >
                  <span className={`material-symbols-outlined text-[15px] ${isLocating ? 'animate-spin' : ''}`}>
                    sync
                  </span>
                  <span>{isLocating ? 'Obteniendo GPS...' : 'Actualizar GPS'}</span>
                </button>
              </div>

              {/* High-Contrast GPS telemetry pill */}
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-white/10 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="material-symbols-outlined text-amber-400 text-[18px] shrink-0">pin_drop</span>
                  <span className="text-slate-300 font-mono text-[11px] truncate">
                    Lat: <strong className="text-white">{latitude.toFixed(5)}</strong>, Lng: <strong className="text-white">{longitude.toFixed(5)}</strong>
                  </span>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                  GPS Activo
                </span>
              </div>

              {/* Senda Sector Dropdown Reference */}
              <select
                value={selectedSector}
                onChange={(e) => {
                  const sId = e.target.value;
                  setSelectedSector(sId);
                  const found = PASTOS_SENDA_SECTORS.find((s) => s.id === sId);
                  if (found) {
                    setLatitude(found.lat);
                    setLongitude(found.lng);
                    setLocationLabel(found.label);
                  }
                }}
                className="w-full bg-[#121218] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-red-500 transition"
              >
                <option value="gps">📍 Usar mis coordenadas GPS capturadas</option>
                {PASTOS_SENDA_SECTORS.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    Hito Senda: {sec.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Optional Incident Details Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span>Detalle Adicional</span>
                <span className="text-[10px] text-slate-500 font-normal">Opcional</span>
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Indica referencias visuales, vestimenta o detalles del paciente..."
                className="w-full bg-[#121218] border border-white/10 px-3.5 py-2 rounded-xl text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-red-500 transition resize-none"
              />
            </div>

            {/* Dispatch Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || Boolean(confirmationMessage)}
                className="w-full min-h-[48px] rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:brightness-110 active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(225,29,72,0.5)] border border-red-400/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                    <span>Despachando Alerta al PMU...</span>
                  </>
                ) : confirmationMessage ? (
                  <>
                    <span className="material-symbols-outlined text-[20px] text-emerald-300">verified</span>
                    <span>Alerta Despachada con Éxito</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">send</span>
                    <span>Despachar Alerta al PMU</span>
                  </>
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}

export default SosModal;

