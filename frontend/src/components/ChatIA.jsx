import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, RotateCcw } from 'lucide-react';
import axios from 'axios';
import { api } from '../services/api';

const QUICK_PROMPTS = [
  '¿Cómo es el recorrido de la Senda?',
  '¿Qué eventos hay el 5 y 6 de enero?',
  '¿Dónde comer frito pastuso y cuy?',
];

// Respuestas de contingencia enriquecidas para garantizar fluidez durante sustentación
const LOCAL_FALLBACK_ANSWERS = {
  senda:
    'El recorrido oficial de la Senda del Carnaval de Pasto tiene una longitud de casi 7 km: Inicia en la Concentración de Carrozas en la Av. Boyacá / Normal Superior, avanza por la Carrera 27 pasando por la Plaza del Carnaval y de la Cultura y la Plaza de Nariño, continúa hacia el Parque Infantil y culmina en la Fuente de la Transparencia (Avenida Los Estudiantes).',
  eventos:
    '¡Los días cumbre de nuestro Patrimonio!\n• 5 de Enero (Día de Negros): Conmemoración histórica de la libertad e igualdad, juego fraterno de la "pintica" (cosmético negro) y conciertos en vivo en las tarimas de la Plaza del Carnaval y Plaza de Nariño.\n• 6 de Enero (Día de Blancos / Desfile Magno): El evento máximo del Carnaval. Majestuoso desfile de Carrozas Monumentales de hasta 12 metros de altura, murgas de viento y fuelles, comparsas, disfraces individuales y colectivos coreográficos a lo largo de la Senda.',
  comida:
    '¡La gastronomía tradicional de Pasto es inigualable!\n• Frito Pastuso (trozos de cerdo dorado crujiente con crispetas, papa pastusa al vapor y ají de maní): Encuéntralo en los mesones tradicionales del Centro Histórico, Bomboná y la Calle 18.\n• Cuy Asado a la brasa: El destino imperdible es el Corregimiento de Catambuco y Obonuco (sede del Festival del Cuy el 7 de enero), con asaderos típicos reconocidos por su sabor andino.',
};

export function ChatIA({ isOpen: controlledOpen, onClose: controlledClose }) {
  // Manejo de estado interno o controlado desde props
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const handleToggle = () => {
    if (controlledClose && isOpen) {
      controlledClose();
    } else {
      setInternalOpen(!isOpen);
    }
  };

  const handleClose = () => {
    if (controlledClose) {
      controlledClose();
    } else {
      setInternalOpen(false);
    }
  };

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: '¡Qué viva Pasto, carajo! 🎉 Soy GuaneñaBot, tu guía en el Carnaval de Pasto. Pregúntame sobre el recorrido de la Senda, el calendario de eventos o los mejores lugares gastronómicos.',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, loading]);

  const getSmartFallback = (query) => {
    const q = query.toLowerCase();
    if (q.includes('senda') || q.includes('recorrido') || q.includes('ruta')) {
      return LOCAL_FALLBACK_ANSWERS.senda;
    }
    if (q.includes('5 y 6') || q.includes('enero') || q.includes('eventos') || q.includes('desfile')) {
      return LOCAL_FALLBACK_ANSWERS.eventos;
    }
    if (q.includes('cuy') || q.includes('frito') || q.includes('comer') || q.includes('plato')) {
      return LOCAL_FALLBACK_ANSWERS.comida;
    }
    return '¡Qué viva Pasto, carajo! El Carnaval de Negros y Blancos es Patrimonio Cultural Inmaterial de la Humanidad. Te invito a consultar la Senda del Carnaval y nuestro Calendario de Eventos para no perderte ningún desfile.';
  };

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const envUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const cleanBase = envUrl.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
      const primaryChatUrl = `${cleanBase}/api/chat`;

      let replyText = '';

      try {
        const res = await axios.post(
          primaryChatUrl,
          { message: text },
          { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
        );
        replyText = res.data?.response || res.data?.reply;
      } catch (_err) {
        try {
          const fallbackRes = await api.sendChatMessage({ message: text });
          replyText = fallbackRes?.response || fallbackRes?.reply;
        } catch {
          replyText = getSmartFallback(text);
        }
      }

      if (!replyText) {
        replyText = getSmartFallback(text);
      }

      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: replyText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.warn('Uso de respuesta local GuaneñaBot:', err);
      const fallbackMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: getSmartFallback(text),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: Date.now(),
        sender: 'bot',
        text: '¡Conversación reiniciada! ¿Qué deseas consultar sobre el Carnaval de Pasto, paisano?',
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <>
      {/* 1. Botón Disparador Flotante (Esquina inferior derecha) con animación sutil de entrada */}
      {!isOpen && (
        <button
          id="open-chat-fab"
          type="button"
          onClick={handleToggle}
          className="fixed bottom-6 right-6 z-[1050] flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white font-bold text-xs sm:text-sm border border-white/20 shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer group animate-in fade-in zoom-in-90"
          aria-label="Abrir chat con GuaneñaBot"
          title="Abrir GuaneñaBot - Tu guía en el Carnaval de Pasto"
        >
          <div className="relative flex items-center justify-center w-6 h-6 text-base">
            🎭
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
          </div>
          <span className="font-extrabold tracking-wide">GuaneñaBot</span>
          <Sparkles className="w-3.5 h-3.5 text-white/90 shrink-0" />
        </button>
      )}

      {/* 2. Ventana de Chat Flotante en la esquina inferior derecha (380px ancho, 500px alto, adaptable) */}
      {isOpen && (
        <div
          role="complementary"
          aria-label="Ventana de GuaneñaBot"
          className="fixed bottom-6 right-4 sm:right-6 z-[1100] w-[calc(100vw-2rem)] sm:w-[380px] h-[500px] max-h-[85vh] rounded-3xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-black/60 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          {/* Header */}
          <header className="px-4 py-3.5 border-b border-white/10 bg-slate-950/60 flex items-center justify-between gap-2 select-none">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-sm shrink-0 text-base">
                🎭
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-xs sm:text-sm text-white tracking-tight leading-tight truncate">
                  GuaneñaBot
                </h3>
                <p className="text-[10px] text-slate-400 truncate">
                  Tu guía en el Carnaval de Pasto
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleResetChat}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                title="Reiniciar chat"
                aria-label="Reiniciar chat"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                title="Cerrar chat"
                aria-label="Cerrar chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Body: Historial de mensajes */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div className={`flex items-end gap-2 max-w-[85%] ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {!isUser && (
                      <div className="w-6 h-6 rounded-xl bg-slate-800/80 border border-white/10 flex items-center justify-center text-xs shrink-0 mb-1">
                        🎭
                      </div>
                    )}

                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed shadow-sm ${
                        isUser
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-br-sm'
                          : 'bg-slate-800/90 text-slate-100 border border-white/10 rounded-bl-sm'
                      }`}
                    >
                      <div className="whitespace-pre-line">{msg.text}</div>
                    </div>
                  </div>

                  <span className={`text-[9px] text-slate-500 mt-1 ${isUser ? 'pr-1' : 'pl-8'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}

            {/* Indicador de carga: 3 puntos animados */}
            {loading && (
              <div className="flex flex-col items-start animate-in fade-in duration-200">
                <div className="flex items-end gap-2 max-w-[85%]">
                  <div className="w-6 h-6 rounded-xl bg-slate-800/80 border border-white/10 flex items-center justify-center text-xs shrink-0 mb-1">
                    🎭
                  </div>
                  <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-sm bg-slate-800/90 border border-white/10 text-xs text-slate-300 flex items-center gap-2 shadow-sm">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      GuaneñaBot está escribiendo...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chips de preguntas rápidas (Quick Prompts) */}
          <div className="px-3 py-2 bg-slate-950/60 border-t border-white/10">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  disabled={loading}
                  className="px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-white/10 text-[11px] font-medium whitespace-nowrap active:scale-95 transition cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Footer / Input con ícono de avión de papel (Send) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 border-t border-white/10 bg-slate-950/90 flex items-center gap-2"
          >
            <input
              id="guanena-chat-input"
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Pregúntale a GuaneñaBot..."
              disabled={loading}
              className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-slate-900 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 transition disabled:opacity-50"
            />
            <button
              id="guanena-chat-send-btn"
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="p-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-orange-500/20 shrink-0"
              aria-label="Enviar mensaje a GuaneñaBot"
              title="Enviar mensaje"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default ChatIA;
