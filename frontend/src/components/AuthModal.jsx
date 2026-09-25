import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  LogIn,
  UserPlus,
  AlertCircle,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function AuthModal({
  isOpen,
  onClose,
  initialTab = 'login',
  promptMessage = null,
  onSuccess = null,
}) {
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showPassword, setShowPassword] = useState(false);

  // Campos de formulario
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Estados visuales
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Sincronizar pestaña inicial al abrir
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setError(null);
    setSuccessMsg(null);
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setError(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Validaciones locales rápidas
    if (!email.trim() || !password.trim()) {
      setError('Por favor completa todos los campos requeridos.');
      return;
    }

    if (activeTab === 'register' && !name.trim()) {
      setError('Por favor ingresa tu nombre completo.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      if (activeTab === 'login') {
        await login(email, password);
        setSuccessMsg('¡Bienvenido de vuelta a CarnavalIA!');
      } else {
        await register(name, email, password);
        setSuccessMsg('¡Cuenta creada exitosamente! Bienvenido al Carnaval.');
      }

      // Cierre automático tras breve confirmación
      setTimeout(() => {
        resetForm();
        if (onSuccess) onSuccess();
        onClose();
      }, 700);
    } catch (err) {
      console.error('Error de autenticación:', err);
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail) && detail[0]?.msg) {
        setError(detail[0].msg);
      } else if (err.response?.status === 401) {
        setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
      } else if (err.response?.status === 400) {
        setError('El correo electrónico ya se encuentra registrado.');
      } else {
        setError('Ocurrió un error al procesar tu solicitud. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-2xl animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-slate-900/80 backdrop-blur-3xl border border-white/15 rounded-3xl shadow-[0_24px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Adorno superior festivo en degradé neón */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-fuchsia-500 to-violet-600 shadow-[0_0_15px_rgba(217,70,239,0.7)]"></div>

        {/* Botón de cierre */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Encabezado con estética del Carnaval */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-fuchsia-600 to-violet-600 shadow-[0_0_25px_rgba(217,70,239,0.5)] border border-white/20 text-2xl mb-3">
              🎭
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"></span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-amber-400 via-rose-300 to-purple-400 bg-clip-text text-transparent">
              CarnavalIA Pasto 2026
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {activeTab === 'login'
                ? 'Accede a tu cuenta ciudadana para participar e interactuar'
                : 'Únete para reportar incidencias y vivir el Carnaval seguro'}
            </p>
          </div>

          {/* Mensaje contextual si fue provocado por una acción protegida */}
          {promptMessage && (
            <div className="mb-5 p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <span>{promptMessage}</span>
            </div>
          )}

          {/* Selector de Pestañas en Cápsula (Login / Registro) */}
          <div className="flex p-1.5 mb-6 bg-white/[0.04] backdrop-blur-xl rounded-full border border-white/10 shadow-inner">
            <button
              type="button"
              onClick={() => handleTabSwitch('login')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-black rounded-full transition-all duration-200 ${
                activeTab === 'login'
                  ? 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-amber-500 text-white shadow-[0_0_20px_rgba(217,70,239,0.5)] scale-[1.02]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Iniciar Sesión</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('register')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-black rounded-full transition-all duration-200 ${
                activeTab === 'register'
                  ? 'bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white shadow-[0_0_20px_rgba(217,70,239,0.5)] scale-[1.02]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Crear Cuenta</span>
            </button>
          </div>

          {/* Feedback de error */}
          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in shadow-[0_0_15px_rgba(244,63,94,0.2)]">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Feedback de éxito */}
          {successMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo: Nombre completo (solo en Registro) */}
            {activeTab === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. María Nariño"
                    className="w-full bg-white/[0.04] border border-white/10 focus:border-fuchsia-500 focus:bg-white/[0.08] focus:ring-4 focus:ring-fuchsia-500/20 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {/* Campo: Correo electrónico */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu.correo@ejemplo.com"
                  className="w-full bg-white/[0.04] border border-white/10 focus:border-fuchsia-500 focus:bg-white/[0.08] focus:ring-4 focus:ring-fuchsia-500/20 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Campo: Contraseña */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-white/[0.04] border border-white/10 focus:border-fuchsia-500 focus:bg-white/[0.08] focus:ring-4 focus:ring-fuchsia-500/20 rounded-2xl pl-11 pr-11 py-3 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Botón de Enviar con brillo y halo de resplandor */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3.5 rounded-full font-black text-xs sm:text-sm text-white bg-gradient-to-r from-violet-600 via-fuchsia-600 to-amber-500 hover:from-violet-500 hover:via-fuchsia-500 hover:to-amber-400 transition-all duration-300 shadow-[0_0_25px_rgba(217,70,239,0.55)] hover:shadow-[0_0_35px_rgba(217,70,239,0.75)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {activeTab === 'login' ? 'Ingresando...' : 'Registrando...'}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>
                    {activeTab === 'login'
                      ? 'Ingresar al Carnaval'
                      : 'Crear Mi Cuenta Ciudadana'}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Toggle de pie de página */}
          <div className="mt-5 text-center text-xs text-slate-400">
            {activeTab === 'login' ? (
              <p>
                ¿Aún no tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => handleTabSwitch('register')}
                  className="font-bold text-fuchsia-400 hover:text-fuchsia-300 underline underline-offset-4 ml-1 transition"
                >
                  Regístrate aquí
                </button>
              </p>
            ) : (
              <p>
                ¿Ya tienes una cuenta?{' '}
                <button
                  type="button"
                  onClick={() => handleTabSwitch('login')}
                  className="font-bold text-fuchsia-400 hover:text-fuchsia-300 underline underline-offset-4 ml-1 transition"
                >
                  Inicia sesión aquí
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
