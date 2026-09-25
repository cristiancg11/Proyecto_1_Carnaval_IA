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
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] lg:w-[490px] bg-slate-950/85 backdrop-blur-3xl border-l border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.8)] flex flex-col transition-all duration-300 ease-in-out animate-slideLeft">
      {/* Encabezado del Chat */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-slate-950/60 backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-fuchsia-600 to-violet-600 text-white shadow-[0_0_20px_rgba(217,70,239,0.5)] border border-white/20">
            <Bot className="w-5 h-5" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm text-white">Asistente IA del Carnaval</h3>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-[11px] text-slate-400">Gemini 2.5 Flash • Contexto en tiempo real</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
          title="Cerrar Asistente"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Switch de Geolocalización para contextualizar en cápsula */}
      <div className="px-5 py-2.5 bg-white/[0.02] border-b border-white/[0.06] flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-1.5 truncate">
          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">Pasto ({userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : 'Plaza de Nariño'})</span>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none shrink-0 bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/10 hover:border-white/20 transition">
          <input
            type="checkbox"
            checked={includeLocation}
            onChange={(e) => setIncludeLocation(e.target.checked)}
            className="rounded bg-slate-800 border-white/20 text-fuchsia-500 focus:ring-fuchsia-500 text-xs"
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
                  ? 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-amber-500 text-white rounded-br-sm shadow-[0_4px_20px_rgba(217,70,239,0.35)]'
                  : msg.isError
                  ? 'bg-rose-950/40 border border-rose-800/50 text-rose-200 rounded-bl-sm'
                  : 'bg-white/[0.05] border border-white/10 backdrop-blur-xl text-slate-100 rounded-bl-sm shadow-[0_4px_16px_rgba(0,0,0,0.2)]'
              }`}
            >
              {/* Contenido del mensaje con saltos de línea */}
              <div className="whitespace-pre-line">{msg.text}</div>

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

            <span className="text-[10px] text-slate-500 mt-1 px-2 font-medium">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-2">
            <div className="bg-white/[0.05] border border-white/10 backdrop-blur-xl text-slate-300 rounded-3xl rounded-bl-sm px-4 py-3 text-xs flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-fuchsia-400" />
              <span>El Asistente está consultando la senda y analizando la base de datos...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Preguntas sugeridas en píldoras modernas */}
      <div className="px-5 py-3 border-t border-white/[0.08] bg-slate-950/40">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-fuchsia-400" />
          <span>Consultas rápidas:</span>
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {SUGGESTED_QUESTIONS.map((question, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(question)}
              className="text-[11px] font-semibold whitespace-nowrap px-3.5 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.12] text-slate-300 hover:text-white border border-white/10 hover:border-fuchsia-500/40 transition active:scale-95 shadow-sm"
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* Entrada de texto estilo cápsula moderna */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-4 border-t border-white/[0.08] bg-slate-950/60 flex items-center gap-2.5"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Pregúntale al Asistente del Carnaval..."
          disabled={loading}
          className="flex-1 px-4 py-3 text-xs sm:text-sm bg-white/[0.04] border border-white/10 rounded-full text-white placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 focus:bg-white/[0.08] disabled:opacity-50 transition-all"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || loading}
          className="p-3 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-amber-500 hover:from-violet-500 hover:via-fuchsia-500 hover:to-amber-400 text-white shadow-[0_0_20px_rgba(217,70,239,0.5)] active:scale-95 disabled:opacity-40 transition-all duration-200 hover:-translate-y-0.5 shrink-0"
          title="Enviar consulta"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

export default ChatbotDrawer;

