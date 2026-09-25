import React, { useState } from 'react';
import {
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
  MapPin,
  ShieldAlert,
  Bot,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import InstallPwaPrompt from './InstallPwaPrompt';

export function LoginView() {
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);

  // Estados de los campos
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Estados de proceso
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setError(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

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
      } else {
        await register(name, email, password);
        setSuccessMsg('¡Registro exitoso! Iniciando tu experiencia...');
      }
    } catch (err) {
      console.error('Error durante la autenticación:', err);
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
        setError('No fue posible conectar con el servidor. Verifica tu conexión.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden relative selection:bg-fuchsia-500 selection:text-white">
      {/* Fondo con resplandores degradados festivos modernos */}
      <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-fuchsia-600/15 blur-[140px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-amber-500/12 blur-[130px] pointer-events-none"></div>
      <div className="absolute top-[35%] right-[15%] w-[40vw] h-[40vw] rounded-full bg-violet-600/15 blur-[150px] pointer-events-none"></div>

      {/* Barra superior de bienvenida */}
      <header className="w-full px-6 py-4 flex items-center justify-between z-10 border-b border-white/[0.08] bg-slate-950/60 backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-fuchsia-600 to-violet-600 shadow-[0_0_20px_rgba(217,70,239,0.45)] border border-white/20 text-xl font-black">
            🎭
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black bg-gradient-to-r from-amber-400 via-rose-300 to-purple-400 bg-clip-text text-transparent">
              CarnavalIA
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Carnaval de Negros y Blancos • San Juan de Pasto
            </p>
          </div>
        </div>

        <span className="px-3.5 py-1 rounded-full text-xs font-black bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
          Pasto 2026
        </span>
      </header>

      {/* Contenido principal: 2 columnas en desktop */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 z-10 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
          {/* Columna Izquierda: Información y propuesta de valor */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-xs font-bold text-amber-300 backdrop-blur-md shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Inteligencia Artificial y Seguridad Ciudadana</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Vive el Carnaval con{' '}
              <span className="bg-gradient-to-r from-amber-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
                tecnología inteligente
              </span>
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Inicia sesión o regístrate para acceder al mapa en tiempo real de la Senda del Carnaval, reportar incidencias ciudadanas analizadas con IA y consultar al Asistente Virtual.
            </p>

            {/* Tarjetas de características clave en cristal */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-4 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl text-left hover:border-white/20 transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
                <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 w-fit mb-3 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                  <MapPin className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black text-white">Senda en Vivo</h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                  Tarimas, salud y puntos seguros en Pasto.
                </p>
              </div>

              <div className="p-4 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl text-left hover:border-white/20 transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
                <div className="p-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 w-fit mb-3 shadow-[0_0_15px_rgba(244,63,94,0.25)]">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black text-white">Reportes con IA</h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                  Evaluación automática de riesgos ciudadanos.
                </p>
              </div>

              <div className="p-4 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl text-left hover:border-white/20 transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
                <div className="p-2.5 rounded-2xl bg-violet-500/15 border border-violet-500/30 text-violet-300 w-fit mb-3 shadow-[0_0_15px_rgba(139,92,246,0.25)]">
                  <Bot className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black text-white">Chatbot IA</h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                  Guía interactiva sobre eventos y rutas.
                </p>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Tarjeta de Login / Registro (Glass Panel 2026) */}
          <div className="lg:col-span-6 flex justify-center w-full">
            <div className="w-full max-w-md bg-slate-900/70 backdrop-blur-3xl border border-white/15 rounded-3xl shadow-[0_24px_60px_-15px_rgba(0,0,0,0.8)] p-6 sm:p-8 relative overflow-hidden">
              {/* Barra superior de resplandor neón */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-fuchsia-500 to-violet-600 shadow-[0_0_15px_rgba(217,70,239,0.7)]"></div>

              {/* Selector de Pestañas en Cápsula (Login / Registro) */}
              <div className="flex p-1.5 mb-6 bg-white/[0.04] backdrop-blur-xl rounded-full border border-white/10 shadow-inner">
                <button
                  type="button"
                  onClick={() => handleTabSwitch('login')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-black rounded-full transition-all duration-200 ${
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
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-black rounded-full transition-all duration-200 ${
                    activeTab === 'register'
                      ? 'bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white shadow-[0_0_20px_rgba(217,70,239,0.5)] scale-[1.02]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Crear Cuenta</span>
                </button>
              </div>

              {/* Título de la pestaña activa */}
              <div className="mb-5">
                <h3 className="text-xl font-black text-white">
                  {activeTab === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta ciudadana'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {activeTab === 'login'
                    ? 'Ingresa tus credenciales para acceder a la aplicación'
                    : 'Regístrate para interactuar con la senda del carnaval'}
                </p>
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
                {/* Nombre completo (solo en Registro) */}
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
                        placeholder="Ej. Camila Narváez"
                        className="w-full bg-white/[0.04] border border-white/10 focus:border-fuchsia-500 focus:bg-white/[0.08] focus:ring-4 focus:ring-fuchsia-500/20 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Correo Electrónico */}
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
                      placeholder="usuario@carnaval.co"
                      className="w-full bg-white/[0.04] border border-white/10 focus:border-fuchsia-500 focus:bg-white/[0.08] focus:ring-4 focus:ring-fuchsia-500/20 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Contraseña */}
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
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Botón moderno de envío con brillo y halo de resplandor */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-3 py-3.5 rounded-full font-black text-xs sm:text-sm text-white bg-gradient-to-r from-violet-600 via-fuchsia-600 to-amber-500 hover:from-violet-500 hover:via-fuchsia-500 hover:to-amber-400 transition-all duration-300 shadow-[0_0_25px_rgba(217,70,239,0.55)] hover:shadow-[0_0_35px_rgba(217,70,239,0.75)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{activeTab === 'login' ? 'Ingresando...' : 'Registrando...'}</span>
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

              {/* Alternar pestañas en el pie */}
              <div className="mt-5 text-center text-xs text-slate-400">
                {activeTab === 'login' ? (
                  <p>
                    ¿Aún no tienes cuenta?{' '}
                    <button
                      type="button"
                      onClick={() => handleTabSwitch('register')}
                      className="font-bold text-fuchsia-400 hover:text-fuchsia-300 underline underline-offset-4 ml-1 transition"
                    >
                      Regístrate gratis
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
      </main>

      {/* Pie de página */}
      <footer className="w-full py-4 text-center text-xs text-slate-500 border-t border-white/[0.06] bg-slate-950/80 z-10">
        Carnaval de Negros y Blancos de Pasto • Patrimonio Cultural Inmaterial de la Humanidad (UNESCO)
      </footer>

      {/* Prompt PWA flotante */}
      <InstallPwaPrompt />
    </div>
  );
}

export default LoginView;

