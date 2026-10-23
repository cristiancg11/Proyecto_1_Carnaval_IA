import React, { useState, useEffect } from 'react';
import { Download, X, Sparkles, Smartphone } from 'lucide-react';

export function InstallPwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Si ya está ejecutándose en modo standalone (instalada), no registrar listener
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      // Prevenir el mini-infobar por defecto en móviles
      e.preventDefault();
      // Guardar el evento para dispararlo cuando el usuario haga clic
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('CarnavalIA PWA fue instalada exitosamente');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Mostrar el cuadro de diálogo de instalación nativo
    await deferredPrompt.prompt();

    // Esperar la respuesta del usuario
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      console.log('El usuario aceptó instalar la PWA de CarnavalIA');
      setIsInstallable(false);
    } else {
      console.log('El usuario declinó la instalación');
    }

    setDeferredPrompt(null);
  };

  if (!isInstallable || dismissed) {
    return null;
  }

  return (
    <aside
      aria-label="Aviso de instalación de la aplicación"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1100] w-[92%] max-w-sm sm:max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="relative flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-3xl bg-slate-900/90 backdrop-blur-2xl border border-cyan-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-slate-100">
        {/* Adorno degradado superior neón */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 rounded-t-3xl shadow-[0_0_12px_rgba(6,182,212,0.7)]"></div>

        {/* Icono e Información */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 shadow-lg shadow-cyan-500/25 border border-white/20 text-white shrink-0">
            <Smartphone className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
            </span>
          </div>

          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5 truncate">
              <span>CarnavalIA Pasto 2026</span>
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            </p>
            <p className="text-[11px] text-slate-300 truncate">
              Disponible sin conexión • Acceso directo
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-black text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:via-indigo-500 hover:to-cyan-400 shadow-lg shadow-cyan-500/25 active:scale-95 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
            title="Instalar la aplicación en tu dispositivo"
          >
            <Download className="w-4 h-4" />
            <span>Instalar</span>
          </button>

          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
            title="Descartar aviso"
            aria-label="Cerrar aviso de instalación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default InstallPwaPrompt;
