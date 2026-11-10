import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, Compass, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LoginView() {
  const { login, register, loginAsGuest } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError('Por favor completa todos los campos requeridos.');
      return;
    }

    if (trimmedPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        const userName = name.trim() || trimmedEmail.split('@')[0].replace(/[._]/g, ' ');
        await register(userName, trimmedEmail, trimmedPassword);
      } else {
        await login(trimmedEmail, trimmedPassword);
      }
      localStorage.setItem('carnavalia_session', 'active');
    } catch (err) {
      console.error('Error de autenticación:', err);
      const detail = err.detail || err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail) && detail[0]?.msg) {
        setError(detail[0].msg);
      } else if (err.status === 401 || err.response?.status === 401) {
        setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
      } else if (err.status === 400 || err.response?.status === 400) {
        setError('Este correo electrónico ya se encuentra registrado.');
      } else {
        setError(err.message || 'No fue posible conectar con el servidor. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsRegister((prev) => !prev);
    setError(null);
  };

  const handleGuestLogin = () => {
    setError(null);
    localStorage.setItem('carnavalia_session', 'active');
    loginAsGuest();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-slate-100 text-slate-900 dark:bg-[#08080a] dark:text-neutral-100 relative overflow-hidden select-none">
      {/* 1. Fondo Atmosférico de Alto Contraste con Iluminación Ambiental Dorada/Neón */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-100 via-slate-200/50 to-slate-100 dark:from-[#08080a] dark:via-[#0b0b10] dark:to-[#08080a] pointer-events-none" />

      {/* Orbes de resplandor ambiental ámbar y oro (sin tonos rojos) */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-yellow-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/5 rounded-full blur-[160px] pointer-events-none" />

      {/* Trama de cuadrícula técnica sutil */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:28px_28px]" />

      {/* Elementos culturales y de telemetría flotantes sutiles */}
      <div className="absolute top-8 left-8 hidden lg:flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-neutral-500">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>SISTEMA GIS PASTO · EN LÍNEA</span>
      </div>
      <div className="absolute bottom-8 right-8 hidden lg:flex items-center gap-3 text-xs font-mono text-slate-500 dark:text-neutral-500">
        <span>UNESCO ICH-00256</span>
        <span>•</span>
        <span className="text-yellow-600 dark:text-yellow-400/80 font-bold">SENDA 7.5 KM</span>
      </div>

      {/* 2. Tarjeta Central (Card Glassmorphic Web Desktop) */}
      <div className="w-full max-w-md bg-white border border-slate-200 text-slate-900 dark:bg-[#0c0c10]/95 dark:border-yellow-500/30 dark:text-white backdrop-blur-2xl rounded-2xl p-8 shadow-2xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex flex-col gap-6 relative z-10 transition-all duration-300">
        
        {/* 3. Encabezado de la Tarjeta */}
        <div className="flex flex-col items-center text-center">
          {/* Icono Distintivo */}
          <div className="w-12 h-12 rounded-xl bg-yellow-400 flex items-center justify-center shadow-[0_0_20px_rgba(250,204,21,0.45)] text-stone-950 mb-3">
            <span className="material-symbols-outlined text-[#1a1400] text-[28px] font-bold">theater_comedy</span>
          </div>

          {/* Subtítulo / Badge de Telemetría */}
          <span className="text-[11px] font-mono text-yellow-600 dark:text-yellow-400 uppercase tracking-widest font-semibold mb-1">
            Plataforma SIG Pasto · UNESCO
          </span>

          {/* Título Principal */}
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {isRegister ? 'Registro CarnavalIA' : 'Acceso CarnavalIA'}
          </h1>

          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 max-w-xs">
            {isRegister
              ? 'Crea tu cuenta ciudadana para colaborar y monitorear la fiesta magna'
              : 'Ingresa para interactuar con la Senda del Carnaval y GuaneñaBot'}
          </p>
        </div>

        {/* Alerta de Error */}
        {error && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-red-100 border border-red-300 text-red-800 dark:bg-red-950/40 dark:border-red-500/40 dark:text-red-200 text-xs flex items-center gap-2.5 animate-in fade-in duration-200 shadow-sm"
          >
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span className="flex-1 font-medium leading-tight">{error}</span>
          </div>
        )}

        {/* 4. Formulario de Acceso */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Campo Nombre en Registro */}
          {isRegister && (
            <div>
              <label
                htmlFor="register-name"
                className="text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider block mb-1.5"
              >
                Nombre Completo
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-neutral-500" />
                <input
                  id="register-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Camila Narváez"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 dark:bg-[#161620] dark:border-[#272735] dark:text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-neutral-500"
                />
              </div>
            </div>
          )}

          {/* Campo de Correo Electrónico */}
          <div>
            <label
              htmlFor="login-email"
              className="text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider block mb-1.5"
            >
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-neutral-500" />
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@carnavalia.co"
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 dark:bg-[#161620] dark:border-[#272735] dark:text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-neutral-500"
              />
            </div>
          </div>

          {/* Campo de Contraseña */}
          <div>
            <label
              htmlFor="login-password"
              className="text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider block mb-1.5"
            >
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-neutral-500" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 dark:bg-[#161620] dark:border-[#272735] dark:text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 rounded-xl pl-10 pr-11 py-3 text-sm outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-neutral-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500 hover:text-yellow-600 dark:hover:text-yellow-400 transition p-1 rounded-lg cursor-pointer"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 5. Botón Principal (Submit) */}
          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-stone-950 font-extrabold text-sm tracking-wide shadow-[0_0_20px_rgba(250,204,21,0.4)] border border-yellow-200 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                <span>{isRegister ? 'Creando cuenta...' : 'Verificando credenciales...'}</span>
              </>
            ) : (
              <span>{isRegister ? 'Crear Cuenta y Entrar' : 'Iniciar Sesión'}</span>
            )}
          </button>

          {/* Separador Técnico */}
          <div className="relative my-2 flex items-center justify-center">
            <div className="border-t border-slate-200 dark:border-[#1e1e28] w-full" />
            <span className="bg-white dark:bg-[#0c0c10] px-3 text-[10px] text-slate-500 dark:text-neutral-500 uppercase tracking-widest font-mono font-semibold select-none">
              o acceso libre
            </span>
            <div className="border-t border-slate-200 dark:border-[#1e1e28] w-full" />
          </div>

          {/* Botón Secundario: Modo Turista / Invitado */}
          <button
            id="guest-login-btn"
            type="button"
            onClick={handleGuestLogin}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs font-mono text-yellow-700 bg-yellow-50 hover:bg-yellow-100 border border-yellow-300 hover:border-yellow-400 dark:text-yellow-300 dark:bg-yellow-500/10 dark:hover:bg-yellow-500/15 dark:border-yellow-500/30 dark:hover:border-yellow-400/50 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm group"
            title="Explorar el Carnaval como Turista sin iniciar sesión"
          >
            <Compass className="w-4 h-4 text-yellow-500 dark:text-yellow-400 group-hover:rotate-45 transition-transform" />
            <span>ENTRAR COMO TURISTA / INVITADO</span>
          </button>
        </form>

        {/* 6. Pie y Enlaces Secundarios */}
        <div className="pt-4 border-t border-slate-200 dark:border-[#1e1e28] text-center text-xs text-slate-500 dark:text-neutral-400">
          {isRegister ? (
            <p>
              ¿Ya tienes una cuenta registrada?{' '}
              <button
                type="button"
                onClick={handleToggleMode}
                className="font-bold text-yellow-600 hover:text-yellow-500 dark:text-yellow-400 dark:hover:text-yellow-300 transition cursor-pointer ml-1 underline decoration-yellow-500/40 underline-offset-4"
              >
                Iniciar Sesión
              </button>
            </p>
          ) : (
            <p>
              ¿No tienes una cuenta aún?{' '}
              <button
                type="button"
                onClick={handleToggleMode}
                className="font-bold text-yellow-600 hover:text-yellow-500 dark:text-yellow-400 dark:hover:text-yellow-300 transition cursor-pointer ml-1 underline decoration-yellow-500/40 underline-offset-4"
              >
                Regístrate aquí
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export { LoginView as LoginModal };
export default LoginView;
