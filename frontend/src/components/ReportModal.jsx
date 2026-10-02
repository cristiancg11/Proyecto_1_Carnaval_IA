import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Sparkles, Send, Loader2, MapPin } from 'lucide-react';
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

export function ReportModal({
  isOpen,
  onClose,
  initialCoordinates,
  onReportCreated,
}) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Aglomeracion');
  const [latitude, setLatitude] = useState(1.2136);
  const [longitude, setLongitude] = useState(-77.2811);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successAiRisk, setSuccessAiRisk] = useState(null);

  useEffect(() => {
    if (initialCoordinates) {
      setLatitude(Number(initialCoordinates.lat.toFixed(6)));
      setLongitude(Number(initialCoordinates.lng.toFixed(6)));
    }
  }, [initialCoordinates]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Por favor ingresa un título para el reporte.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessAiRisk(null);

    try {
      const response = await api.createReport({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      });

      setSuccessAiRisk(response.ai_risk_level || 'Bajo');

      setTimeout(() => {
        if (onReportCreated) onReportCreated(response);
        setTitle('');
        setDescription('');
        setSuccessAiRisk(null);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error al enviar reporte:', err);
      setError(
        err.response?.data?.detail || 'No se pudo registrar el reporte. Verifica tu conexión con el servidor.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-lg backdrop-blur-md bg-slate-900/85 border border-white/10 rounded-3xl shadow-2xl shadow-pink-500/10 overflow-hidden">
        {/* Línea neón superior */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 shadow-[0_0_15px_rgba(244,63,94,0.6)]"></div>

        {/* Encabezado del Modal */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-slate-950/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-500 to-violet-600 text-white shadow-lg shadow-pink-500/25 border border-white/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-400 to-cyan-300">
                  Reportar Incidencia
                </h2>
                <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-full centenary-badge text-amber-300">
                  Centenario 2027
                </span>
              </div>
              <p className="text-[11px] text-slate-300">Evaluada automáticamente con Inteligencia Artificial</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 text-xs rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 shadow-md shadow-rose-500/10">
              {error}
            </div>
          )}

          {successAiRisk && (
            <div className="p-3.5 text-xs rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center gap-2 shadow-md shadow-emerald-500/10">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>¡Reporte registrado con éxito! Riesgo evaluado por IA: <strong>{successAiRisk}</strong></span>
            </div>
          )}

          {user && (
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-xs text-slate-300">
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 flex items-center justify-center text-[10px] font-black text-white shrink-0">
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Embotellamiento de carrozas frente a la Plaza"
              className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-950/60 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all shadow-inner"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5">
              Categoría
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-950/90 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
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
              Descripción Adicional
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe lo sucedido para que el análisis de IA evalúe la prioridad y riesgo..."
              className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-950/60 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none transition-all shadow-inner"
            />
          </div>

          {/* Coordenadas */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950/40 border border-white/10">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-400" /> Latitud
              </label>
              <input
                type="number"
                step="any"
                required
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value))}
                className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-400" /> Longitud
              </label>
              <input
                type="number"
                step="any"
                required
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value))}
                className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Botones modernos de acción */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-300 hover:text-white rounded-full bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 transition active:scale-95"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-black rounded-full bg-gradient-to-r from-amber-500 via-pink-500 to-cyan-500 hover:from-amber-600 hover:via-pink-600 hover:to-cyan-600 text-white shadow-md hover:shadow-pink-500/40 active:scale-95 disabled:opacity-50 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
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

