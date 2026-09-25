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
    <div className="min-h-screen w-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden relative selection:bg-rose-500 selection:text-white">
      {/* Fondo con resplandores degradados festivos */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-rose-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[40%] right-[20%] w-[35vw] h-[35vw] rounded-full bg-purple-600/10 blur-[130px] pointer-events-none"></div>

      {/* Barra superior de bienvenida */}
      <header className="w-full px-6 py-4 flex items-center justify-between z-10 border-b border-slate-800/60 bg-slate-950/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-md shadow-rose-500/25 text-xl font-bold">
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

        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">
          Pasto 2026
        </span>
      </header>

      {/* Contenido principal: 2 columnas en desktop */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 z-10 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
          {/* Columna Izquierda: Información y propuesta de valor */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-amber-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Inteligencia Artificial y Seguridad Ciudadana</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Vive el Carnaval con{' '}
              <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-purple-400 bg-clip-text text-transparent">
                tecnología inteligente
              </span>
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Inicia sesión o regístrate para acceder al mapa en tiempo real de la Senda del Carnaval, reportar incidencias ciudadanas analizadas con IA y consultar al Asistente Virtual.
            </p>

            {/* Tarjetas de características clave */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm text-left">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 w-fit mb-2">
                  <MapPin className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white">Senda en Vivo</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tarimas, salud y puntos seguros en Pasto.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm text-left">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 w-fit mb-2">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white">Reportes con IA</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Evaluación automática de riesgos ciudadanos.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm text-left">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 w-fit mb-2">
                  <Bot className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white">Chatbot IA</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Guía interactiva sobre eventos y rutas.
                </p>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Tarjeta de Login / Registro */}
          <div className="lg:col-span-6 flex justify-center w-full">
            <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-2xl border border-rose-500/20 rounded-3xl shadow-2xl shadow-rose-950/40 p-6 sm:p-8 relative overflow-hidden">
              {/* Barra superior degradada */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-rose-500 to-purple-600"></div>

              {/* Selector de Pestañas (Login / Registro) */}
              <div className="flex p-1 mb-6 bg-slate-950/80 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => handleTabSwitch('login')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition ${
                    activeTab === 'login'
                      ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Iniciar Sesión</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTabSwitch('register')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition ${
                    activeTab === 'register'
                      ? 'bg-gradient-to-r from-rose-600 to-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Crear Cuenta</span>
                </button>
              </div>

              {/* Título de la pestaña activa */}
              <div className="mb-5">
                <h3 className="text-xl font-bold text-white">
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
                <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Feedback de éxito */}
              {successMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nombre completo (solo en Registro) */}
                {activeTab === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Nombre Completo
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej. Camila Narváez"
                        className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
                      />
                    </div>
                  </div>
                )}

                {/* Correo Electrónico */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="usuario@carnaval.co"
                      className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
                    />
                  </div>
                </div>

                {/* Contraseña */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Botón de envío */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 transition shadow-lg shadow-rose-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                      className="font-semibold text-rose-400 hover:text-rose-300 underline underline-offset-2 ml-1"
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
                      className="font-semibold text-rose-400 hover:text-rose-300 underline underline-offset-2 ml-1"
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
      <footer className="w-full py-4 text-center text-xs text-slate-500 border-t border-slate-900 bg-slate-950/60 z-10">
        Carnaval de Negros y Blancos de Pasto • Patrimonio Cultural Inmaterial de la Humanidad (UNESCO)
      </footer>

      {/* Prompt PWA flotante */}
      <InstallPwaPrompt />
    </div>
  );
}

export default LoginView;
