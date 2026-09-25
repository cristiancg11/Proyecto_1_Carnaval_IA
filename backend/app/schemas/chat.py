"""Esquemas Pydantic para el módulo de Chatbot Inteligente."""
from typing import List, Optional
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Esquema de solicitud para consultar al Asistente Virtual del Carnaval."""
    message: str = Field(..., min_length=1, description="Pregunta o mensaje del usuario.")
    user_latitude: Optional[float] = Field(None, description="Latitud actual del usuario para contexto geográfico.")
    user_longitude: Optional[float] = Field(None, description="Longitud actual del usuario para contexto geográfico.")

    model_config = {
        "json_schema_extra": {
            "example": {
                "message": "¿Dónde queda el puesto de salud más cercano y qué reportes hay en la zona?",
                "user_latitude": 1.2136,
                "user_longitude": -77.2811
            }
        }
    }


class ChatResponse(BaseModel):
    """Esquema de respuesta generada por el Asistente Virtual."""
    response: str = Field(..., description="Respuesta generada por el asistente virtual con IA.")
    sources_used: Optional[List[str]] = Field(default=None, description="Fuentes de información o entidades consultadas en tiempo real.")

    model_config = {
        "json_schema_extra": {
            "example": {
                "response": "¡Hola, paisano! Con mucho gusto te oriento. El puesto de salud más cercano es el Puesto de Salud Plaza de Nariño a unos 50 metros...",
                "sources_used": [
                    "Base de Datos: 6 Puntos de Interés (Salud, Policía, Baños, Tarimas)",
                    "Base de Datos: Reportes recientes en la Senda del Carnaval",
                    "Geolocalización del usuario: Lat 1.2136, Lon -77.2811"
                ]
            }
        }
    }
