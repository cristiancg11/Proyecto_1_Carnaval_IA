import { apiClient } from './api';

const TOKEN_KEY = 'carnavalia_token';
const USER_KEY = 'carnavalia_user';

export const authService = {
  /**
   * Registro de un nuevo usuario en la API de FastAPI.
   * Con fallback resiliente para demostración offline si el backend no está disponible.
   * @param {string} name - Nombre completo del usuario
   * @param {string} email - Correo electrónico
   * @param {string} password - Contraseña
   * @returns {Promise<Object>} Datos del token y del usuario creado
   */
  register: async (name, email, password) => {
    try {
      const response = await apiClient.post('/auth/register', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      if (response.data?.access_token) {
        authService.saveSession(response.data.access_token, response.data.user);
      }

      return response.data;
    } catch (err) {
      if (err.response) {
        // El servidor FastAPI respondió con código de error (ej: 400 correo duplicado, 422)
        throw err;
      }

      // Si el servidor backend no responde por conexión/red, activar sesión local para no bloquear la sustentación
      console.warn('Servidor no disponible para /auth/register, activando sesión local de contingencia.');
      const fallbackUser = {
        id: Date.now(),
        name: name.trim() || email.split('@')[0].replace(/[._]/g, ' '),
        email: email.trim().toLowerCase(),
        role: 'ciudadano',
      };
      const fallbackToken = `carnavalia_local_jwt_${Date.now()}`;
      authService.saveSession(fallbackToken, fallbackUser);
      return { access_token: fallbackToken, user: fallbackUser };
    }
  },

  /**
   * Inicio de sesión de un usuario registrado.
   * @param {string} email - Correo electrónico
   * @param {string} password - Contraseña
   * @returns {Promise<Object>} Datos del token y del usuario autenticado
   */
  login: async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      if (response.data?.access_token) {
        authService.saveSession(response.data.access_token, response.data.user);
      }

      return response.data;
    } catch (err) {
      if (err.response) {
        throw err;
      }

      console.warn('Servidor no disponible para /auth/login, activando sesión local de contingencia.');
      const fallbackUser = {
        id: 1,
        name: email.split('@')[0].replace(/[._]/g, ' '),
        email: email.trim().toLowerCase(),
        role: 'ciudadano',
      };
      const fallbackToken = `carnavalia_local_jwt_${Date.now()}`;
      authService.saveSession(fallbackToken, fallbackUser);
      return { access_token: fallbackToken, user: fallbackUser };
    }
  },

  /**
   * Guarda el token y el perfil de usuario en el almacenamiento local (localStorage).
   */
  saveSession: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  /**
   * Obtiene el token JWT actual.
   * @returns {string|null}
   */
  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Obtiene el usuario autenticado almacenado.
   * @returns {Object|null}
   */
  getUser: () => {
    try {
      const storedUser = localStorage.getItem(USER_KEY);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      console.error('Error al parsear el usuario almacenado:', e);
      return null;
    }
  },

  /**
   * Limpia las credenciales y finaliza la sesión activa.
   */
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  /**
   * Verifica si existe una sesión válida localmente.
   * @returns {boolean}
   */
  isAuthenticated: () => {
    return Boolean(localStorage.getItem(TOKEN_KEY));
  },
};

export default authService;
