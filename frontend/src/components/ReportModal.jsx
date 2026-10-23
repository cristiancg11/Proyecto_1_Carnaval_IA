import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Sparkles, Send, Loader2, MapPin, Locate } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { value: 'Aglomeracion', label: '👥 Aglomeración Masiva' },
  { value: 'Emergencia', label: '🚑 Emergencia Médica' },
  { value: 'Calle_Bloqueada', label: '🚧 Calle Bloqueada' },
  { value: 'Persona_Perdida', label: '🔍 Persona Perdida' },
  { value: 'Objeto_Perdido', label: '🎒 Objeto Extraviado' },
  { value: 'Riesgo', label: '⚠️ Riesgo General' },
];

const DEFAULT_PASTO_LAT = 1.2136;
const DEFAULT_PASTO_LNG = -77.2811;

export function ReportModal({
  isOpen,
  onClose,
  initialCoordinates,
  userGps,
  onReportCreated,
}) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Aglomeracion');
  const [latitude, setLatitude] = useState(DEFAULT_PASTO_LAT);
  const [longitude, setLongitude] = useState(DEFAULT_PASTO_LNG);
  const [loading, setLoading] = useState(false);
  const [locatingGps, setLocatingGps] = useState(false);
  const [error, setError] = useState(null);
  const [successAiRisk, setSuccessAiRisk] = useState(null);

  // Inicializar o sincronizar coordenadas cada vez que el modal se abre
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessAiRisk(null);
      setLoading(false);

      if (initialCoordinates && typeof initialCoordinates.lat === 'number') {
        setLatitude(Number(initialCoordinates.lat.toFixed(6)));
        setLongitude(Number(initialCoordinates.lng.toFixed(6)));
      } else if (userGps && typeof userGps.lat === 'number') {
        setLatitude(Number(userGps.lat.toFixed(6)));
        setLongitude(Number(userGps.lng.toFixed(6)));
      } else {
        setLatitude(DEFAULT_PASTO_LAT);
        setLongitude(DEFAULT_PASTO_LNG);
      }
    }
  }, [isOpen, initialCoordinates, userGps]);

  if (!isOpen) return null;

  // Botón para capturar coordenadas GPS reales del dispositivo
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      setLocatingGps(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(Number(pos.coords.latitude.toFixed(6)));
          setLongitude(Number(pos.coords.longitude.toFixed(6)));
          setLocatingGps(false);
        },
        (err) => {
          console.warn('No se pudo obtener geolocalización:', err);
          setLocatingGps(false);
          if (userGps) {
            setLatitude(Number(userGps.lat.toFixed(6)));
            setLongitude(Number(userGps.lng.toFixed(6)));
          } else {
            setError('No fue posible obtener el GPS. Puedes ingresar las coordenadas manualmente.');
          }
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else if (userGps) {
      setLatitude(Number(userGps.lat.toFixed(6)));
      setLongitude(Number(userGps.lng.toFixed(6)));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessAiRisk(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Por favor ingresa un título para la incidencia.');
      return;
    }

    if (cleanTitle.length < 3) {
      setError('El título debe tener al menos 3 caracteres.');
      return;
    }

    const parseCoord = (val) => {
      if (typeof val === 'number') return isNaN(val) ? NaN : val;
      if (!val) return NaN;
      return parseFloat(String(val).trim().replace(',', '.'));
    };

    const latNum = parseCoord(latitude);
    const lngNum = parseCoord(longitude);
    if (isNaN(latNum) || isNaN(lngNum)) {
      setError('Las coordenadas geográficas deben ser números válidos.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.createReport({
        title: cleanTitle,
        description: description.trim() || undefined,
        category,
        latitude: latNum,
        longitude: lngNum,
      });

      // Notificar de inmediato al mapa para que agregue el marcador
      if (onReportCreated) {
        onReportCreated(response);
      }

      setSuccessAiRisk(response.ai_risk_level || 'Bajo');

      // Cerrar y limpiar tras breve confirmación visual
      setTimeout(() => {
        setTitle('');
        setDescription('');
        setSuccessAiRisk(null);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error al enviar reporte:', err);
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail) && detail[0]?.msg) {
        setError(detail[0].msg);
      } else if (typeof detail === 'object' && detail?.message) {
        setError(detail.message);
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('El servidor tardó demasiado en responder. Por favor intenta de nuevo.');
      } else if (!err.response) {
        setError('No se pudo conectar con el servidor (127.0.0.1:8000). Asegúrate de que el backend esté ejecutándose.');
      } else {
        setError(`Error del servidor (${err.response?.status || 'desconocido'}). Intenta nuevamente.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-[#0b1120]/85 backdrop-blur-2xl animate-fadeIn">
      <div className="relative w-full max-w-lg backdrop-blur-2xl bg-slate-900/95 border border-cyan-500/25 rounded-3xl shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)] overflow-hidden text-slate-100">
        {/* Línea neón superior con gradiente festivo */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6)]"></div>

        {/* Encabezado del Modal */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#0b1120]/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 text-white shadow-lg shadow-cyan-500/25 border border-white/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300">
                  Reportar Incidencia
                </h2>
                <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-full centenary-badge text-cyan-300">
                  Centenario 2027
                </span>
              </div>
              <p className="text-[11px] text-slate-300">Evaluada automáticamente con Inteligencia Artificial</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition active:scale-95 cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 text-xs rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 shadow-md shadow-rose-500/10">
              {error}
            </div>
          )}

          {successAiRisk && (
            <div className="p-3.5 text-xs rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center gap-2 shadow-md shadow-emerald-500/10 animate-pulse">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>¡Reporte registrado con éxito! Riesgo evaluado por IA: <strong className="text-white underline">{successAiRisk}</strong></span>
            </div>
          )}

          {user && (
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-xs text-slate-300">
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-[10px] font-black text-white shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="truncate">
                Reportando como: <strong className="text-white font-bold">{user.name}</strong> ({user.email})
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5">
              Título del Incidente <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={150}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Embotellamiento de carrozas frente a la Plaza"
              className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-950/60 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all shadow-inner"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5">
              Categoría
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-950/90 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value} className="bg-slate-900 text-white">
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5">
              Descripción Adicional (Opcional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe lo sucedido para que el análisis de IA evalúe la prioridad y riesgo..."
              className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-950/60 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none transition-all shadow-inner"
            />
          </div>

          {/* Coordenadas Geográficas con botón de GPS automático */}
          <div className="p-3.5 rounded-xl bg-slate-950/50 border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Ubicación del Incidente
              </span>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={locatingGps}
                className="flex items-center gap-1 text-[11px] font-bold text-cyan-300 hover:text-cyan-200 bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-1 rounded-lg border border-cyan-500/20 transition active:scale-95 cursor-pointer"
                title="Detectar y usar mi posición GPS actual"
              >
                <Locate className={`w-3 h-3 ${locatingGps ? 'animate-spin text-cyan-400' : ''}`} />
                <span>{locatingGps ? 'Detectando...' : 'Usar mi GPS'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                  Latitud
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                  Longitud
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-300 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 border border-white/10 transition active:scale-95 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-black tracking-wide rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:via-indigo-500 hover:to-cyan-400 text-white shadow-lg shadow-cyan-500/30 active:scale-95 disabled:opacity-50 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analizando con IA...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Enviar Reporte</span>
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
