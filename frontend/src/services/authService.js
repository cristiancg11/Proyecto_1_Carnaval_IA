import { apiClient } from './api';

const TOKEN_KEY = 'carnavalia_token';
const USER_KEY = 'carnavalia_user';

export const authService = {
  /**
   * Registro de un nuevo usuario en la API de FastAPI.
   * @param {string} name - Nombre completo del usuario
   * @param {string} email - Correo electrónico
   * @param {string} password - Contraseña
   * @returns {Promise<Object>} Datos del token y del usuario creado
   */
  register: async (name, email, password) => {
    const response = await apiClient.post('/auth/register', {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    });

    if (response.data?.access_token) {
      authService.saveSession(response.data.access_token, response.data.user);
    }

    return response.data;
  },

  /**
   * Inicio de sesión de un usuario registrado.
   * @param {string} email - Correo electrónico
   * @param {string} password - Contraseña
   * @returns {Promise<Object>} Datos del token y del usuario autenticado
   */
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', {
      email: email.trim().toLowerCase(),
      password,
    });

    if (response.data?.access_token) {
      authService.saveSession(response.data.access_token, response.data.user);
    }

    return response.data;
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
