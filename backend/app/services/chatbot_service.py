"""Servicio de Chatbot Inteligente para el Carnaval de Negros y Blancos de Pasto (TaitaBot / GuaneñaBot).

Expone las capacidades del asistente virtual con Google Gemini desde chat_service.
"""
from app.services.chat_service import (
    generate_chat_response,
    TAITABOT_SYSTEM_PROMPT,
    GUANENABOT_SYSTEM_PROMPT,
)

__all__ = [
    "generate_chat_response",
    "TAITABOT_SYSTEM_PROMPT",
    "GUANENABOT_SYSTEM_PROMPT",
]
