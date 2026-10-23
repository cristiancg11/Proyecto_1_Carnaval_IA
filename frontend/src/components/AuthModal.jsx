import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function AuthModal({
  isOpen,
  onClose,
  initialTab = 'login',
  onSuccess = null,
}) {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(initialTab === 'register');
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setIsRegister(initialTab === 'register');
      setError(null);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

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
      if (onSuccess) onSuccess();
      onClose();
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
        setError('Este correo electrónico ya está registrado.');
      } else {
        setError('No fue posible conectar con el servidor. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm sm:max-w-md p-8 sm:p-9 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-800/80 border border-white/10 text-2xl mb-3 shadow-sm">
            🎭
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Carnaval<span className="text-amber-400">IA</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {isRegister ? 'Crea tu cuenta de visitante' : 'Inicia sesión para continuar'}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="flex-1 font-medium leading-tight">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nombre completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full px-4 py-2.5 bg-slate-950/70 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 transition duration-200"
              />
            </div>
          )}

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
                placeholder="ejemplo@carnavalia.co"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 transition duration-200"
              />
            </div>
          </div>

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
                className="w-full pl-10 pr-11 py-2.5 bg-slate-950/70 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 transition duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition p-1 rounded-xl cursor-pointer"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
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

        <div className="mt-6 pt-5 border-t border-white/10 text-center text-xs text-slate-400">
          {isRegister ? (
            <p>
              ¿Ya tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setError(null);
                }}
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
                onClick={() => {
                  setIsRegister(true);
                  setError(null);
                }}
                className="font-bold text-amber-400 hover:text-amber-300 transition cursor-pointer ml-1"
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

export default AuthModal;
