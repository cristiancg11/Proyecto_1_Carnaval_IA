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
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1100] w-[90%] max-w-sm sm:max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="relative flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-rose-500/40 shadow-2xl shadow-rose-950/70 text-slate-100">
        {/* Adorno degradado superior */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-rose-500 to-purple-600 rounded-t-2xl"></div>

        {/* Icono e Información */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 shadow-md shadow-rose-500/30 text-white shrink-0">
            <Smartphone className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>

          <div className="min-w-0">
            <p className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
              <span>CarnavalIA Pasto 2026</span>
              <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              Disponible sin conexión • Acceso directo en pantalla
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 shadow-lg shadow-rose-500/25 active:scale-95 transition"
            title="Instalar la aplicación en tu dispositivo"
          >
            <Download className="w-3.5 h-3.5" />
            <span>📲 Instalar App</span>
          </button>

          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
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
