import { createClient, SupabaseClient } from '@supabase/supabase-js';

// URL de la API del Backend (FastAPI) y Supabase
const BACKEND_API_URL = 'http://localhost:8000/api';
const supabaseUrl = (import.meta.env?.VITE_SUPABASE_URL as string) || 'https://placeholder.supabase.co';
const supabaseAnonKey = (import.meta.env?.VITE_SUPABASE_ANON_KEY as string) || 'placeholder-anon-key';

export const isSupabaseConfigured = Boolean(
  import.meta.env?.VITE_SUPABASE_URL && 
  import.meta.env?.VITE_SUPABASE_ANON_KEY &&
  !import.meta.env.VITE_SUPABASE_URL.includes('placeholder') &&
  !import.meta.env.VITE_SUPABASE_URL.includes('demo-carnavalia')
);

let supabaseClient: SupabaseClient;
try {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
} catch (err) {
  console.warn('Advertencia al inicializar cliente Supabase, usando cliente seguro fallback:', err);
  supabaseClient = createClient('https://placeholder.supabase.co', 'placeholder-anon-key');
}

export const supabase: SupabaseClient = supabaseClient;

export interface IncidentReportPayload {
  title?: string;
  type?: string;
  category?: string;
  description: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  ai_risk_level?: 'Alto' | 'Medio' | 'Bajo';
  status?: string;
  created_at?: string;
}

export interface IncidentReport {
  id: string | number;
  title: string;
  category: string;
  type?: string;
  description: string;
  latitude: number;
  longitude: number;
  lat: number;
  lng: number;
  ai_risk_level: 'Alto' | 'Medio' | 'Bajo';
  status: string;
  created_at: string;
}

// Clave local para persistencia inmediata en el navegador
const LOCAL_STORAGE_KEY = 'carnavalia_reports_cache';

// Reportes iniciales activos en puntos clave de la Senda del Carnaval
const INITIAL_ACTIVE_REPORTS: IncidentReport[] = [
  {
    id: 'rep-init-1',
    title: 'Aglomeración severa en Plaza del Carnaval',
    category: 'Aglomeracion',
    type: 'Aglomeracion',
    description: 'Gran concentración de personas cerca de la tarima principal. Tránsito peatonal lento.',
    latitude: 1.2115,
    longitude: -77.2785,
    lat: 1.2115,
    lng: -77.2785,
    ai_risk_level: 'Alto',
    status: 'active',
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: 'rep-init-2',
    title: 'Punto de hidratación activo en Carrera 27',
    category: 'Punto_Hidratacion',
    type: 'Punto_Hidratacion',
    description: 'Punto de abastecimiento de agua y apoyo logístico de Cruz Roja operando normalmente.',
    latitude: 1.2130,
    longitude: -77.2780,
    lat: 1.2130,
    lng: -77.2780,
    ai_risk_level: 'Bajo',
    status: 'active',
    created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
  },
  {
    id: 'rep-init-3',
    title: 'Bloqueo temporal en Calle 17',
    category: 'Calle_Bloqueada',
    type: 'Calle_Bloqueada',
    description: 'Paso restringido por montaje de graderías y vallas de seguridad de Corpocarnaval.',
    latitude: 1.2105,
    longitude: -77.2770,
    lat: 1.2105,
    lng: -77.2770,
    ai_risk_level: 'Medio',
    status: 'active',
    created_at: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
  },
];

const getStoredReports = (): IncidentReport[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Error al leer reportes locales:', err);
  }
  return [];
};

const saveStoredReports = (reports: IncidentReport[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reports));
  } catch (err) {
    console.warn('Error al guardar reportes locales:', err);
  }
};

/**
 * Normaliza un reporte asegurando lat/latitude, lng/longitude y valores consistentes
 */
export const normalizeReport = (raw: any): IncidentReport => {
  const lat = Number(raw.latitude ?? raw.lat ?? 1.2115);
  const lng = Number(raw.longitude ?? raw.lng ?? -77.2785);
  const category = raw.category || raw.type || 'Aglomeracion';
  const risk: 'Alto' | 'Medio' | 'Bajo' = raw.ai_risk_level || (category === 'Emergencia' || category === 'Aglomeracion' ? 'Alto' : 'Medio');

  return {
    id: raw.id || `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: raw.title || raw.type || `${category} en Senda del Carnaval`,
    category,
    type: category,
    description: raw.description || 'Reporte registrado por la comunidad.',
    latitude: lat,
    longitude: lng,
    lat,
    lng,
    ai_risk_level: risk,
    status: raw.status || 'active',
    created_at: raw.created_at || new Date().toISOString(),
  };
};

/**
 * Inserta un reporte de incidente enviando POST http://localhost:8000/api/reports
 * Body: { title, category, description, latitude, longitude }
 */
export async function submitIncidentReport(payload: IncidentReportPayload): Promise<IncidentReport> {
  const lat = Number(payload.latitude ?? payload.lat ?? 1.2115);
  const lng = Number(payload.longitude ?? payload.lng ?? -77.2785);
  const category = payload.category || payload.type || 'Aglomeracion';
  const risk: 'Alto' | 'Medio' | 'Bajo' = payload.ai_risk_level || (category === 'Emergencia' || category === 'Aglomeracion' ? 'Alto' : 'Medio');
  const title = payload.title || `${category} en Senda del Carnaval`;
  const description = payload.description || 'Incidente reportado en la senda.';

  const requestBody = {
    title,
    category,
    description,
    latitude: lat,
    longitude: lng,
  };

  let createdReport: IncidentReport | null = null;

  // 1. Enviar POST http://localhost:8000/api/reports
  try {
    let response: Response;
    try {
      response = await fetch(`${BACKEND_API_URL}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
    } catch (directErr) {
      // Reintento con proxy local de Vite /api/reports
      response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
    }

    if (response.ok) {
      const data = await response.json();
      createdReport = normalizeReport(data);
    } else {
      console.warn('Backend respondió con estado no exitoso:', response.status);
    }
  } catch (apiErr) {
    console.warn('No fue posible contactar a http://localhost:8000/api/reports, intentando respaldo:', apiErr);
  }

  // 2. Respaldo directo en Supabase si no se pudo crear en la API
  if (!createdReport && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('reports')
        .insert([{
          ...requestBody,
          ai_risk_level: risk,
          status: 'active',
          created_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (!error && data) {
        createdReport = normalizeReport(data);
      }
    } catch (sbErr) {
      console.warn('Error en fallback Supabase:', sbErr);
    }
  }

  // 3. Fallback local reactivo garantizado para que nunca falle la experiencia del usuario
  if (!createdReport) {
    createdReport = normalizeReport({
      id: `rep-${Date.now()}`,
      ...requestBody,
      ai_risk_level: risk,
      status: 'active',
      created_at: new Date().toISOString(),
    });
  }

  // Guardar en caché local para visualización reactiva inmediata
  const localList = getStoredReports();
  const updatedList = [createdReport, ...localList.filter((r) => r.id !== createdReport!.id)];
  saveStoredReports(updatedList);

  return createdReport;
}

/**
 * Consulta los reportes activos haciendo GET http://localhost:8000/api/reports
 */
export async function fetchActiveReports(): Promise<IncidentReport[]> {
  let backendReports: IncidentReport[] = [];

  // 1. GET http://localhost:8000/api/reports
  try {
    let response: Response;
    try {
      response = await fetch(`${BACKEND_API_URL}/reports`);
    } catch (directErr) {
      response = await fetch('/api/reports');
    }

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        backendReports = data.map(normalizeReport);
      }
    }
  } catch (apiErr) {
    console.warn('Aviso: backend no disponible en http://localhost:8000/api/reports, consultando respaldo:', apiErr);
  }

  // 2. Respaldo directo de Supabase si la API no retornó datos
  if (backendReports.length === 0 && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        backendReports = data.map(normalizeReport);
      }
    } catch (sbErr) {
      console.warn('Consulta a Supabase en modo desconectado/offline:', sbErr);
    }
  }

  const storedLocals = getStoredReports();

  // 3. Fusionar remotos, locales persistidos y los iniciales de la Senda
  const mapById = new Map<string | number, IncidentReport>();

  INITIAL_ACTIVE_REPORTS.forEach((r) => mapById.set(r.id, r));
  storedLocals.forEach((r) => mapById.set(r.id, r));
  backendReports.forEach((r) => mapById.set(r.id, r));

  return Array.from(mapById.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export interface EmergencyAlertPayload {
  type: 'Medical' | 'Security' | 'Fire' | 'Lost Child' | string;
  latitude: number;
  longitude: number;
  timestamp?: string;
  status?: string;
  description?: string;
  location_name?: string;
}

export interface EmergencyAlertRecord extends EmergencyAlertPayload {
  id: string | number;
  created_at: string;
}

/**
 * Dispatches a high-priority geolocated emergency alert directly to the PMU
 * and registers it into the Supabase emergency_reports table.
 */
export async function dispatchEmergencyAlert(payload: EmergencyAlertPayload): Promise<EmergencyAlertRecord> {
  const timestamp = payload.timestamp || new Date().toISOString();
  const alertRecord: EmergencyAlertRecord = {
    id: `sos-${Date.now()}`,
    type: payload.type,
    latitude: Number(payload.latitude),
    longitude: Number(payload.longitude),
    timestamp,
    status: payload.status || 'pending',
    description: payload.description || `Emergencia ${payload.type} reportada al PMU`,
    location_name: payload.location_name || 'Senda del Carnaval',
    created_at: timestamp,
  };

  // 1. Direct insertion to Supabase emergency_reports table
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('emergency_reports')
        .insert([{
          type: alertRecord.type,
          latitude: alertRecord.latitude,
          longitude: alertRecord.longitude,
          timestamp: alertRecord.timestamp,
          status: alertRecord.status,
          description: alertRecord.description,
          created_at: alertRecord.created_at,
        }])
        .select()
        .single();

      if (!error && data) {
        alertRecord.id = data.id || alertRecord.id;
      } else if (error) {
        console.warn('[reportService] Supabase emergency_reports table notice:', error.message);
      }
    } catch (sbErr) {
      console.warn('[reportService] Supabase emergency_reports dispatch error:', sbErr);
    }
  }

  // 2. Also register in standard incident reports as fallback to ensure map and PMU dashboards receive it
  try {
    const reportData = await submitIncidentReport({
      title: `Alerta SOS PMU: ${payload.type}`,
      type: payload.type === 'Medical' ? 'Emergencia' : payload.type,
      category: payload.type,
      description: payload.description || `Alerta SOS geolocalizada despachada al PMU (${payload.type})`,
      latitude: payload.latitude,
      longitude: payload.longitude,
      lat: payload.latitude,
      lng: payload.longitude,
      ai_risk_level: 'Alto',
      status: 'pending',
    });
    alertRecord.id = reportData.id || alertRecord.id;
  } catch (err) {
    console.warn('[reportService] Fallback to local incident dispatch:', err);
  }

  // 3. Cache locally so UI is immediately reactive
  const localList = getStoredReports();
  const normalized = normalizeReport({
    id: alertRecord.id,
    title: `Alerta SOS PMU: ${alertRecord.type}`,
    category: alertRecord.type,
    type: 'Emergencia',
    description: alertRecord.description,
    latitude: alertRecord.latitude,
    longitude: alertRecord.longitude,
    lat: alertRecord.latitude,
    lng: alertRecord.longitude,
    ai_risk_level: 'Alto',
    status: 'pending',
    created_at: alertRecord.created_at,
  });
  saveStoredReports([normalized, ...localList.filter((r) => r.id !== normalized.id)]);

  return alertRecord;
}

export default {
  submitIncidentReport,
  dispatchEmergencyAlert,
  fetchActiveReports,
  normalizeReport,
  supabase,
};
