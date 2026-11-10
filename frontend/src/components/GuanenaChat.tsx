import React, { useState, useRef, useEffect, useCallback, useTransition, useDeferredValue } from 'react';
import { X, Send, Sparkles, RotateCcw, Compass, MapPin, Navigation, Bot, User } from 'lucide-react';
import {
  sendMessageToGuanena,
  ChatHistoryTurn,
  CarnavalSchedule,
  NearbyPlace,
} from '../services/carnavalApi';
import { useRealtimeLocation } from '../hooks/useRealtimeLocation';
import { findBestPOIForQuery } from '../data/pastoPOIs';
import { getStreetRoute } from '../services/routingService';
import { poiWorkerClient } from '../services/poiWorkerClient';
import { scheduleNextFrame, scheduleMicrotask } from '../utils/performance';
import { getTranslation, Language } from '../utils/i18n';

export interface GuanenaChatProps {
  onRouteReceived?: (
    waypoints: [number, number][],
    shouldDrawRoute: boolean,
    title?: string,
    schedule?: CarnavalSchedule | null,
    nearbyPlaces?: NearbyPlace[]
  ) => void;
  onFocusSenda?: () => void;
  onSelectDestination?: (targetCoords: [number, number], targetName: string) => void;
  className?: string;
  isOpen?: boolean;
  onToggle?: () => void;
  lang?: Language;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  waypoints?: [number, number][];
  shouldDrawRoute?: boolean;
  schedule?: CarnavalSchedule | null;
  nearbyPlaces?: NearbyPlace[];
}

const DEFAULT_SUGGESTIONS: string[] = [
  '¿Cuál es el recorrido de la Familia Castañeda?',
  '¿Cómo llego a la Plaza del Carnaval?',
  '¿Cuál es el trayecto del Desfile Magno del 6 de Enero?',
  '¿Dónde hay puestos de salud y primeros auxilios?',
  '¿Dónde comer un buen cuy tradicional?',
];

function formatInlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-amber-300">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="italic text-slate-200">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-slate-950/60 text-amber-300 font-mono text-[11px] border border-white/10">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function MarkdownMessage({ content }: { content: string }) {
  const lines = (content || '').split('\n');
  return (
    <div className="space-y-1.5 leading-relaxed text-xs sm:text-[13px]">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-bold text-amber-300 text-sm mt-2 mb-1">
              {trimmed.substring(4)}
            </h4>
          );
        }
        if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
          return (
            <h3 key={idx} className="font-extrabold text-amber-400 text-sm sm:text-base mt-2 mb-1">
              {trimmed.replace(/^#+\s*/, '')}
            </h3>
          );
        }

        const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ');
        if (isBullet) {
          const itemText = trimmed.replace(/^[\*\-•]\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-1.5 ml-1">
              <span className="text-amber-400 font-bold shrink-0">•</span>
              <span>{formatInlineMarkdown(itemText)}</span>
            </div>
          );
        }

        return <p key={idx}>{formatInlineMarkdown(trimmed)}</p>;
      })}
    </div>
  );
}

export const GuanenaChat: React.FC<GuanenaChatProps> = ({
  onRouteReceived,
  onFocusSenda,
  onSelectDestination,
  className = '',
  isOpen: propIsOpen,
  onToggle: propOnToggle,
  lang: propLang,
}) => {
  const { location, centerOnMe } = useRealtimeLocation();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = propIsOpen !== undefined ? propIsOpen : internalIsOpen;

  const currentLang = propLang || (typeof window !== 'undefined' ? (localStorage.getItem('carnavalia-lang') as Language) || 'ES' : 'ES');
  const [activeLang, setActiveLang] = useState<Language>(currentLang);

  useEffect(() => {
    if (propLang) {
      setActiveLang(propLang);
    }
  }, [propLang]);

  useEffect(() => {
    const handleLangChange = (e: CustomEvent<Language> | any) => {
      const newLang = e.detail?.language || e.detail;
      if (newLang === 'ES' || newLang === 'EN') {
        setActiveLang(newLang);
      }
    };
    window.addEventListener('language-change', handleLangChange as EventListener);
    return () => {
      window.removeEventListener('language-change', handleLangChange as EventListener);
    };
  }, []);

  const t = getTranslation(activeLang).guanena;

  const toggleOpen = useCallback(() => {
    if (propOnToggle) {
      propOnToggle();
    } else {
      setInternalIsOpen((prev) => !prev);
    }
  }, [propOnToggle]);

  useEffect(() => {
    const handleToggle = () => toggleOpen();
    const handleOpen = () => {
      if (propOnToggle) {
        if (!isOpen) propOnToggle();
      } else {
        setInternalIsOpen(true);
      }
    };
    window.addEventListener('toggle-guanena-chat', handleToggle);
    window.addEventListener('open-guanena-chat', handleOpen);
    return () => {
      window.removeEventListener('toggle-guanena-chat', handleToggle);
      window.removeEventListener('open-guanena-chat', handleOpen);
    };
  }, [toggleOpen, propOnToggle, isOpen]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-init',
      role: 'model',
      content: t.greeting,
      timestamp: activeLang === 'ES' ? 'Ahora' : 'Just now',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(t.suggestions || DEFAULT_SUGGESTIONS);
  const [isPending, startUiTransition] = useTransition();
  const deferredInput = useDeferredValue(inputMessage);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome-init') {
        return [
          {
            id: 'welcome-init',
            role: 'model',
            content: t.greeting,
            timestamp: activeLang === 'ES' ? 'Ahora' : 'Just now',
          },
        ];
      }
      return prev;
    });
    setSuggestedQuestions(t.suggestions || DEFAULT_SUGGESTIONS);
  }, [activeLang, t.greeting, t.suggestions]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, loading]);

  const dispatchRouteToMap = useCallback((
    waypoints: [number, number][],
    title?: string,
    schedule?: CarnavalSchedule | null,
    nearbyPlaces?: NearbyPlace[]
  ) => {
    if (!Array.isArray(waypoints) || waypoints.length < 2) return;

    // Disparar evento global para componentes de mapa
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('DRAW_GEMINI_ROUTE', {
          detail: {
            waypoints,
            route_coordinates: waypoints,
            should_draw_route: true,
            title: title || 'Ruta del Carnaval',
            schedule: schedule || null,
            nearby_places: nearbyPlaces || [],
          },
        })
      );
      window.dispatchEvent(
        new CustomEvent('TRIGGER_NAVIGATION', {
          detail: {
            targetCoords: waypoints[waypoints.length - 1],
            targetName: title || 'Destino de Carnaval',
            coords: waypoints,
            schedule: schedule || null,
            nearby_places: nearbyPlaces || [],
          },
        })
      );
    }

    if (onRouteReceived) {
      onRouteReceived(waypoints, true, title, schedule, nearbyPlaces);
    }
  }, [onRouteReceived]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || loading) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    // 1. Offload reactive spatial intent detection to the dedicated Web Worker (Haversine & spatial index)
    const userOrigin: [number, number] = (location?.lat && location?.lng) 
      ? [location.lat, location.lng] 
      : [1.2138, -77.2818];

    let matchedPoiResult = null;
    try {
      matchedPoiResult = await poiWorkerClient.findBestPOIAsync(query, userOrigin);
    } catch (e) {
      console.warn('[GuanenaChat] Worker query fallback to local index:', e);
      matchedPoiResult = findBestPOIForQuery(query, userOrigin);
    }

    if (matchedPoiResult) {
      try {
        const { poi, reply } = matchedPoiResult;
        let routeCoords: [number, number][] = [userOrigin, poi.coords];
        try {
          const streetPath = await getStreetRoute(userOrigin, poi.coords);
          if (Array.isArray(streetPath) && streetPath.length >= 2) {
            routeCoords = streetPath;
          }
        } catch (err) {
          console.warn('[GuanenaChat] Fallback OSRM directo:', err);
        }

        const botMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: 'model',
          content: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          waypoints: routeCoords,
          shouldDrawRoute: true,
        };

        // Use React 18+ startTransition and queueMicrotask to prevent Long Tasks (>50ms) and keep INP < 200ms
        startUiTransition(() => {
          setMessages((prev) => [...prev, botMessage]);
          setLoading(false);
        });

        scheduleMicrotask(() => {
          if (onSelectDestination) {
            onSelectDestination(poi.coords, poi.name);
          }
          dispatchRouteToMap(routeCoords, poi.name);

          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('route-to-poi', {
                detail: {
                  targetCoords: poi.coords,
                  targetName: poi.name,
                  sector: poi.sector,
                  category: poi.category,
                  path: routeCoords,
                  startCoords: userOrigin,
                },
              })
            );
            window.dispatchEvent(
              new CustomEvent('TRIGGER_NAVIGATION', {
                detail: {
                  targetCoords: poi.coords,
                  targetName: poi.name,
                  originCoords: userOrigin,
                  coords: routeCoords,
                },
              })
            );
            window.dispatchEvent(
              new CustomEvent('highlight-poi', {
                detail: {
                  coords: poi.coords,
                  name: poi.name,
                  category: poi.category,
                  sector: poi.sector,
                  zoom: 17,
                },
              })
            );
            window.dispatchEvent(
              new CustomEvent('FOCUS_MAP_BOUNDS', {
                detail: { coordinates: routeCoords },
              })
            );
          }
        });

        return;
      } catch (err) {
        console.warn('[GuanenaChat] Error en manejo de intención espacial:', err);
      }
    }

    // 2. Si no es una consulta espacial directa, consultar a Gemini 2.5 Flash
    // Formatear historial para el backend de Gemini
    const historyPayload: ChatHistoryTurn[] = messages
      .filter((m) => m.id !== 'welcome-init')
      .slice(-6)
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    try {
      const response = await sendMessageToGuanena(query, historyPayload, {
        lat: location.lat,
        lng: location.lng,
      });

      const routeCoords = response.route_coordinates && response.route_coordinates.length >= 2
        ? response.route_coordinates
        : response.waypoints;

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        waypoints: routeCoords,
        shouldDrawRoute: response.should_draw_route || Boolean(routeCoords && routeCoords.length >= 2),
        schedule: response.schedule,
        nearbyPlaces: response.nearby_places,
      };

      setMessages((prev) => [...prev, botMessage]);

      // Sincronizar inmediatamente la telemetría GIS (línea y pines) al mapa y auto-centrar límites con flyToBounds
      if (routeCoords && routeCoords.length >= 2) {
        dispatchRouteToMap(routeCoords, query, response.schedule, response.nearby_places);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('FOCUS_MAP_BOUNDS', {
              detail: { coordinates: routeCoords },
            })
          );
        }
        if (onFocusSenda) onFocusSenda();
      } else if (response.schedule || (response.nearby_places && response.nearby_places.length > 0)) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('DRAW_GEMINI_ROUTE', {
              detail: {
                waypoints: routeCoords || [],
                route_coordinates: routeCoords || [],
                should_draw_route: response.should_draw_route,
                title: query,
                schedule: response.schedule,
                nearby_places: response.nearby_places,
              },
            })
          );
        }
        if (onRouteReceived) {
          onRouteReceived(routeCoords || [], response.should_draw_route, query, response.schedule, response.nearby_places);
        }
      }

      // Actualizar chips de preguntas sugeridas
      if (Array.isArray(response.suggested_questions) && response.suggested_questions.length > 0) {
        setSuggestedQuestions(response.suggested_questions);
      }
    } catch (error) {
      console.error('[GuanenaChat] Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: activeLang === 'ES'
          ? '¡Qué pena, paisano! Hubo un detalle al consultar el servidor. Pero no te preocupés: puedes explorar la Senda directamente en el mapa.'
          : 'Sorry, there was a temporary issue contacting the server. You can still explore the Senda and POIs directly on the map!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetConversation = () => {
    setMessages([
      {
        id: 'welcome-init',
        role: 'model',
        content: activeLang === 'ES'
          ? '¡Conversación reiniciada! ¿Qué recorrido o punto del Carnaval querés que exploremos ahora?'
          : 'Conversation reset! Which Carnival route or POI would you like to explore now?',
        timestamp: activeLang === 'ES' ? 'Ahora' : 'Just now',
      },
    ]);
    setSuggestedQuestions(t.suggestions || DEFAULT_SUGGESTIONS);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('CLEAR_MAP_ROUTE'));
    }
  };

  return (
    <>
      {/* 1. Botón Flotante (FAB) Neón Pasto */}
      {!isOpen && (
        <button
          id="guanena-fab-button"
          type="button"
          onClick={() => toggleOpen()}
          className="fixed bottom-6 right-6 z-[9999] pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-stone-950 font-bold shadow-[0_0_25px_rgba(250,204,21,0.5)] border border-yellow-200 active:scale-95 transition-all cursor-pointer group select-none"
          aria-label={activeLang === 'ES' ? 'Abrir chat de GuaneñaBot' : 'Open GuaneñaBot chat'}
          title="GuaneñaBot • Asistente Inteligente del Carnaval de Pasto"
        >
          <span className="material-symbols-outlined text-[20px] text-[#1a1400]">smart_toy</span>
          <span className="text-xs font-bold tracking-tight">GuaneñaBot AI</span>
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
        </button>
      )}

      {/* 2. Cajón de Chat Glassmorphic Desplegable (HUD Stitch) */}
      {isOpen && (
        <aside
          role="complementary"
          aria-label={activeLang === 'ES' ? 'Ventana de GuaneñaBot' : 'GuaneñaBot Window'}
          className={`fixed bottom-6 right-4 sm:right-6 z-[9999] pointer-events-auto w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[82vh] rounded-2xl bg-white/95 dark:bg-[#0c0c10]/95 border border-slate-300 dark:border-yellow-500/35 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 ${className}`}
        >
          {/* Header con estilo Stitch */}
          <div className="p-3 bg-slate-100 dark:bg-[#14141c] border-b border-slate-200 dark:border-[#222230] flex items-center justify-between select-none">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-yellow-400 flex items-center justify-center text-stone-950 font-bold shadow-[0_0_12px_rgba(250,204,21,0.4)]">
                <span className="material-symbols-outlined text-[18px]">smart_toy</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-slate-900 dark:text-white font-bold tracking-tight">GuaneñaBot</span>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-yellow-400/20 text-yellow-600 dark:text-yellow-300 border border-yellow-400/30">
                    2.5 FLASH
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-neutral-400 font-mono">
                  {activeLang === 'ES' ? 'Conectado a Red SIG Pasto' : 'Connected to Pasto GIS Network'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleResetConversation}
                className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition cursor-pointer"
                title={activeLang === 'ES' ? 'Reiniciar conversación' : 'Reset conversation'}
                aria-label={activeLang === 'ES' ? 'Reiniciar conversación' : 'Reset conversation'}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => toggleOpen()}
                className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition cursor-pointer"
                title={activeLang === 'ES' ? 'Minimizar GuaneñaBot' : 'Minimize GuaneñaBot'}
                aria-label={activeLang === 'ES' ? 'Cerrar chat' : 'Close chat'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body: Historial de Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar bg-slate-50/50 dark:bg-transparent">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div className={`flex items-end gap-2 max-w-[88%] ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {!isUser && (
                      <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-amber-500/30 flex items-center justify-center text-xs shrink-0 mb-1 shadow-md">
                        🎭
                      </div>
                    )}

                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed shadow-md ${isUser
                          ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white font-medium rounded-tr-none shadow-rose-900/40'
                          : 'bg-white dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 rounded-tl-none font-normal'
                        }`}
                    >
                      <MarkdownMessage content={msg.content} />

                      {/* Resumen de Horarios de la Senda en la Burbuja */}
                      {!isUser && msg.schedule && (
                        <div className="my-2.5 p-3 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-amber-500/35 shadow-lg shadow-black/10 dark:shadow-black/50 text-slate-900 dark:text-white font-sans select-none">
                          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-1.5 mb-2">
                            <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400 text-xs">
                              <span>🎭</span>
                              <span className="uppercase tracking-wide">
                                {msg.schedule.event_name || (activeLang === 'ES' ? 'Telemetría de la Senda' : 'Senda Telemetry')}
                              </span>
                            </div>
                            {msg.schedule.distance_km && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono text-[10px] font-bold">
                                {msg.schedule.distance_km}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-300 dark:border-emerald-500/25">
                              <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold mb-0.5">
                                <span>🚩</span>
                                <span className="uppercase text-[9px] tracking-wider">{activeLang === 'ES' ? 'Salida' : 'Start'}</span>
                              </div>
                              <p className="font-semibold text-slate-800 dark:text-white leading-tight truncate" title={msg.schedule.start_location}>
                                {msg.schedule.start_location}
                              </p>
                              <p className="text-emerald-600 dark:text-emerald-300 font-mono text-[10px] mt-0.5">
                                {activeLang === 'ES' ? 'Hora' : 'Time'}: {msg.schedule.start_time}
                              </p>
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-300 dark:border-amber-500/25">
                              <div className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-bold mb-0.5">
                                <span>🏁</span>
                                <span className="uppercase text-[9px] tracking-wider">{activeLang === 'ES' ? 'Llegada' : 'Finish'}</span>
                              </div>
                              <p className="font-semibold text-slate-800 dark:text-white leading-tight truncate" title={msg.schedule.finish_location}>
                                {msg.schedule.finish_location}
                              </p>
                              <p className="text-amber-600 dark:text-amber-300 font-mono text-[10px] mt-0.5">
                                Est: {msg.schedule.estimated_arrival_time}
                              </p>
                            </div>
                          </div>

                          {Array.isArray(msg.nearbyPlaces) && msg.nearbyPlaces.length > 0 && (
                            <div className="mt-2 pt-1.5 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                              <span>{activeLang === 'ES' ? 'Puntos de apoyo activos:' : 'Active support points:'}</span>
                              <span className="text-cyan-600 dark:text-cyan-300 font-bold">
                                ✨ {msg.nearbyPlaces.length} {activeLang === 'ES' ? 'servicios en mapa' : 'services on map'}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Botón interactivo para ver trazado y reenfocar la vista del mapa */}
                      {!isUser && msg.waypoints && msg.waypoints.length >= 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            dispatchRouteToMap(msg.waypoints!, undefined, msg.schedule, msg.nearbyPlaces);
                            if (onFocusSenda) onFocusSenda();
                            if (typeof window !== 'undefined') {
                              window.dispatchEvent(
                                new CustomEvent('FOCUS_MAP_BOUNDS', {
                                  detail: {
                                    coordinates: msg.waypoints,
                                    title: msg.schedule?.event_name || 'Senda del Carnaval',
                                  },
                                })
                              );
                            }
                          }}
                          className="mt-2.5 w-full py-2 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-black text-xs shadow-md shadow-orange-600/30 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Navigation className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                          <span>{activeLang === 'ES' ? '📍 Ver trazado en el mapa' : '📍 View path on map'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <span className={`text-[9px] text-slate-400 dark:text-slate-500 mt-1 font-mono ${isUser ? 'pr-1' : 'pl-9'}`}>
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {/* Indicador de Escritura de Alta Fidelidad */}
            {loading && (
              <div className="flex flex-col items-start animate-in fade-in duration-200">
                <div className="flex items-end gap-2 max-w-[88%]">
                  <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-amber-500/30 flex items-center justify-center text-xs shrink-0 mb-1">
                    🎭
                  </div>
                  <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-none bg-white dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2 shadow-sm">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-[11px] text-amber-600 dark:text-amber-300 font-medium">
                      {activeLang === 'ES' ? 'GuaneñaBot está consultando la ruta del Carnaval...' : 'GuaneñaBot is consulting the Carnival route...'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chips de Preguntas Sugeridas Clickeables (suggested_questions) */}
          <div className="px-3.5 py-2 bg-slate-100/90 dark:bg-slate-950/80 border-t border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={`sug-${idx}`}
                  type="button"
                  onClick={() => handleSendMessage(q)}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-900/90 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-slate-700 dark:text-slate-200 hover:text-amber-800 dark:hover:text-amber-300 border border-slate-300 dark:border-white/10 hover:border-amber-400/50 text-[11px] font-semibold whitespace-nowrap active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 shadow-sm"
                  title={q}
                >
                  <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                  <span>{q}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Input de Texto en Píldora con Botón Circular y Degradado */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 border-t border-slate-200 dark:border-white/10 bg-slate-100/95 dark:bg-slate-950/95 flex items-center gap-2"
          >
            <input
              id="guanena-chat-input-live"
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={t.placeholder}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-white/10 rounded-full text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition disabled:opacity-50"
            />
            <button
              id="guanena-chat-send-btn-live"
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="w-10 h-10 rounded-full bg-yellow-400 hover:bg-yellow-300 text-stone-950 font-bold active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-[0_0_15px_rgba(250,204,21,0.4)] flex items-center justify-center shrink-0"
              aria-label={t.send}
              title={t.send}
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
        </aside>
      )}
    </>
  );
};

export { GuanenaChat as ChatBot, GuanenaChat as GuanenaBot, GuanenaChat as GuaneñaBot };
export default GuanenaChat;

