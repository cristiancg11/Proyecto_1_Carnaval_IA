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
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import InstallPwaPrompt from './InstallPwaPrompt';
import { ChatbotDrawer } from './ChatbotDrawer';

export function LoginView() {
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // Estados de los campos
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Estados de proceso
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleQuickDemoLogin = async () => {
    setEmail('juan@pasto.gov.co');
    setPassword('Password123!');
    setLoading(true);
    setError(null);
    try {
      await login('juan@pasto.gov.co', 'Password123!');
    } catch (err) {
      console.error(err);
      setError('Error al ingresar con la cuenta demo.');
    } finally {
      setLoading(false);
    }
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
      <header className="w-full px-6 py-4 flex items-center justify-between z-10 border-b border-white/10 bg-slate-950/80 backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-500 to-violet-600 shadow-lg shadow-pink-500/25 border border-white/20 text-xl font-black">
            🎭
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-500 to-cyan-400">
                CarnavalIA
              </h1>
              <span className="hidden sm:inline-block px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full centenary-badge text-amber-300">
                Centenario 1927 - 2027
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Carnaval de Negros y Blancos • San Juan de Pasto
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setChatOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 via-pink-500 to-cyan-500 hover:from-amber-600 hover:via-pink-600 hover:to-cyan-600 text-white shadow-md hover:shadow-pink-500/40 active:scale-95 transition-all duration-200 cursor-pointer"
            title="Abrir Chatbot IA"
          >
            <Bot className="w-4 h-4 animate-bounce" />
            <span className="hidden sm:inline">Preguntar a la IA</span>
            <span className="sm:hidden">Chat IA</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          </button>
          <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-lg shadow-rose-500/10">
            Pasto 2026
          </span>
        </div>
      </header>

      {/* Contenido principal: 2 columnas en desktop */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 z-10 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
          {/* Columna Izquierda: Información y propuesta de valor */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            {/* Badge Conmemorativo del Centenario */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full centenary-badge text-xs font-bold text-amber-300 backdrop-blur-md shadow-lg shadow-amber-500/15">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="tracking-wide">✨ Rumbo al Centenario 1927 - 2027 • Patrimonio Cultural Inmaterial de la Humanidad</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                Vive la Senda con{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-500 to-cyan-400">
                  CarnavalIA
                </span>
              </h2>
              <p className="text-base sm:text-lg font-bold text-amber-300/90">
                100 años de juego, memoria, arte y libertad en San Juan de Pasto
              </p>
            </div>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Explora en tiempo real las carrozas, el desfile magno y los cierres viales. Reporta incidencias ciudadanas analizadas con IA, descubre la mejor gastronomía nariñense y recibe rutas peatonales inteligentes.
            </p>

            {/* Tarjetas de características clave en cristal */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-4 rounded-2xl backdrop-blur-md bg-slate-900/75 border border-white/10 text-left hover:border-amber-400/40 hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300 hover:-translate-y-1">
                <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 w-fit mb-3 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                  <MapPin className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black text-white">Senda en Vivo</h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                  Rutas oficiales, cierres viales y puestos seguros.
                </p>
              </div>

              <div className="p-4 rounded-2xl backdrop-blur-md bg-slate-900/75 border border-white/10 text-left hover:border-rose-400/40 hover:shadow-lg hover:shadow-rose-500/20 transition-all duration-300 hover:-translate-y-1">
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 w-fit mb-3 shadow-[0_0_15px_rgba(244,63,94,0.25)]">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black text-white">Reportes con IA</h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                  Análisis inteligente de riesgos ciudadanos.
                </p>
              </div>

              {/* Botón interactivo para probar el Chatbot IA directamente */}
              <button
                type="button"
                onClick={() => setChatOpen(true)}
                className="p-4 rounded-2xl backdrop-blur-md bg-slate-900/75 border border-violet-500/40 hover:border-pink-500/60 text-left hover:bg-slate-900/90 transition-all duration-300 hover:-translate-y-1 shadow-lg shadow-violet-500/20 hover:shadow-pink-500/30 group cursor-pointer w-full ring-1 ring-violet-500/20 active:scale-95"
                title="Abrir Chatbot IA"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-tr from-violet-500/20 to-pink-500/20 border border-violet-500/40 text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.35)] group-hover:scale-110 transition-transform">
                    <Bot className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 animate-pulse">
                    ¡Probar ahora! ✨
                  </span>
                </div>
                <h3 className="text-xs font-black text-white group-hover:text-pink-300 transition-colors flex items-center gap-1.5">
                  <span>Chatbot IA</span>
                  <Sparkles className="w-3 h-3 text-amber-300" />
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                  RAG con Gemini 2.5 Flash y contexto en vivo.
                </p>
              </button>
            </div>
          </div>

          {/* Columna Derecha: Tarjeta de Login / Registro (Dark Andean Festive Glassmorphism) */}
          <div className="lg:col-span-6 flex justify-center w-full">
            <div className="w-full max-w-md backdrop-blur-md bg-slate-900/75 border border-white/10 rounded-3xl shadow-2xl shadow-pink-500/10 p-6 sm:p-8 relative overflow-hidden">
              {/* Barra superior de resplandor neón */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 shadow-[0_0_15px_rgba(244,63,94,0.6)]"></div>

              {/* Selector de Pestañas en Cápsula (Login / Registro) */}
              <div className="flex p-1.5 mb-6 bg-slate-950/60 backdrop-blur-xl rounded-full border border-white/10 shadow-inner">
                <button
                  type="button"
                  onClick={() => handleTabSwitch('login')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-black rounded-full transition-all duration-200 active:scale-95 ${
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
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-black rounded-full transition-all duration-200 active:scale-95 ${
                    activeTab === 'register'
                      ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-violet-600 text-white shadow-md shadow-pink-500/30 scale-[1.02]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Crear Cuenta</span>
                </button>
              </div>

              {/* Título de la pestaña activa */}
              <div className="mb-5">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-white">
                    {activeTab === 'login' ? 'Bienvenido a CarnavalIA' : 'Crea tu Cuenta Ciudadana'}
                  </h3>
                  <span className="text-amber-400 text-xs">✨</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {activeTab === 'login'
                    ? 'Ingresa tus credenciales para explorar la senda y vivir el centenario'
                    : 'Regístrate para reportar alertas en tiempo real y chatear con IA'}
                </p>
              </div>

              {/* Feedback de error */}
              {error && (
                <div className="mb-4 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in shadow-lg shadow-rose-500/10">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Feedback de éxito */}
              {successMsg && (
                <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nombre completo (solo en Registro) */}
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
                        placeholder="Ej. Camila Narváez"
                        className="w-full bg-slate-950/60 border border-white/10 focus:ring-2 focus:ring-pink-500 focus:border-transparent rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-white placeholder-slate-400 outline-none transition-all duration-200 shadow-inner"
                      />
                    </div>
                  </div>
                )}

                {/* Correo Electrónico */}
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
                      placeholder="usuario@carnaval.co"
                      className="w-full bg-slate-950/60 border border-white/10 focus:ring-2 focus:ring-pink-500 focus:border-transparent rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-white placeholder-slate-400 outline-none transition-all duration-200 shadow-inner"
                    />
                  </div>
                </div>

                {/* Contraseña */}
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
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Botón moderno de envío con gradiente multicolor y microinteracción */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-3 py-3.5 rounded-xl font-black text-xs sm:text-sm text-white bg-gradient-to-r from-amber-500 via-pink-500 to-cyan-500 hover:from-amber-600 hover:via-pink-600 hover:to-cyan-600 active:scale-95 transition-all duration-200 shadow-md hover:shadow-pink-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
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

                {/* Acceso Rápido Demo (1 Clic) */}
                {activeTab === 'login' && (
                  <button
                    type="button"
                    onClick={handleQuickDemoLogin}
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-full font-bold text-xs text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400/50 shadow-md shadow-amber-500/10 hover:shadow-amber-500/20 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    title="Ingresar directamente con la cuenta oficial de demostración"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span>⚡ Acceso Rápido Demo (juan@pasto.gov.co)</span>
                  </button>
                )}
              </form>

              {/* Alternar pestañas en el pie */}
              <div className="mt-5 text-center text-xs text-slate-400">
                {activeTab === 'login' ? (
                  <p>
                    ¿Aún no tienes cuenta?{' '}
                    <button
                      type="button"
                      onClick={() => handleTabSwitch('register')}
                      className="font-bold text-pink-400 hover:text-pink-300 underline underline-offset-4 ml-1 transition"
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
                      className="font-bold text-pink-400 hover:text-pink-300 underline underline-offset-4 ml-1 transition"
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

      {/* Asistente IA interactivo disponible desde la pantalla de bienvenida */}
      <ChatbotDrawer
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        userLocation={{ lat: 1.2136, lng: -77.2811 }}
        selectedDay="06-ene"
      />

      {/* Prompt PWA flotante */}
      <InstallPwaPrompt />
    </div>
  );
}

export default LoginView;

