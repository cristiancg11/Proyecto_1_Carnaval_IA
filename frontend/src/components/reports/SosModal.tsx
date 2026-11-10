import React, { useState, useEffect, useCallback } from 'react';
import { dispatchEmergencyAlert, EmergencyAlertPayload } from '../../services/reportService';
import { getTranslation, Language } from '../../utils/i18n';

export interface IncidentCategoryOption {
  id: 'Medical' | 'Security' | 'Fire' | 'Lost Child';
  icon: string;
  colorClasses: string;
  activeRing: string;
}

export const INCIDENT_CATEGORIES: IncidentCategoryOption[] = [
  {
    id: 'Medical',
    icon: 'medical_services',
    colorClasses: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    activeRing: 'border-rose-500 bg-rose-950/60 shadow-[0_0_20px_rgba(244,63,94,0.45)] text-white dark:bg-rose-950/60',
  },
  {
    id: 'Security',
    icon: 'local_police',
    colorClasses: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    activeRing: 'border-indigo-500 bg-indigo-950/60 shadow-[0_0_20px_rgba(99,102,241,0.45)] text-white dark:bg-indigo-950/60',
  },
  {
    id: 'Fire',
    icon: 'local_fire_department',
    colorClasses: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    activeRing: 'border-amber-500 bg-amber-950/60 shadow-[0_0_20px_rgba(245,158,11,0.45)] text-white dark:bg-amber-950/60',
  },
  {
    id: 'Lost Child',
    icon: 'person_search',
    colorClasses: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    activeRing: 'border-yellow-400 bg-yellow-950/60 shadow-[0_0_20px_rgba(250,204,21,0.45)] text-white dark:bg-yellow-950/60',
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
  lang?: Language;
}

export function SosModal({
  isOpen,
  onClose,
  userLocation,
  userGps,
  initialCoordinates,
  onReportCreated,
  onShowToast,
  lang: propLang,
}: SosModalProps) {
  const currentLang: Language = propLang || (typeof localStorage !== 'undefined' && (localStorage.getItem('carnavalia-lang') as Language) || 'ES');
  const t = getTranslation(currentLang).sos;

  const [selectedCategory, setSelectedCategory] = useState<'Medical' | 'Security' | 'Fire' | 'Lost Child'>('Medical');
  const [selectedSectorId, setSelectedSectorId] = useState<string>('gps');
  const [sectorLandmark, setSectorLandmark] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [informantPhone, setInformantPhone] = useState<string>('');
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
      setSelectedSectorId('gps');
      setSectorLandmark('Plaza del Carnaval (GPS en vivo)');
    } else {
      const defaultSec = PASTOS_SENDA_SECTORS[0];
      setLatitude(defaultSec.lat);
      setLongitude(defaultSec.lng);
      setSelectedSectorId(defaultSec.id);
      setSectorLandmark(defaultSec.label);
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
          setSelectedSectorId('gps');
          setIsLocating(false);
          if (onShowToast) {
            onShowToast(`GPS: [${lat}, ${lng}]`, 'success');
          }
        },
        (err) => {
          console.warn('[SosModal] Geolocation error:', err);
          setIsLocating(false);
          const fallback = userLocation || userGps;
          if (fallback && typeof fallback.lat === 'number') {
            setLatitude(Number(fallback.lat.toFixed(6)));
            setLongitude(Number(fallback.lng.toFixed(6)));
          } else {
            setErrorMessage(t.errorAlert);
          }
        },
        { enableHighAccuracy: true, timeout: 7000 }
      );
    }
  }, [userLocation, userGps, onShowToast, t.errorAlert]);

  // Dispatch emergency alert to PMU and Supabase
  const handleDispatchAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setConfirmationMessage(null);
    setIsSubmitting(true);

    try {
      const effectiveLocationName = sectorLandmark.trim() || 'Senda del Carnaval de Pasto';
      const categoryTitles: Record<string, string> = {
        Medical: t.categories.medical.title,
        Security: t.categories.security.title,
        Fire: t.categories.fire.title,
        'Lost Child': t.categories.lostChild.title,
      };

      const payload: EmergencyAlertPayload = {
        type: selectedCategory,
        latitude: Number(latitude),
        longitude: Number(longitude),
        timestamp: new Date().toISOString(),
        status: 'pending',
        location_name: effectiveLocationName,
        description: description.trim() || `Alerta SOS [${categoryTitles[selectedCategory]}] en ${effectiveLocationName}.`,
        informant_phone: informantPhone.trim() || undefined,
      };

      // Dispatch to Supabase table emergency_reports & persistent cache
      const dispatchedRecord = await dispatchEmergencyAlert(payload);

      if (onReportCreated) {
        onReportCreated(dispatchedRecord);
      }

      // Visual confirmation as strictly required
      const successFeedback = t.successAlert;
      setConfirmationMessage(successFeedback);

      if (onShowToast) {
        onShowToast(successFeedback, 'success');
      }

      // Auto close after acknowledging confirmation
      setTimeout(() => {
        setDescription('');
        setInformantPhone('');
        setConfirmationMessage(null);
        onClose();
      }, 1600);
    } catch (err: any) {
      console.error('[SosModal] Error dispatching alert to PMU:', err);
      setErrorMessage(t.errorAlert);
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
      {/* Modal Container: High-contrast Dark & Light Mode Support */}
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-50 dark:bg-[#0c0c10]/95 text-slate-900 dark:text-slate-100 backdrop-blur-2xl border border-red-500/40 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        
        {/* Subtle Ambient Red Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 bg-red-600/15 blur-3xl pointer-events-none rounded-full" />

        {/* Modal Header */}
        <header className="px-5 py-4 border-b border-red-500/20 flex items-center justify-between gap-3 bg-red-500/5 dark:bg-[#12080a]/90 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 p-0.5 shadow-lg shadow-red-600/30 shrink-0">
              <div className="w-full h-full rounded-2xl bg-white dark:bg-[#0c0c10] flex items-center justify-center text-red-600 dark:text-red-400">
                <span className="material-symbols-outlined text-[26px] animate-pulse">emergency</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="sos-modal-title" className="text-base sm:text-lg font-black tracking-tight leading-tight">
                  {t.modalTitle}
                </h2>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  {t.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {t.modalSubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-slate-200/60 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition active:scale-90 cursor-pointer"
            title="Cerrar modal"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </header>

        {/* Scrollable Form Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 relative z-10 custom-scrollbar">

          {/* Success Banner */}
          {confirmationMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/50 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-in fade-in duration-200 shadow-sm">
              <span className="material-symbols-outlined text-[24px] text-emerald-500 shrink-0">verified</span>
              <span>{confirmationMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/50 text-red-800 dark:text-red-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200 shadow-sm">
              <span className="material-symbols-outlined text-[20px] text-red-500 shrink-0">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ============================================================== */}
          {/* STRUCTURED SOS REPORT FORM (COMPREHENSIVE LAYOUT)              */}
          {/* ============================================================== */}
          <form onSubmit={handleDispatchAlert} className="space-y-4">

            {/* 1. Incident Type Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold flex items-center justify-between">
                <span>{t.incidentType}</span>
                <span className="text-[10px] text-red-600 dark:text-red-400 font-semibold">{t.selectCategory}</span>
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                {INCIDENT_CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  const categoryInfo =
                    cat.id === 'Medical' ? t.categories.medical :
                    cat.id === 'Security' ? t.categories.security :
                    cat.id === 'Fire' ? t.categories.fire :
                    t.categories.lostChild;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`text-left p-3 rounded-2xl transition-all duration-200 flex flex-col justify-between min-h-[82px] active:scale-[0.98] cursor-pointer border ${
                        isActive
                          ? cat.activeRing
                          : 'bg-white dark:bg-[#121218]/70 border-slate-200 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="material-symbols-outlined text-[22px]">
                          {cat.icon}
                        </span>
                        <span
                          className={`w-2.5 h-2.5 rounded-full transition-all ${
                            isActive ? 'bg-red-500 shadow-[0_0_8px_#f87171]' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        />
                      </div>
                      <div className="mt-1">
                        <span className="font-bold text-xs block leading-tight">
                          {categoryInfo.title}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 truncate">
                          {categoryInfo.subtext}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Location / Sector: GPS Auto-Fill + Landmark Text Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-amber-500">my_location</span>
                  {t.gpsLocation}
                </label>
                <button
                  type="button"
                  onClick={handleRefreshGps}
                  disabled={isLocating}
                  className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:brightness-110 flex items-center gap-1 cursor-pointer transition active:scale-95 disabled:opacity-50"
                  title="Capturar GPS en vivo"
                >
                  <span className={`material-symbols-outlined text-[15px] ${isLocating ? 'animate-spin' : ''}`}>
                    sync
                  </span>
                  <span>{isLocating ? t.fetchingGps : t.refreshGps}</span>
                </button>
              </div>

              {/* High-Contrast GPS Badge */}
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-white/10 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="material-symbols-outlined text-amber-500 text-[18px] shrink-0">pin_drop</span>
                  <span className="font-mono text-[11px] truncate">
                    Lat: <strong>{latitude.toFixed(5)}</strong>, Lng: <strong>{longitude.toFixed(5)}</strong>
                  </span>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
                  {t.activeGps}
                </span>
              </div>

              {/* Text Input for Sector or Landmark along La Senda */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {t.sectorLabel}
                </label>
                <input
                  type="text"
                  required
                  value={sectorLandmark}
                  onChange={(e) => setSectorLandmark(e.target.value)}
                  placeholder={t.sectorPlaceholder}
                  className="w-full bg-white dark:bg-[#121218] border border-slate-300 dark:border-white/10 px-3.5 py-2 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:border-red-500 transition shadow-sm"
                />
              </div>

              {/* Quick Select helper for standard Senda landmarks */}
              <select
                value={selectedSectorId}
                onChange={(e) => {
                  const sId = e.target.value;
                  setSelectedSectorId(sId);
                  const found = PASTOS_SENDA_SECTORS.find((s) => s.id === sId);
                  if (found) {
                    setLatitude(found.lat);
                    setLongitude(found.lng);
                    setSectorLandmark(found.label);
                  }
                }}
                className="w-full bg-slate-100 dark:bg-[#121218] border border-slate-300 dark:border-white/10 rounded-xl px-3 py-1.5 text-[11px] text-slate-700 dark:text-slate-300 focus:outline-none focus:border-red-500 transition"
              >
                <option value="gps">{t.useMyGps}</option>
                {PASTOS_SENDA_SECTORS.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {t.landmarkOption} {sec.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Incident Description Textarea */}
            <div className="space-y-1">
              <label className="text-xs font-bold flex items-center justify-between">
                <span>{t.descriptionLabel}</span>
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.descriptionPlaceholder}
                className="w-full bg-white dark:bg-[#121218] border border-slate-300 dark:border-white/10 px-3.5 py-2.5 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:border-red-500 transition resize-none shadow-sm"
              />
            </div>

            {/* 4. Contact Phone / Informant (Optional Phone Input) */}
            <div className="space-y-1">
              <label className="text-xs font-bold flex items-center justify-between">
                <span>{t.phoneLabel}</span>
                <span className="text-[10px] text-slate-500 font-normal">{t.phoneSubtext}</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined text-[17px] text-slate-400 absolute left-3 pointer-events-none">
                  phone
                </span>
                <input
                  type="tel"
                  value={informantPhone}
                  onChange={(e) => setInformantPhone(e.target.value)}
                  placeholder={t.phonePlaceholder}
                  className="w-full pl-9 pr-3.5 py-2 bg-white dark:bg-[#121218] border border-slate-300 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:border-red-500 transition shadow-sm"
                />
              </div>
            </div>

            {/* 5. Submit Button: Despachar Reporte al PMU */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || Boolean(confirmationMessage)}
                className="w-full min-h-[46px] rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:brightness-110 active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(225,29,72,0.45)] border border-red-400/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                    <span>{t.submitting}</span>
                  </>
                ) : confirmationMessage ? (
                  <>
                    <span className="material-symbols-outlined text-[20px] text-emerald-300">verified</span>
                    <span>{t.successAlert}</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">send</span>
                    <span>{t.submitButton}</span>
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
