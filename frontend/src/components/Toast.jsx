import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export function Toast({ message, type = 'success', onClose }) {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-20 right-6 z-[3000] flex items-center gap-3 px-4 py-3 rounded-2xl backdrop-blur-xl bg-white/95 text-slate-900 border border-slate-200 dark:bg-slate-900/90 dark:text-white dark:border-slate-700/50 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300"
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-aqua-500/20 text-aqua-600 dark:text-aqua-400 border border-aqua-500/30 shrink-0">
        {type === 'success' ? (
          <CheckCircle2 className="w-4 h-4 text-aqua-600 dark:text-aqua-400" />
        ) : type === 'error' ? (
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
        ) : (
          <Info className="w-4 h-4 text-aqua-600 dark:text-aqua-400" />
        )}
      </div>

      <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 pr-2">
        {message}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
          aria-label="Cerrar notificación"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default Toast;
