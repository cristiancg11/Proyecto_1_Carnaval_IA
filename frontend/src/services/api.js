import axios from 'axios';

// URL base del backend desacoplada, obtenida prioritariamente de variables de entorno con fallback en Render
export const BACKEND_URL = (
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  'https://carnavalia-backend.onrender.com'
).trim().replace(/\/+$/, '');

// Base URL para endpoints versionados (/api/v1) evitando dobles barras
export const API_BASE_URL = BACKEND_URL.endsWith('/api/v1')
  ? BACKEND_URL
  : BACKEND_URL.endsWith('/api')
  ? `${BACKEND_URL}/v1`
  : `${BACKEND_URL}/api/v1`;

// URL raíz para endpoints generales (/api)
const API_ROOT_URL = BACKEND_URL.endsWith('/api/v1')
  ? BACKEND_URL.replace(/\/api\/v1$/, '/api')
  : BACKEND_URL.endsWith('/api')
  ? BACKEND_URL
  : `${BACKEND_URL}/api`;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,
});

// Interceptor para inyectar token de autenticación JWT si existe en localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('carnavalia_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Verificación de estado del servidor
  checkHealth: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  },

  // Puntos de Interés (Salud, Policía, Tarimas, Baños, Salidas)
  getPOIs: async () => {
    const response = await apiClient.get('/points-of-interest/');
    return response.data;
  },

  // Reportes ciudadanos de incidencias
  getReports: async (params = {}) => {
    try {
      const response = await axios.get(`${API_ROOT_URL}/reports`, { params });
      return response.data;
    } catch (_) {
      const response = await apiClient.get('/reports/', { params });
      return response.data;
    }
  },

  // Crear nuevo reporte ciudadano (con clasificación de riesgo IA)
  createReport: async (reportData) => {
    try {
      const response = await axios.post(`${API_ROOT_URL}/reports`, reportData);
      return response.data;
    } catch (_) {
      const response = await apiClient.post('/reports/', reportData);
      return response.data;
    }
  },

  // Zonas de riesgo y congestión calculadas dinámicamente
  getZonesRisk: async () => {
    const response = await apiClient.get('/zones/risk');
    return response.data;
  },

  // Chatbot IA (GuaneñaBot / TaitaBot - Gemini)
  sendChatMessage: async ({ message, userLatitude = null, userLongitude = null, userLat = null, userLng = null, selectedDay = null }) => {
    const lat = userLat !== null && userLat !== undefined ? userLat : userLatitude;
    const lng = userLng !== null && userLng !== undefined ? userLng : userLongitude;
    const payload = {
      message,
      user_latitude: lat,
      user_longitude: lng,
      user_lat: lat,
      user_lng: lng,
      selected_day: selectedDay,
    };
    try {
      const response = await apiClient.post('/chat/', payload);
      return response.data;
    } catch (err) {
      const baseUrl = BACKEND_URL.replace(/\/api\/v1\/?$/, '');
      const directResponse = await axios.post(`${baseUrl}/api/chat`, payload);
      return directResponse.data;
    }
  },
};

export default api;
