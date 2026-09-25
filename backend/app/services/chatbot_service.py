"""Servicio de Chatbot Inteligente para el Carnaval de Negros y Blancos de Pasto.

Utiliza Google Gemini (gemini-2.5-flash) junto con el contexto en tiempo real
de la base de datos (puntos de interés, reportes ciudadanos y niveles de riesgo)
para brindar asistencia oficial, segura y amigable a propios y turistas.
"""
import logging
import math
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from google import genai
from google.genai import types

from app.core.config import settings
from app.models.point_of_interest import PointOfInterest
from app.models.report import Report
from app.models.zone_risk import ZoneRisk
from app.schemas.chat import ChatResponse

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """Eres el Asistente Virtual Oficial del Carnaval de Negros y Blancos de Pasto, declarado Patrimonio Cultural Inmaterial de la Humanidad por la UNESCO.
Tu misión principal es orientar, acompañar, informar y salvaguardar a propios y turistas durante las festividades en San Juan de Pasto, Nariño, Colombia.

Personalidad y Tono:
- Muy amable, hospitalario, empático, entusiasta y con espíritu alegre nariñense ("¡Que viva Pasto, Carajo!").
- Emplea con calidez y moderación expresiones respetuosas típicas de la región (por ejemplo: "paisano", "guagua", "a la orden").
- Firme, oportuno, claro y preventivo ante emergencias, problemas de salud, desorientación o alertas de seguridad.

Geografía Clave de Pasto y el Carnaval:
- Senda del Carnaval: El recorrido oficial de aproximadamente 7 km por donde transitan los desfiles, comparsas, murgas, colectivos coreográficos y las monumentales carrozas (desde la Av. Boyacá / Plaza del Carnaval, cruzando la zona céntrica por la calle 19 y carrera 27, hacia la Fuente de la Transparencia y Estadio Libertad).
- Plaza de Nariño: Corazón cívico, histórico y administrativo de Pasto; punto neurálgico con Puesto de Mando Unificado (PMU), presencia de Cruz Roja, Defensa Civil y CAI de Policía.
- Plaza del Carnaval y de la Cultura: Epicentro multitudinario donde se ubica la tarima principal de conciertos, orquestas y presentaciones cívico-culturales.
- Parque Infantil: Punto tradicional de encuentro familiar, concentración, zonas de descanso y servicios sanitarios.
- Fuente de la Transparencia y Avenida de los Estudiantes: Zonas amplias de descongestión, llegada y evacuación de carrozas y público.

Directrices Operativas de Asistencia:
1. Salud y Emergencias:
   - Si el usuario requiere ayuda médica o primeros auxilios, indícale de inmediato el Puesto de Salud más cercano con base en la información en tiempo real provista.
   - Recomienda acudir inmediatamente al personal de apoyo identificado (Cruz Roja, Defensa Civil, Bomberos) o llamar a la Línea de Emergencias 123.
2. Seguridad y Autocuidado:
   - Adviérteles sobre aglomeraciones o zonas con reportes de riesgo activos en tiempo real.
   - Promueve el autocuidado: guardar objetos de valor en bolsillos frontales con cierre, acordar puntos de encuentro fijos con su grupo en caso de separación, especial cuidado con niños y personas de la tercera edad, y protegerse los ojos del cosmético y talco con gafas adecuadas.
3. Rutas y Georreferenciación:
   - Si el usuario suministra sus coordenadas, calcula y menciona la cercanía o distancia a los puntos clave de interés y puestos de auxilio.
4. Uso Estricto de la Información en Tiempo Real:
   - Basa tus respuestas de ubicación y estado de la senda en los datos provistos en el bloque 'CONTEXTO EN TIEMPO REAL DE LA BASE DE DATOS'.
   - Si no hay reportes de peligro o el usuario pregunta sobre algo no registrado, responde con seguridad basándote en la logística habitual de la fiesta sin inventar hechos que alarmen a la ciudadanía.
"""


def _haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calcula la distancia geodésica en kilómetros entre dos coordenadas usando la fórmula de Haversine."""
    earth_radius_km = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return earth_radius_km * c


def _format_distance(km: float) -> str:
    """Formatea una distancia en metros o kilómetros para fácil lectura."""
    meters = km * 1000.0
    if meters < 1000.0:
        return f"{int(round(meters))} metros"
    return f"{km:.2f} km"


def build_carnaval_context(
    db: Session,
    user_lat: Optional[float] = None,
    user_lon: Optional[float] = None
) -> Tuple[str, List[str]]:
    """Consulta la base de datos para extraer puntos de interés, reportes recientes

    y niveles de riesgo por zona, generando un contexto formateado y la lista de fuentes utilizadas.
    """
    sources_used: List[str] = []
    context_sections: List[str] = []

    has_location = user_lat is not None and user_lon is not None
    if has_location:
        sources_used.append(f"Geolocalización del usuario: Lat {user_lat:.4f}, Lon {user_lon:.4f}")

    # 1. Puntos de Interés (POIs)
    pois = db.query(PointOfInterest).all()
    if pois:
        poi_entries = []
        # Si hay ubicación del usuario, calcular distancias y ordenar por proximidad
        poi_items = []
        for poi in pois:
            dist_km = None
            if has_location:
                dist_km = _haversine_distance_km(user_lat, user_lon, poi.latitude, poi.longitude)
            poi_items.append((poi, dist_km))

        if has_location:
            poi_items.sort(key=lambda x: x[1] if x[1] is not None else float("inf"))

        for poi, dist in poi_items:
            dist_str = f" - Distancia aproximada: {_format_distance(dist)}" if dist is not None else ""
            desc = f" ({poi.description})" if poi.description else ""
            poi_entries.append(
                f"- [{poi.category.upper()}] {poi.name}{desc}{dist_str} [Coords: {poi.latitude}, {poi.longitude}]"
            )

        context_sections.append("PUNTOS DE INTERÉS Y SERVICIOS EN EL CARNAVAL:\n" + "\n".join(poi_entries))
        sources_used.append(f"Puntos de Interés: {len(pois)} puntos de atención registrados (Salud, Policía, Baños, Tarimas, Salidas)")
    else:
        context_sections.append("PUNTOS DE INTERÉS: No hay puntos registrados en el sistema actualmente.")

    # 2. Reportes e Incidencias Recientes (últimos reportes no descartados)
    recent_reports = (
        db.query(Report)
        .filter(Report.status.in_(["Pendiente", "En_Revision", "Atendido"]))
        .order_by(Report.created_at.desc())
        .limit(8)
        .all()
    )

    if recent_reports:
        report_entries = []
        for rep in recent_reports:
            dist_str = ""
            if has_location:
                dist = _haversine_distance_km(user_lat, user_lon, rep.latitude, rep.longitude)
                dist_str = f" | Distancia al reporte: {_format_distance(dist)}"

            risk = rep.ai_risk_level or "No evaluado"
            desc = f" - {rep.description}" if rep.description else ""
            report_entries.append(
                f"- [Categoría: {rep.category} | Riesgo: {risk} | Estado: {rep.status}] "
                f"\"{rep.title}\"{desc}{dist_str}"
            )

        context_sections.append("REPORTES CIUDADANOS EN TIEMPO REAL (Últimas novedades):\n" + "\n".join(report_entries))
        sources_used.append(f"Reportes Ciudadanos: {len(recent_reports)} reportes recientes en la Senda")
    else:
        context_sections.append("REPORTES CIUDADANOS: No hay novedades ni incidencias de riesgo reportadas en este momento.")

    # 3. Zonas de Riesgo y Congestión
    zone_risks = db.query(ZoneRisk).all()
    if zone_risks:
        zone_entries = [
            f"- Zona: {zr.zone_name} | Nivel de Riesgo: {zr.risk_level} | Congestión: {zr.congestion_percentage}%"
            for zr in zone_risks
        ]
        context_sections.append("MONITOREO DE ZONAS Y CONGESTIÓN:\n" + "\n".join(zone_entries))
        sources_used.append(f"Monitoreo de Congestión: {len(zone_risks)} zonas monitoreadas")

    full_context = "\n\n".join(context_sections)
    return full_context, sources_used


def _generate_fallback_response(
    message: str,
    user_lat: Optional[float],
    user_lon: Optional[float],
    context_text: str,
    sources_used: List[str]
) -> ChatResponse:
    """Genera una respuesta inteligente de respaldo basada en los datos de la BD

    en caso de que la API de Gemini no esté configurada o no esté disponible.
    """
    has_location = user_lat is not None and user_lon is not None
    greeting = "¡Hola, paisano! Te saluda el Asistente Virtual Oficial del Carnaval de Negros y Blancos de Pasto. 🎉\n\n"

    body_lines = [
        "En este momento estoy operando con la información directa de nuestra base de datos en tiempo real:"
    ]

    if has_location:
        body_lines.append(f"• Tu ubicación actual registrada: Lat {user_lat:.4f}, Lon {user_lon:.4f}.")

    body_lines.append("\n**Estado y Puntos Clave del Carnaval:**")
    body_lines.append(context_text)

    body_lines.append(
        "\n**Recomendaciones de Seguridad:**\n"
        "- Recuerda acordar un punto de encuentro fijo (como la Plaza de Nariño o Parque Infantil) en caso de separarte de tus acompañantes.\n"
        "- Ante cualquier urgencia de salud, dirígete al puesto de atención médica más próximo o llama al 123.\n"
        "- ¡Disfruta la fiesta con alegría, respeto y tolerancia! ¡Que viva Pasto, Carajo!"
    )

    fallback_text = greeting + "\n".join(body_lines)
    return ChatResponse(response=fallback_text, sources_used=sources_used)


def generate_chat_response(
    message: str,
    user_latitude: Optional[float],
    user_longitude: Optional[float],
    db: Session
) -> ChatResponse:
    """Procesa el mensaje del usuario utilizando Google Gemini (gemini-2.5-flash)

    enriquecido con el contexto en tiempo real de la base de datos de Pasto.
    """
    # 1. Obtener contexto en tiempo real desde la BD
    db_context, sources_used = build_carnaval_context(
        db=db,
        user_lat=user_latitude,
        user_lon=user_longitude
    )

    # 2. Si no hay clave de API configurada, generar respuesta de contingencia
    if (
        not settings.GEMINI_API_KEY
        or settings.GEMINI_API_KEY.strip() == ""
        or settings.GEMINI_API_KEY == "tu_clave_de_gemini_aqui"
    ):
        logger.warning("GEMINI_API_KEY no configurada. Generando respuesta de asistencia basada en BD.")
        return _generate_fallback_response(
            message=message,
            user_lat=user_latitude,
            user_lon=user_longitude,
            context_text=db_context,
            sources_used=sources_used
        )

    # 3. Invocar al modelo gemini-2.5-flash
    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        location_info = (
            f"Coordenadas actuales del usuario: Latitud {user_latitude}, Longitud {user_longitude}."
            if user_latitude is not None and user_longitude is not None
            else "El usuario no ha compartido sus coordenadas geográficas en esta consulta."
        )

        user_prompt = f"""CONTEXTO EN TIEMPO REAL DE LA BASE DE DATOS (San Juan de Pasto):
{db_context}

INFORMACIÓN DE UBICACIÓN DEL USUARIO:
{location_info}

CONSULTA DEL USUARIO:
"{message}"

Por favor, responde a la consulta del usuario de forma amigable, precisa y servicial, aplicando tu rol como Asistente Virtual Oficial del Carnaval de Negros y Blancos de Pasto."""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.3,
            )
        )

        if not response or not response.text:
            logger.warning("Respuesta vacía recibida de Gemini. Usando respuesta de contingencia.")
            return _generate_fallback_response(
                message=message,
                user_lat=user_latitude,
                user_lon=user_longitude,
                context_text=db_context,
                sources_used=sources_used
            )

        return ChatResponse(
            response=response.text.strip(),
            sources_used=sources_used
        )

    except Exception as e:
        logger.error(f"Error al generar respuesta del chatbot con Gemini: {e}")
        # Nunca fallar con 500 al cliente; brindar fallback enriquecido con la BD
        return _generate_fallback_response(
            message=message,
            user_lat=user_latitude,
            user_lon=user_longitude,
            context_text=db_context,
            sources_used=sources_used
        )
