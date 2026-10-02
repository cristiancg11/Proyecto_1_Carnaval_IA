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
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 shadow-[0_0_15px_rgba(244,63,94,0.6)]"></div>

        {/* Botón de cierre */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition active:scale-95"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Encabezado con estética del Carnaval y Conmemoración del Centenario */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 rounded-full centenary-badge text-[10px] sm:text-[11px] font-bold text-amber-300 backdrop-blur-md shadow-md shadow-amber-500/10 max-w-full">
              <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="truncate">✨ Rumbo al Centenario 1927 - 2027</span>
            </div>

            <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-500 to-violet-600 shadow-lg shadow-pink-500/25 border border-white/20 text-2xl mb-2">
              🎭
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-500 to-cyan-400">
              CarnavalIA
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              {activeTab === 'login'
                ? 'Ingresa tus credenciales para explorar la Senda y vivir el Carnaval'
                : 'Únete para reportar alertas y chatear con el Asistente IA'}
            </p>
          </div>

          {/* Mensaje contextual si fue provocado por una acción protegida */}
          {promptMessage && (
            <div className="mb-5 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5 shadow-md shadow-amber-500/10">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <span>{promptMessage}</span>
            </div>
          )}

          {/* Selector de Pestañas en Cápsula (Login / Registro) */}
          <div className="flex p-1.5 mb-6 bg-slate-950/60 backdrop-blur-xl rounded-full border border-white/10 shadow-inner">
            <button
              type="button"
              onClick={() => handleTabSwitch('login')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-black rounded-full transition-all duration-200 active:scale-95 ${
                activeTab === 'login'
                  ? 'bg-gradient-to-r from-amber-500 via-pink-500 to-cyan-500 text-white shadow-md shadow-pink-500/30 scale-[1.02]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Iniciar Sesión</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('register')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-black rounded-full transition-all duration-200 active:scale-95 ${
                activeTab === 'register'
                  ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-violet-600 text-white shadow-md shadow-pink-500/30 scale-[1.02]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Crear Cuenta</span>
            </button>
          </div>

          {/* Feedback de error */}
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in shadow-md shadow-rose-500/10">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Feedback de éxito */}
          {successMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in shadow-md shadow-emerald-500/10">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo: Nombre completo (solo en Registro) */}
            {activeTab === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
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
                    className="w-full bg-slate-950/60 border border-white/10 focus:ring-2 focus:ring-pink-500 focus:border-transparent rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-white placeholder-slate-400 outline-none transition-all duration-200 shadow-inner"
                  />
                </div>
              </div>
            )}

            {/* Campo: Correo electrónico */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">
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
                  className="w-full bg-slate-950/60 border border-white/10 focus:ring-2 focus:ring-pink-500 focus:border-transparent rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-white placeholder-slate-400 outline-none transition-all duration-200 shadow-inner"
                />
              </div>
            </div>

            {/* Campo: Contraseña */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">
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
                  className="w-full bg-slate-950/60 border border-white/10 focus:ring-2 focus:ring-pink-500 focus:border-transparent rounded-xl pl-11 pr-11 py-3 text-xs sm:text-sm text-white placeholder-slate-400 outline-none transition-all duration-200 shadow-inner"
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

            {/* Botón de Enviar con gradiente multicolor y microinteracción */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3.5 rounded-xl font-black text-xs sm:text-sm text-white bg-gradient-to-r from-amber-500 via-pink-500 to-cyan-500 hover:from-amber-600 hover:via-pink-600 hover:to-cyan-600 active:scale-95 transition-all duration-200 shadow-md hover:shadow-pink-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
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
