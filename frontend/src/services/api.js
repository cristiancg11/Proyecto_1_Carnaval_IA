import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

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
    const response = await apiClient.get('/reports/', { params });
    return response.data;
  },

  // Crear nuevo reporte ciudadano (con clasificación de riesgo IA)
  createReport: async (reportData) => {
    const response = await apiClient.post('/reports/', reportData);
    return response.data;
  },

  // Zonas de riesgo y congestión calculadas dinámicamente
  getZonesRisk: async () => {
    const response = await apiClient.get('/zones/risk');
    return response.data;
  },

  // Chatbot IA (Gemini 2.5 Flash con RAG)
  sendChatMessage: async ({ message, userLatitude = null, userLongitude = null, userLat = null, userLng = null, selectedDay = null }) => {
    const lat = userLat !== null && userLat !== undefined ? userLat : userLatitude;
    const lng = userLng !== null && userLng !== undefined ? userLng : userLongitude;
    const response = await apiClient.post('/chat/', {
      message,
      user_latitude: lat,
      user_longitude: lng,
      user_lat: lat,
      user_lng: lng,
      selected_day: selectedDay,
    });
    return response.data;
  },
};

export default api;

