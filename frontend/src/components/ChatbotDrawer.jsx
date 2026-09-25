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
} from 'lucide-react';
import { api } from '../services/api';

const SUGGESTED_QUESTIONS = [
  '¿Dónde queda el puesto de salud más cercano?',
  '¿Cómo está la seguridad y congestión en la Plaza del Carnaval?',
  '¿Dónde hay baños públicos y puntos de encuentro?',
  '¿Qué reportes recientes hay en la Senda del Carnaval?',
];

export function ChatbotDrawer({
  isOpen,
  onClose,
  userLocation,
}) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: '¡Hola, paisano! 🎉 Te doy la bienvenida al Carnaval de Negros y Blancos de Pasto. Soy tu Asistente Virtual Oficial con Inteligencia Artificial. ¿En qué te puedo orientar hoy sobre puestos de salud, rutas o seguridad?',
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
      const response = await api.sendChatMessage({
        message: userMsg.text,
        userLatitude: includeLocation && userLocation ? userLocation.lat : 1.2136,
        userLongitude: includeLocation && userLocation ? userLocation.lng : -77.2811,
      });

      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: response.response,
        sources: response.sources_used || [],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);
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
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[450px] lg:w-[480px] bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl flex flex-col transition-all duration-300 ease-in-out animate-slideLeft">
      {/* Encabezado del Chat */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-md shadow-rose-500/20">
            <Bot className="w-5 h-5" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm text-white">Asistente IA del Carnaval</h3>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-[11px] text-slate-400">Gemini 2.5 Flash • Contexto en tiempo real</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="Cerrar Asistente"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Switch de Geolocalización para contextualizar */}
      <div className="px-5 py-2 bg-slate-800/40 border-b border-slate-800/60 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          <span>Ubicación activa: Pasto ({userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : 'Plaza de Nariño'})</span>
        </div>
        <label className="flex items-center gap-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeLocation}
            onChange={(e) => setIncludeLocation(e.target.checked)}
            className="rounded bg-slate-700 border-slate-600 text-rose-500 focus:ring-rose-500 text-xs"
          />
          <span className="text-[11px] text-slate-400">Proximidad</span>
        </label>
      </div>

      {/* Lista de Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-rose-600 to-purple-600 text-white rounded-br-none'
                  : msg.isError
                  ? 'bg-rose-950/40 border border-rose-800/50 text-rose-200 rounded-bl-none'
                  : 'bg-slate-800/90 border border-slate-700/60 text-slate-100 rounded-bl-none'
              }`}
            >
              {/* Contenido del mensaje con saltos de línea */}
              <div className="whitespace-pre-line">{msg.text}</div>

              {/* Fuentes auditables (sources_used) */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-700/50 text-[10px] space-y-1">
                  <div className="flex items-center gap-1 text-slate-400 font-semibold uppercase tracking-wider">
                    <Database className="w-3 h-3 text-amber-400" />
                    <span>Fuentes en tiempo real:</span>
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

            <span className="text-[10px] text-slate-500 mt-1 px-1">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-2">
            <div className="bg-slate-800/90 border border-slate-700/60 text-slate-300 rounded-2xl rounded-bl-none px-4 py-3 text-xs flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
              <span>El Asistente está consultando la senda y analizando la base de datos...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Preguntas sugeridas */}
      <div className="px-4 py-2 border-t border-slate-800 bg-slate-900/60">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
          <Compass className="w-3 h-3 text-rose-400" /> Consultas rápidas:
        </p>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {SUGGESTED_QUESTIONS.map((question, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(question)}
              className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition"
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* Entrada de texto */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-4 border-t border-slate-800 bg-slate-900 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Pregúntale al Asistente del Carnaval..."
          disabled={loading}
          className="flex-1 px-4 py-2.5 text-xs bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || loading}
          className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:opacity-95 text-white shadow-md shadow-rose-500/20 active:scale-95 disabled:opacity-40 transition"
          title="Enviar consulta"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

export default ChatbotDrawer;
