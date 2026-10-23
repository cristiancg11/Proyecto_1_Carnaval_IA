import React, { useState } from 'react';
import { X, ShieldAlert, Clock, MapPin, Plus, Filter, Sparkles } from 'lucide-react';

export function CitizenReportsModal({
  isOpen,
  onClose,
  reports = [],
  onOpenNewReport,
}) {
  const [filterRisk, setFilterRisk] = useState('todos');

  if (!isOpen) return null;

  const filteredReports = reports.filter((r) => {
    if (filterRisk === 'todos') return true;
    return r.ai_risk_level?.toLowerCase() === filterRisk.toLowerCase();
  });

  const highCount = reports.filter((r) => r.ai_risk_level?.toLowerCase() === 'alto').length;
  const mediumCount = reports.filter((r) => r.ai_risk_level?.toLowerCase() === 'medio').length;
  const lowCount = reports.filter((r) => r.ai_risk_level?.toLowerCase() === 'bajo').length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity duration-200 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 text-slate-100">
        {/* Encabezado */}
        <header className="px-6 py-5 border-b border-white/10 flex items-center justify-between gap-4 bg-slate-950/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20 shrink-0">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-black text-white tracking-tight truncate">
                  Reportes Ciudadanos en la Senda
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 shrink-0">
                  <Sparkles className="w-2.5 h-2.5" />
                  {reports.length} activos
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                Monitoreo colaborativo en tiempo real del Carnaval de Pasto
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenNewReport) onOpenNewReport();
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 shadow-sm active:scale-95 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Reportar</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              aria-label="Cerrar reportes"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Barra de Filtros por Nivel de Riesgo */}
        <div className="px-6 py-3 border-b border-white/5 bg-slate-950/40 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" />
              <span>Filtrar:</span>
            </span>

            <button
              type="button"
              onClick={() => setFilterRisk('todos')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition active:scale-95 cursor-pointer ${
                filterRisk === 'todos'
                  ? 'bg-slate-800 text-white border border-white/20'
                  : 'text-slate-400 hover:text-white bg-white/5'
              }`}
            >
              Todos ({reports.length})
            </button>

            <button
              type="button"
              onClick={() => setFilterRisk('alto')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition active:scale-95 cursor-pointer ${
                filterRisk === 'alto'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 ring-1 ring-rose-500/40'
                  : 'text-rose-400/80 hover:text-rose-300 bg-rose-500/10'
              }`}
            >
              Alto Riesgo ({highCount})
            </button>

            <button
              type="button"
              onClick={() => setFilterRisk('medio')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition active:scale-95 cursor-pointer ${
                filterRisk === 'medio'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 ring-1 ring-amber-500/40'
                  : 'text-amber-400/80 hover:text-amber-300 bg-amber-500/10'
              }`}
            >
              Medio ({mediumCount})
            </button>

            <button
              type="button"
              onClick={() => setFilterRisk('bajo')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition active:scale-95 cursor-pointer ${
                filterRisk === 'bajo'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 ring-1 ring-emerald-500/40'
                  : 'text-emerald-400/80 hover:text-emerald-300 bg-emerald-500/10'
              }`}
            >
              Bajo ({lowCount})
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenNewReport) onOpenNewReport();
            }}
            className="sm:hidden inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500"
          >
            <Plus className="w-3 h-3" />
            <span>+ Reportar</span>
          </button>
        </div>

        {/* Lista de Reportes */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {filteredReports.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <ShieldAlert className="w-8 h-8 mx-auto text-slate-500 mb-2 opacity-50" />
              <p>No hay reportes registrados con este filtro en este momento.</p>
            </div>
          ) : (
            filteredReports.map((report) => {
              const risk = report.ai_risk_level?.toLowerCase() || 'bajo';
              const riskBadge =
                risk === 'alto'
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  : risk === 'medio'
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';

              return (
                <div
                  key={report.id}
                  className="p-4 rounded-2xl bg-slate-950/40 hover:bg-slate-800/50 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between gap-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${riskBadge}`}
                        >
                          Riesgo {report.ai_risk_level || 'Bajo'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                          {report.category || 'Incidencia'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white leading-snug">
                        {report.title}
                      </h4>
                      {report.description && (
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {report.description}
                        </p>
                      )}
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {report.created_at
                        ? new Date(report.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Reciente'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 text-slate-300">
                      <MapPin className="w-3 h-3 text-amber-400" />
                      <span>
                        {report.latitude?.toFixed(4)}, {report.longitude?.toFixed(4)}
                      </span>
                    </span>
                    <span className="font-semibold text-emerald-400">
                      Estado: {report.status || 'Activo'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <footer className="px-6 py-3.5 border-t border-white/10 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Los reportes son analizados y geolocalizados en el mapa del Carnaval</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition cursor-pointer"
          >
            Cerrar
          </button>
        </footer>
      </div>
    </div>
  );
}

export default CitizenReportsModal;
