import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Send, MapPin, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../services/api';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Encabezado del Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500/20 to-rose-500/20 border border-amber-500/30 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Reportar Incidencia</h2>
              <p className="text-xs text-slate-400">Evaluada automáticamente con Inteligencia Artificial</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
              {error}
            </div>
          )}

          {successAiRisk && (
            <div className="p-3 text-xs rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>¡Reporte registrado con éxito! Riesgo evaluado por IA: <strong>{successAiRisk}</strong></span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Título del Incidente <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Embotellamiento de carrozas frente a la Plaza"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Categoría
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value} className="bg-slate-900">
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Descripción Adicional
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe lo sucedido para que el análisis de IA evalúe la prioridad y riesgo..."
              className="w-full px-3.5 py-2.5 text-sm bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 resize-none"
            />
          </div>

          {/* Coordenadas */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-800">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-400" /> Latitud
              </label>
              <input
                type="number"
                step="any"
                required
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-400" /> Longitud
              </label>
              <input
                type="number"
                step="any"
                required
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:opacity-95 text-white shadow-lg shadow-rose-500/20 active:scale-95 disabled:opacity-50 transition"
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
