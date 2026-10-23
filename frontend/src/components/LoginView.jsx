import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LoginView() {
  const { login, register } = useAuth();
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
        setError('Este correo electrónico ya se encuentra registrado.');
      } else {
        setError('No fue posible conectar con el servidor. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsRegister((prev) => !prev);
    setError(null);
  };

  const handleQuickDemo = async () => {
    setEmail('juan@pasto.gov.co');
    setPassword('Password123!');
    setError(null);
    setLoading(true);
    try {
      await login('juan@pasto.gov.co', 'Password123!');
    } catch (err) {
      console.error(err);
      setError('Error al ingresar con la cuenta de demostración.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden select-none">
      {/* Fondo sutil con resplandor suave */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Tarjeta centrada con estilo pulido */}
      <div className="relative w-full max-w-sm sm:max-w-md p-8 sm:p-9 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl z-10">
        {/* Encabezado e identidad */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-800/80 border border-white/10 text-2xl mb-3 shadow-sm">
            🎭
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Carnaval<span className="text-amber-400">IA</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {isRegister
              ? 'Crea tu cuenta para acceder a la Senda'
              : 'Inicia sesión para acceder a la Senda'}
          </p>
        </div>

        {/* Alerta de error elegante */}
        {error && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-200"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="flex-1 font-medium leading-tight">{error}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo Nombre en Registro */}
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nombre completo
              </label>
              <input
                id="register-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full px-4 py-2.5 bg-slate-950/70 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 transition duration-200"
              />
            </div>
          )}

          {/* Campo de Correo Electrónico */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@carnavalia.co"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 transition duration-200"
              />
            </div>
          </div>

          {/* Campo de Contraseña */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-10 pr-11 py-2.5 bg-slate-950/70 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 transition duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition p-1 rounded-xl cursor-pointer"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Botón Principal de Acción */}
          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-2xl font-bold text-sm text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-[0.99] shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>{isRegister ? 'Creando cuenta...' : 'Iniciando sesión...'}</span>
              </>
            ) : (
              <span>{isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}</span>
            )}
          </button>
        </form>

        {/* Enlace inferior simple para alternar entre Login y Registro */}
        <div className="mt-6 pt-5 border-t border-white/10 text-center text-xs text-slate-400">
          {isRegister ? (
            <p>
              ¿Ya tienes cuenta?{' '}
              <button
                type="button"
                onClick={handleToggleMode}
                className="font-bold text-amber-400 hover:text-amber-300 transition cursor-pointer ml-1"
              >
                Iniciar sesión
              </button>
            </p>
          ) : (
            <p>
              ¿No tienes cuenta?{' '}
              <button
                type="button"
                onClick={handleToggleMode}
                className="font-bold text-amber-400 hover:text-amber-300 transition cursor-pointer ml-1"
              >
                Regístrate aquí
              </button>
            </p>
          )}
        </div>

        {/* Botón rápido demo para sustentación */}
        {!isRegister && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleQuickDemo}
              disabled={loading}
              className="text-[11px] text-slate-500 hover:text-amber-400 transition cursor-pointer font-medium"
            >
              ⚡ Ingresar con cuenta de demostración
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginView;
