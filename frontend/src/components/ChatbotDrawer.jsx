import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Bot,
  Sparkles,
  MapPin,
  Compass,
  AlertCircle,
  Database,
  Loader2,
  RefreshCw,
  Navigation,
} from 'lucide-react';
import { api } from '../services/api';

const SUGGESTED_QUESTIONS = [
  '¿Qué hay el 6 de enero en el desfile magno?',
  '¿Cómo llego a Cuyquer en Mijitayo?',
  '¿Qué se celebra el 4 de enero con la Familia Castañeda?',
  '¿Dónde queda El Rincón del Cuy?',
];

export function ChatbotDrawer({
  isOpen,
  onClose,
  userLocation,
  userGps,
  selectedDay,
  currentCarnivalDay,
  setCurrentCarnivalDay,
  setNavRoute,
}) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: '¡Hola, paisano! 🎉 Te doy la bienvenida al Carnaval de Negros y Blancos de Pasto. Soy tu Asistente Virtual Oficial con Inteligencia Artificial. ¿En qué te puedo orientar hoy sobre el desfile de hoy, rutas cerradas, gastronomía nariñense o puestos de salud?',
      sources: ['Base de Conocimiento Oficial del Carnaval de Pasto'],
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [includeLocation, setIncludeLocation] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend) => {
    const message = textToSend || inputMessage;
    if (!message.trim() || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: message.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const activeLat = includeLocation && userGps ? userGps.lat : (userLocation ? userLocation.lat : 1.2136);
      const activeLng = includeLocation && userGps ? userGps.lng : (userLocation ? userLocation.lng : -77.2811);

      const activeDay = currentCarnivalDay || selectedDay || '06-ene';
      const response = await api.sendChatMessage({
        message: userMsg.text,
        userLatitude: activeLat,
        userLongitude: activeLng,
        userLat: activeLat,
        userLng: activeLng,
        selectedDay: activeDay,
      });

      const replyText = response.reply || response.response;

      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: replyText,
        sources: response.sources_used || [],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);

      // 1. Si data.action existe y data.action.type === 'SET_DAY'
      if (response.action && response.action.type === 'SET_DAY') {
        const dayKey = response.action.day_key;
        const eventTitle = response.action.event_title || dayKey;

        if (setCurrentCarnivalDay && dayKey) {
          setCurrentCarnivalDay(dayKey);
        }

        const dayNoticeMsg = {
          id: Date.now() + 2,
          sender: 'bot',
          isDayNotice: true,
          text: `🎭 Mapa actualizado para: ${eventTitle}`,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, dayNoticeMsg]);
      }

      // 2. Si data.action existe y data.action.type === 'ROUTE'
      if (response.action && response.action.type === 'ROUTE') {
        const targetCoords = response.action.target_coords;
        const targetName = response.action.target_name;

        if (setNavRoute && targetCoords) {
          setNavRoute({
            targetName: targetName,
            startCoords: [activeLat, activeLng],
            targetCoords: targetCoords,
          });
        }

        const routeNoticeMsg = {
          id: Date.now() + 3,
          sender: 'bot',
          isRouteNotice: true,
          text: `📍 Ruta trazada en el mapa hacia ${targetName}`,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, routeNoticeMsg]);
      }
    } catch (error) {
      console.error('Error al consultar chatbot:', error);
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: '¡Caray, paisano! Tuve un inconveniente al conectar con el servicio de IA. Sin embargo, recuerda que ante cualquier emergencia médica puedes acudir a los puestos de salud en la Plaza de Nariño o Plaza del Carnaval, o comunicarte con la línea 123.',
        sources: ['Protocolo de contingencia local'],
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-auto">
      {/* Backdrop oscuro translúcido con desenfoque para enfocar el chat */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn cursor-pointer"
        onClick={onClose}
        aria-label="Cerrar Asistente"
      />

      {/* Panel Lateral Deslizante en Vidrio Esmerilado */}
      <div className="fixed inset-y-0 right-0 z-10 w-full sm:w-[480px] lg:w-[510px] backdrop-blur-lg bg-slate-900/85 border-l border-slate-800/80 shadow-[0_0_80px_rgba(0,0,0,0.9)] flex flex-col transition-all duration-300 ease-in-out animate-slideLeft">
      {/* Encabezado del Chat */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/60 backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-500 to-violet-600 text-white shadow-lg shadow-pink-500/25 border border-white/20">
            <Bot className="w-5 h-5" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-400 to-cyan-300">
                Asistente IA del Carnaval
              </h3>
              <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-full centenary-badge text-amber-300">
                1927 - 2027
              </span>
            </div>
            <p className="text-[11px] text-slate-300">Rumbo al Centenario • Gemini IA en vivo</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition active:scale-95"
          title="Cerrar Asistente"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Switch de Geolocalización y Día Activo del Carnaval */}
      <div className="px-5 py-2.5 bg-slate-950/40 border-b border-white/[0.06] flex items-center justify-between text-xs text-slate-300 flex-wrap gap-2">
        <div className="flex items-center gap-2 truncate">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">
              {userGps
                ? `GPS: ${userGps.lat.toFixed(4)}, ${userGps.lng.toFixed(4)}`
                : userLocation
                ? `Pasto (${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)})`
                : 'Pasto (Plaza de Nariño)'}
            </span>
          </div>
          {selectedDay && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
              📅 {selectedDay}
            </span>
          )}
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none shrink-0 bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/10 hover:border-pink-500/30 transition">
          <input
            type="checkbox"
            checked={includeLocation}
            onChange={(e) => setIncludeLocation(e.target.checked)}
            className="rounded bg-slate-800 border-white/20 text-pink-500 focus:ring-pink-500 text-xs"
          />
          <span className="text-[11px] text-slate-300 font-bold">Proximidad</span>
        </label>
      </div>

      {/* Lista de Mensajes */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] rounded-3xl px-4 py-3 text-xs sm:text-[13px] leading-relaxed shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-amber-500 via-pink-500 to-cyan-500 text-white rounded-br-sm shadow-md shadow-pink-500/25'
                  : msg.isError
                  ? 'bg-rose-950/60 border border-rose-500/40 text-rose-200 rounded-bl-sm'
                  : msg.isDayNotice
                  ? 'bg-gradient-to-r from-pink-950/80 to-purple-950/80 border border-pink-400/60 text-pink-200 rounded-bl-sm shadow-md shadow-pink-500/20 font-semibold'
                  : msg.isRouteNotice
                  ? 'bg-blue-950/70 border border-blue-400/50 text-blue-200 rounded-bl-sm shadow-md shadow-blue-500/20 font-semibold'
                  : 'backdrop-blur-md bg-slate-900/80 border border-white/10 text-slate-100 rounded-bl-sm shadow-md'
              }`}
            >
              {/* Contenido del mensaje con saltos de línea */}
              <div className="flex items-start gap-2">
                {msg.isRouteNotice && <Navigation className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />}
                {msg.isDayNotice && <span className="text-sm shrink-0">🎭</span>}
                <div className="whitespace-pre-line flex-1 text-slate-100">{msg.text}</div>
              </div>

              {/* Fuentes auditables (sources_used) */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-white/10 text-[10px] space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold uppercase tracking-wider">
                    <Database className="w-3 h-3 text-amber-400" />
                    <span>Fuentes oficiales verificadas:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                    {msg.sources.map((src, idx) => (
                      <li key={idx} className="truncate" title={src}>
                        {src}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <span className="text-[10px] text-slate-400 mt-1 px-2 font-medium">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-2">
            <div className="backdrop-blur-md bg-slate-900/80 border border-pink-500/40 text-slate-200 rounded-3xl rounded-bl-sm px-4 py-3 text-xs flex items-center gap-2.5 shadow-lg shadow-pink-500/20">
              <Loader2 className="w-4 h-4 animate-spin text-pink-400 shrink-0" />
              <div className="space-y-0.5">
                <span className="font-bold text-white block">Consultando datos en tiempo real de Pasto con Gemini IA...</span>
                <span className="text-[10px] text-slate-300 block">
                  Analizando rutas oficiales, cierres de vías ({selectedDay || '06-ene'}) y restaurantes típicos
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Preguntas sugeridas en chips estilo píldora con borde sutil y hover reactivo */}
      <div className="px-5 py-3 border-t border-white/10 bg-slate-950/60 backdrop-blur-md">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>Consultas rápidas:</span>
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {SUGGESTED_QUESTIONS.map((question, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(question)}
              className="text-[11px] font-bold whitespace-nowrap px-3.5 py-1.5 rounded-full bg-slate-900/70 hover:bg-slate-800/90 text-slate-200 hover:text-white border border-white/10 hover:border-pink-500/50 hover:shadow-md hover:shadow-pink-500/25 transition-all duration-200 active:scale-95 cursor-pointer"
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* Entrada de texto estilo cápsula moderna con botón multicolor interactivo */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-4 border-t border-white/10 bg-slate-950/80 backdrop-blur-md flex items-center gap-2.5"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Pregúntale al Asistente del Carnaval..."
          disabled={loading}
          className="flex-1 px-4 py-3 text-xs sm:text-sm bg-slate-900/70 border border-white/10 rounded-full text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:opacity-50 transition-all"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || loading}
          className="p-3 rounded-full bg-gradient-to-r from-amber-500 via-pink-500 to-cyan-500 hover:from-amber-600 hover:via-pink-600 hover:to-cyan-600 text-white shadow-md hover:shadow-pink-500/40 active:scale-95 disabled:opacity-40 transition-all duration-200 hover:-translate-y-0.5 shrink-0 cursor-pointer"
          aria-label="Enviar mensaje"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
      </div>
    </div>
  );
}

export default ChatbotDrawer;

