import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, RotateCcw, MessageSquare, MapPin, Navigation } from 'lucide-react';
import { findCarnavalLandmark, CARNAVAL_LANDMARKS } from '../../data/carnavalKnowledge';
import { searchPastoPOI, findBestPOIForQuery, PASTO_POIS, PointOfInterest, dispatchGuanenaAction } from '../../data/pastoPOIs';
import { poiWorkerClient } from '../../services/poiWorkerClient';
import { getStreetRoute } from '../../services/routingService';
import { sendGuanenaMessage } from '../../services/guanenaChatService';
import { parseBotIntent, dispatchParadeIntent } from '../../services/botIntentParser';

export interface GuanenaBotProps {
  onFocusSenda?: () => void;
  onFocusLandmark?: (coords: [number, number], name?: string) => void;
  onSelectDestination?: (targetCoords: [number, number], targetName: string) => void;
}

export interface QuickSuggestion {
  id: string;
  icon: string;
  label: string;
  prompt: string;
  action: 'senda' | 'poi' | 'navigate';
  category?: 'restaurante' | 'bano' | 'cai' | 'salud';
  coords?: [number, number];
  name?: string;
  answer: string;
}

export const GUANENA_SUGGESTIONS: QuickSuggestion[] = [
  {
    id: 'sug-cuy',
    icon: '🍖',
    label: '¿Dónde comer cuy?',
    prompt: '¿Dónde puedo comer un buen cuy asado o comida tradicional de Pasto?',
    action: 'poi',
    category: 'restaurante',
    coords: [1.2132, -77.2798],
    name: 'Restaurante Rancho Grande',
    answer: '¡Que viva Pasto, carajo! 🍽️ Te recomiendo el Restaurante Rancho Grande en la Calle 18 o La Merced cerca a la Plaza del Carnaval. ¡Ruta a pie trazada en el mapa!',
  },
  {
    id: 'sug-senda',
    icon: '🎭',
    label: 'Ver la Senda',
    prompt: '¿Cuál es el recorrido oficial de la Senda del Carnaval?',
    action: 'senda',
    coords: [1.2140, -77.2820],
    name: 'Senda del Carnaval de Negros y Blancos',
    answer: '¡Que viva Pasto, carajo! 🎭 La Senda recorre 7 km desde la Normal Superior por la Cra 27 hasta Champagnat. ¡Te he enfocado la Senda oficial en el mapa!',
  },
  {
    id: 'sug-bano',
    icon: '🚻',
    label: 'Baño cercano',
    prompt: '¿Dónde hay un baño público o batería sanitaria cercana?',
    action: 'poi',
    category: 'bano',
    coords: [1.2153, -77.2843],
    name: 'Batería Sanitaria Plaza del Carnaval',
    answer: '¡A la voz de una! 🚻 Baterías sanitarias habilitadas en la Plaza del Carnaval y en la Plaza de Nariño. ¡Puntos ubicados en el mapa!',
  },
  {
    id: 'sug-plaza-narino',
    icon: '📍',
    label: 'Ruta a Plaza Nariño',
    prompt: '¿Cómo llegar a la Plaza de Nariño?',
    action: 'navigate',
    coords: [1.2168, -77.2805],
    name: 'Plaza de Nariño',
    answer: '¡Ruta trazada hacia la Plaza de Nariño! Punto de encuentro neurálgico y tarima de música campesina.',
  },
];

// Coordenadas oficiales de respaldo en Plaza de Nariño
export const FALLBACK_PLAZA_NARINO: [number, number] = [1.2168, -77.2805];

/**
 * Captura las coordenadas GPS en tiempo real del turista con fallback a Plaza de Nariño.
 */
export async function getTouristGpsCoords(): Promise<[number, number]> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return FALLBACK_PLAZA_NARINO;
  }
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve(FALLBACK_PLAZA_NARINO);
    }, 3500);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        resolve([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => {
        clearTimeout(timer);
        console.warn('Aviso GPS turista (usando Plaza de Nariño como fallback):', err?.message);
        resolve(FALLBACK_PLAZA_NARINO);
      },
      { enableHighAccuracy: true, timeout: 3500, maximumAge: 5000 }
    );
  });
}

export function GuanenaBot({ onFocusSenda, onFocusLandmark, onSelectDestination }: GuanenaBotProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: '¡Que viva Pasto, carajo! 🎉 Soy GuaneñaBot, tu guía oficial en el Carnaval de Negros y Blancos.\nPregúntame por desfiles, baños, cuy tradicional o seguridad y manejo el mapa por vos.',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const executeActionOnMap = async (action: 'senda' | 'poi' | 'navigate', detail: any) => {
    if (typeof window === 'undefined') return;

    if (action === 'senda') {
      dispatchGuanenaAction({ type: 'SHOW_SENDA', dayId: detail.dayId || '06-ene' });
      if (onFocusSenda) onFocusSenda();
    } else if (action === 'poi') {
      const cat = detail.category || 'todos';
      dispatchGuanenaAction({ type: 'FOCUS_CATEGORY', category: cat });
      if (detail.coords) {
        window.dispatchEvent(
          new CustomEvent('highlight-poi', {
            detail: {
              coords: detail.coords,
              name: detail.name,
              category: detail.category,
              zoom: 18,
              showSenda: true,
            },
          })
        );
        // Calcular ruta vial a pie mediante getStreetRoute
        const origin: [number, number] = [1.2138, -77.2818];
        try {
          const path = await getStreetRoute(origin, detail.coords);
          window.dispatchEvent(
            new CustomEvent('route-to-poi', {
              detail: {
                targetCoords: detail.coords,
                targetName: detail.name,
                path,
              },
            })
          );
        } catch (e) {
          console.warn('Error calculando ruta a pie:', e);
        }
      }
      if (onFocusLandmark && detail.coords) onFocusLandmark(detail.coords, detail.name);
    } else if (action === 'navigate' && detail.coords) {
      const origin: [number, number] = [1.2138, -77.2818];
      const path = await getStreetRoute(origin, detail.coords);
      dispatchGuanenaAction({
        type: 'NAVIGATE_TO',
        targetCoords: detail.coords,
        targetName: detail.name || 'Destino',
        startCoords: origin,
      });
      window.dispatchEvent(
        new CustomEvent('route-to-poi', {
          detail: {
            targetCoords: detail.coords,
            targetName: detail.name,
            path,
          },
        })
      );
    }
  };

  const handleSuggestionClick = async (chip: QuickSuggestion) => {
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: chip.prompt,
      timestamp: new Date(),
    };

    const botMsg = {
      id: Date.now() + 1,
      sender: 'bot',
      text: chip.answer,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    await executeActionOnMap(chip.action, chip);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const userText = (textToSend || inputMessage).trim();
    if (!userText || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: userText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    const paradeIntent = parseBotIntent(userText);
    if (paradeIntent.matched) {
      dispatchParadeIntent(userText);
    }

    const q = userText.toLowerCase();

    // 1. Detección de intenciones: desfiles / Senda
    let actionTriggered = false;
    let botReply = '';

    const isParadeQuery = /senda|desfile|blancos|casta[ñn]eda|4 de enero|6 de enero|camino|ruta/i.test(userText);
    if (isParadeQuery) {
      actionTriggered = true;
      if (typeof window !== 'undefined' && typeof (window as any).dibujarSendaCarnaval === 'function') {
        (window as any).dibujarSendaCarnaval('senda_oficial');
      }
      await executeActionOnMap('senda', { dayId: '06-ene' });
      botReply = '¡Que viva Pasto, carajo! 🎭 He desplegado la Senda Oficial continua calle por calle (Champagnat -> Cra 27 -> Plaza Carnaval -> Cll 19 -> Plaza Nariño -> Cra 22 / Torobajo) en el mapa.';
    } else if (q.includes('desfile') || q.includes('senda') || q.includes('recorrido') || q.includes('evento') || q.includes('carroza')) {
      actionTriggered = true;
      await executeActionOnMap('senda', { dayId: '06-ene' });
      botReply = '¡Que viva Pasto, carajo! 🎭 La Senda recorre 7 km desde la Normal por la Cra 27 hasta Champagnat.\n¡Te he desplegado el desfile y el mapa vial al instante!';
    const [userLat, userLng] = await getTouristGpsCoords();
    const touristCoords: [number, number] = [userLat, userLng];

    let matchedPOIResult = null;
    try {
      matchedPOIResult = await poiWorkerClient.findBestPOIAsync(userText, touristCoords);
    } catch {
      matchedPOIResult = findBestPOIForQuery(userText, touristCoords);
    }
    if (matchedPOIResult) {
      actionTriggered = true;
      const { poi, category, reply } = matchedPOIResult;
      botReply = reply;
      if (onSelectDestination) {
        onSelectDestination(poi.coords, poi.name);
      }
      await executeActionOnMap('poi', { category, coords: poi.coords, name: poi.name });
    } else if (q.includes('cómo llegar') || q.includes('como llegar') || q.includes('ruta a') || q.includes('ir a')) {
      actionTriggered = true;
      const target = searchPastoPOI(userText) || findCarnavalLandmark(userText);
      const coords = target && 'coords' in target ? target.coords : [1.2140, -77.2820];
      const name = target ? target.name : 'Punto solicitado';
      if (onSelectDestination) {
        onSelectDestination(coords, name);
      }
      await executeActionOnMap('navigate', { coords, name });
      botReply = `¡De una, paisano! Te acabo de trazar la ruta en el mapa hacia **${name}**. Te queda a unos minutos caminando. ¡Sigue la línea dorada!`;
    }

    if (!actionTriggered) {
      try {
        const [userLat, userLng] = await getTouristGpsCoords();
        const guanenaResult = await sendGuanenaMessage(userText, userLat, userLng);
        botReply = guanenaResult.reply;

        if (guanenaResult.map_action) {
          const action = guanenaResult.map_action;
          if (
            action.action_type === 'ROUTE_TO_EVENT_START' ||
            action.action_type === 'DRAW_ROUTE' ||
            action.action_type === 'ROUTE_TO_POI'
          ) {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('TRIGGER_NAVIGATION', {
                  detail: {
                    targetCoords: action.target_coords,
                    targetName: action.target_name || 'Destino',
                    originCoords: [userLat, userLng],
                  },
                })
              );
              if (action.day_id) {
                window.dispatchEvent(
                  new CustomEvent('DRAW_SENDA', {
                    detail: { dayKey: action.day_id },
                  })
                );
              }
            }
          }
        }
      } catch (err) {
        console.warn('Chat backend fallback:', err);
      }

      if (!botReply) {
        botReply = '¡Que viva Pasto, carajo! 🎉 Decime a dónde querés ir, qué querés comer o qué hito querés que te trace en el mapa y lo hago de una.';
      } else if (!botReply.toLowerCase().includes('pasto, carajo')) {
        botReply = `¡Que viva Pasto, carajo! 🎉 ${botReply}`;
      }
    }

    const botMsg = {
      id: Date.now() + 1,
      sender: 'bot',
      text: botReply,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, botMsg]);
    setLoading(false);
  };

  return (
    <>
      {/* Botón flotante lanzador de GuaneñaBot (Stitch Style) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-[1001] flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-rose-600 via-amber-500 to-cyan-500 text-white font-bold text-xs shadow-[0_0_24px_rgba(225,29,72,0.5)] border border-white/20 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
          title="Abrir Asistente GuaneñaBot"
          aria-label="Abrir asistente de IA GuaneñaBot"
        >
          <div className="w-6 h-6 rounded-full bg-[#07090e] flex items-center justify-center text-xs">
            🎭
          </div>
          <span className="font-extrabold tracking-wide">
            GuaneñaBot <span className="text-cyan-300 font-normal">• IA en vivo</span>
          </span>
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#06b6d4]"></span>
        </button>
      )}

      {/* Drawer HUD Conversacional de Stitch para GuaneñaBot */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-[1001] w-80 sm:w-96 max-h-[580px] flex flex-col bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 text-white">
          {/* Header con avatar de máscara festiva y badge neón */}
          <div className="p-4 bg-slate-950/70 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 via-amber-400 to-cyan-400 p-0.5 shadow-[0_0_15px_rgba(225,29,72,0.5)] shrink-0">
                <div className="w-full h-full rounded-full bg-[#07090e] flex items-center justify-center text-lg">
                  🎭
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-cyan-400 ring-2 ring-slate-950 shadow-[0_0_8px_#06b6d4]"></span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-black tracking-tight text-white">GuaneñaBot</h3>
                  <span className="text-[10px] font-bold text-cyan-300 px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30">
                    IA en vivo
                  </span>
                </div>
                <p className="text-[10px] text-amber-400/90 font-medium truncate">
                  Copiloto Oficial • Carnaval de Pasto
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setMessages([
                    {
                      id: Date.now(),
                      sender: 'bot',
                      text: '¡Que viva Pasto, carajo! 🎉 Conversación reiniciada. ¿Qué punto o evento querés ubicar en la Senda?',
                      timestamp: new Date(),
                    },
                  ]);
                }}
                className="p-1.5 hover:bg-white/10 rounded-xl transition text-slate-400 hover:text-white"
                title="Reiniciar conversación"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-xl transition text-slate-400 hover:text-white"
                title="Cerrar chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chips horizontales scrolleables con sugerencias rápidas */}
          <div className="p-2.5 bg-slate-950/40 border-b border-white/5 flex gap-1.5 overflow-x-auto no-scrollbar">
            {GUANENA_SUGGESTIONS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => handleSuggestionClick(chip)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/40 text-[11px] font-semibold whitespace-nowrap transition active:scale-95 text-slate-200 hover:text-cyan-300 cursor-pointer shrink-0"
              >
                <span>{chip.icon}</span>
                <span>{chip.label}</span>
              </button>
            ))}
          </div>

          {/* Cuerpo de mensajes */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 font-sans text-xs min-h-[220px]">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[88%] px-3.5 py-2.5 rounded-2xl shadow-md ${
                      isUser
                        ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white rounded-br-xs'
                        : 'bg-slate-800/90 text-slate-100 border border-white/10 rounded-bl-xs leading-relaxed whitespace-pre-line'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex justify-start">
                <div className="px-3.5 py-2 rounded-2xl bg-slate-800/80 border border-white/10 text-cyan-400 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span className="text-xs">Consultando la Senda de Pasto...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Formulario de entrada */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-slate-950/80 border-t border-white/10 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Pregúntale a GuaneñaBot sobre rutas o eventos..."
              className="flex-1 bg-slate-900/90 border border-white/10 rounded-full px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-95 transition flex items-center justify-center shrink-0 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.4)]"
              title="Enviar mensaje"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default GuanenaBot;
