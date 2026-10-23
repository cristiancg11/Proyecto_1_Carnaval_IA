"""Servicio de TaitaBot - Asistente Virtual Oficial del Carnaval de Negros y Blancos de Pasto.

Patrimonio Cultural Inmaterial de la Humanidad por la UNESCO.
Conecta con Google Gemini utilizando `google-generativeai` y `GEMINI_API_KEY`.
"""
import logging
import re
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.schemas.chat import ChatResponse

logger = logging.getLogger(__name__)

# ==============================================================================
# SYSTEM PROMPT OFICIAL DE GUANEÑABOT / TAITABOT (PASTO)
# ==============================================================================
GUANENABOT_SYSTEM_PROMPT = """Eres "GuaneñaBot" (también conocido como "TaitaBot"), el Asistente Oficial con Inteligencia Artificial del Carnaval de Negros y Blancos de San Juan de Pasto, declarado Patrimonio Cultural Inmaterial de la Humanidad por la UNESCO.
Tu misión es orientar, acompañar y transmitir el alma de la fiesta andina a propios y turistas con información precisa, contextualizada y en tiempo real.

1. Personalidad y Tono:
- Cálido, orgulloso de la cultura nariñense y pastusa, festivo y respetuoso.
- Usa expresiones y modismos nariñenses auténticos con moderación y gracia: "¡Qué viva Pasto, carajo!", "cumpa", "güeno", "paisano", "churo", "achichucas", "guagua".
- Respuestas concisas, festivas, directas y organizadas con viñetas o párrafos breves.

2. Conocimiento Oficial del Calendario (Día por Día):
- 28 de Diciembre: Arcoíris en el Asfalto (arte efímero en tiza sobre la Calle del Colorado) y Bici-Carnaval.
- 2 y 3 de Enero: Ofrenda a la Virgen de las Mercedes y Carnavalito (desfile de los niños artesanos y colectivos coreográficos infantiles).
- 3 de Enero: Canto a la Tierra (desfile magno de colectivos coreográficos en la Senda del Carnaval con quenas, zampoñas y bombos).
- 4 de Enero: Llegada de la Familia Castañeda (bienvenida a propios y turistas, estampas costumbristas y trajes de época).
- 5 de Enero: Día de los Negros (Juego de la pintica negra, cosmético, orquestas en la Plaza del Carnaval y Plaza de Nariño).
- 6 de Enero: Día de los Blancos / Desfile Magno (Carrozas monumentales de los artesanos, murgas, comparsas, disfraces individuales y juego limpio con talco, carioca/espuma).
- 7 de Enero: Día del Cuy y Festival de la Trucha (remate gastronómico en Catambuco, Genoy y El Encano / Laguna de la Cocha).

3. Recomendaciones Clave:
- Juego Limpio: Usar gafas de protección, ropa cómoda que se pueda ensuciar, comprar talco autorizado y carioca oficial; cuidar los ojos y respetar a quienes no juegan.
- Senda del Carnaval: Recorrido que va desde la Avenida de los Estudiantes, pasando por la Carrera 27 hasta llegar a la Plaza del Carnaval. Recomendar llegar temprano (antes de las 8:00 AM) para tomar buen lugar.
- Gastronomía: Cuy asado con papa pastusa y ají de maní, frito pastuso, empanadas de añejo, helados de paila, hervidos de maracuyá/lulo con chapil o aguardiente Nariño.
"""

# Alias para compatibilidad
TAITABOT_SYSTEM_PROMPT = GUANENABOT_SYSTEM_PROMPT


# ==============================================================================
# GENERADOR HEURÍSTICO DE RESPALDO (TAITABOT SMART FALLBACK)
# ==============================================================================
def _generate_taitabot_fallback(message: str) -> str:
    """Genera una respuesta auténtica de TaitaBot con tono pastuso festivo y conciso

    cuando la API de Gemini no esté configurada o no responda.
    """
    q = message.lower()

    # 1. Recorrido de la Senda del Carnaval
    if any(k in q for k in ["recorrido", "senda", "ruta", "camino", "donde pasa", "dónde pasa", "trayecto"]):
        return (
            "¡Qué viva Pasto, carajo! 🎉 Te cuento, paisano, cómo es el recorrido oficial de la **Senda del Carnaval** (~7 km de arte y emoción):\n\n"
            "• **Punto de Salida:** Inicia al norte en la **Avenida de los Estudiantes** (sector Morasurco / Normal Superior).\n"
            "• **Eje Central:** Baja con todo el fervor por la **Carrera 27**, pasando a pocas cuadras de la Plaza de Nariño.\n"
            "• **Llegada:** Remata en la **Plaza del Carnaval y la Cultura** hacia el sector de Champagnat.\n\n"
            "⏰ **Consejo de TaitaBot:** ¡Madruga, cumpa! Llega antes de las **8:00 AM** para coger buen lugar en la senda o graderías, ponte tus gafas de protección y lleva ropa abrigadita."
        )

    # 2. Qué se celebra el 5 y 6 de enero (Día de Negros y Día de Blancos)
    if any(k in q for k in ["5 y 6", "5 de enero", "6 de enero", "negros y blancos", "dia de negros", "día de negros", "dia de blancos", "día de blancos", "desfile magno"]):
        return (
            "¡Esa es la cumbre de nuestra fiesta magna, paisano! Mira qué se vive en cada día:\n\n"
            "• 🖤 **5 de Enero - Día de los Negros:** Conmemoramos la igualdad y la fraternidad humana con el tradicional **juego de la pintica** (cosmético negro). ¡Aquí todos nos pintamos con respeto y alegría! Hay orquestas y tarimas musicales en la Plaza del Carnaval y Plaza de Nariño (en este día no desfilan carrozas).\n\n"
            "• 🤍 **6 de Enero - Día de los Blancos (Desfile Magno):** La apoteosis del talento artesanal pastuso. Por la Senda desfilan majestuosas **Carrozas Monumentales de hasta 12 metros**, comparsas, murgas andinas y disfraces individuales, acompañados del juego limpio con talco perfumado y carioca.\n\n"
            "¡Una experiencia que te eriza la piel, cumpa! ¡Qué viva Pasto, carajo!"
        )

    # 3. Dónde comer un buen plato típico en Pasto / Gastronomía
    if any(k in q for k in ["comer", "comida", "plato tipico", "plato típico", "restaurante", "cuy", "empanada", "frito", "hervido", "gastronomia", "gastronomía", "hambre", "catambuco", "trucha"]):
        return (
            "¡Uyyy achichucas, qué hambre tan güena, paisano! 🍽️ En Pasto la gastronomía es una bendición de la tierra. Te recomiendo estos manjares tradicionales:\n\n"
            "1. 🐹 **Cuy Asado:** Con papa pastusa al vapor y ají de maní casero. El mejor se degusta en los asaderos del corregimiento de **Catambuco** y **Obonuco**.\n"
            "2. 🥟 **Empanadas de Añejo:** Crocantes con masa de maíz fermentado y guiso de pipián. Visita las tradicionales cafeterías del **Centro Histórico y Plaza de Nariño**.\n"
            "3. 🥓 **Frito Pastuso:** Trozos doraditos de cerdo acompañados de crispetas y papa.\n"
            "4. 🍨 **Helados de Paila:** Hechos artesanalmente en paila de cobre en los portales del centro.\n"
            "5. ☕ **Hervidos Nariñenses:** De maracuyá, lulo o mora con un toque de chapil o aguardiente Nariño para calentarse la noche.\n"
            "6. 🐟 **Trucha Arcoíris:** En el corregimiento de **El Encano**, junto a la mágica Laguna de la Cocha."
        )

    # 4. 28 de Diciembre - Arcoíris en el Asfalto
    if any(k in q for k in ["28 de dic", "28 dic", "arcoiris", "arcoíris", "asfalto", "colorado", "tiza", "bici"]):
        return (
            "¡Paisano, el **28 de diciembre** es pura magia comunitaria! 🎨✨\n\n"
            "Celebramos **Arcoíris en el Asfalto** en la Calle del Colorado (Cra 23 entre Calles 14 y 15). "
            "Cientos de niños, familias y artistas plasman hermosas obras efímeras con tizas de colores sobre el asfalto como canto a la paz y cuidado del agua, junto al Bici-Carnaval.\n\n"
            "¡Es un día bellísimo para caminar en familia! ¡Qué viva Pasto, carajo!"
        )

    # 5. 2 y 3 de Enero - Carnavalito y Canto a la Tierra
    if any(k in q for k in ["carnavalito", "mercedes", "virgen", "canto a la tierra", "colectivo", "colectivos", "zampoña", "quena", "bombo"]):
        return (
            "¡Ay cumpa, la fuerza de los Andes se siente viva el 2 y 3 de enero! 🎶🎺\n\n"
            "• **2 de Enero - Ofrenda y Carnavalito:** Los guaguas (niños) son protagonistas con sus mini-carrozas y danzas infantiles, rindiendo tributo a la Virgen de las Mercedes.\n"
            "• **3 de Enero - Canto a la Tierra:** Desfile magno de **Colectivos Coreográficos** por la Senda. Miles de músicos y danzantes hacen retumbar quenas, zampoñas y bombos con trajes multicolores en honor a la Pachamama.\n\n"
            "¡Una fiesta mística que emociona hasta las lágrimas!"
        )

    # 6. 4 de Enero - Familia Castañeda
    if any(k in q for k in ["castañeda", "castaneda", "familia", "4 de ene", "cuadro de epoca", "campesina"]):
        return (
            "¡Abran paso, paisano, que llega la **Familia Castañeda** este **4 de enero**! 🤠🎉\n\n"
            "Es el desfile de bienvenida oficial a propios y visitantes. Se recrea la comitiva campesina que llegó a Pasto en 1929, con carretas antiguas, estampas de época, teatro callejero y mucho humor.\n\n"
            "⚠️ **Ojo:** El centro histórico queda 100% peatonalizado para gozar en familia."
        )

    # 7. 7 de Enero - Día del Cuy y Festival de la Trucha
    if any(k in q for k in ["7 de ene", "remate", "cocha", "encano", "genoy"]):
        return (
            "¡El sabroso remate de la fiesta, cumpa! El **7 de enero** es el **Día del Cuy y Festival de la Trucha**. 🍽️\n\n"
            "La fiesta se traslada al campo: Catambuco y Genoy para saborear el mejor cuy campesino con música de cuerda, y El Encano para disfrutar de la trucha arcoíris en la Laguna de la Cocha.\n\n"
            "¡El broche de oro con toda la calidez de nuestra gente!"
        )

    # 8. Juego Limpio, Seguridad y Recomendaciones
    if any(k in q for k in ["juego limpio", "gafas", "talco", "carioca", "espuma", "seguridad", "cuidado", "ojo", "ojos", "ropa"]):
        return (
            "¡Carnavalero precavido vale por dos, paisano! 🛡️🎭 Recuerda las normas del **Juego Limpio**:\n\n"
            "• 🥽 **Usa gafas de protección transparentes:** Cuidan tus ojos del talco y la carioca.\n"
            "• 👕 **Ropa cómoda:** Usa prendas que se puedan ensuciar y que te abriguen del frío pastuso.\n"
            "• 🧴 **Productos autorizados:** Compra talco y carioca con sello oficial de Corpocarnaval.\n"
            "• 🤝 **Respeto mutuo:** No le eches cosmético ni talco a quien no esté jugando o porte distintivo de observación, y cuida a los niños.\n\n"
            "¡Gocémonos la fiesta en paz y fraternidad! ¡Qué viva Pasto, carajo!"
        )

    # Respuesta General de GuaneñaBot / TaitaBot
    return (
        "¡Qué viva Pasto, carajo! Te saluda **GuaneñaBot** (TaitaBot), tu Asistente Oficial del Carnaval de Negros y Blancos de San Juan de Pasto (Patrimonio Cultural Inmaterial de la Humanidad por la UNESCO). 🎉🎭\n\n"
        "Estoy listo para orientarte con todo el amor por nuestra tierra sobre:\n"
        "• **Calendario Oficial:** Arcoíris en el Asfalto (28-dic), Carnavalito (2 y 3-ene), Canto a la Tierra (3-ene), Familia Castañeda (4-ene), Día de Negros (5-ene), Desfile Magno de Blancos (6-ene) y Día del Cuy (7-ene).\n"
        "• **Senda del Carnaval:** Recorrido desde la Av. de los Estudiantes por la Cra 27 hasta la Plaza del Carnaval (¡llega antes de las 8:00 AM!).\n"
        "• **Gastronomía Nariñense:** Cuy asado con papa pastusa y ají de maní, frito pastuso, empanadas de añejo y hervidos con chapil o aguardiente Nariño.\n"
        "• **Juego Limpio:** Cuidados con talco autorizado, carioca oficial y gafas de protección.\n\n"
        "¿En qué te puedo colaborar hoy, paisano? ¡Pregunta con confianza, cumpa!"
    )


_generate_guanenabot_fallback = _generate_taitabot_fallback


# ==============================================================================
# FUNCIÓN PRINCIPAL DE ENTRADA: generate_chat_response
# ==============================================================================
def generate_chat_response(
    message: str,
    user_latitude: Optional[float] = None,
    user_longitude: Optional[float] = None,
    user_lat: Optional[float] = None,
    user_lng: Optional[float] = None,
    selected_day: Optional[str] = None,
    db: Optional[Session] = None
) -> ChatResponse:
    """Procesa la pregunta del usuario con la API de Google Gemini (google-generativeai)

    configurado como TaitaBot para el Carnaval de Negros y Blancos de Pasto.
    Si no hay clave configurada o falla la conexión, utiliza el generador de respaldo.
    """
    cleaned_message = message.strip() if message else ""
    if not cleaned_message:
        reply = "¡Qué viva Pasto, carajo! Dime qué deseas saber sobre el Carnaval de Negros y Blancos y con gusto te oriento, paisano."
        return ChatResponse(response=reply, reply=reply)

    # 1. Verificar si existe API Key de Google Gemini válida
    api_key = settings.GEMINI_API_KEY.strip() if settings.GEMINI_API_KEY else ""
    has_valid_key = bool(api_key and api_key != "tu_clave_de_gemini_aqui")

    if not has_valid_key:
        logger.info("TaitaBot operando con generador inteligente oficial de Pasto.")
        reply = _generate_taitabot_fallback(cleaned_message)
        return ChatResponse(
            response=reply,
            reply=reply,
            sources_used=["Base Oficial del Carnaval de Negros y Blancos de Pasto (UNESCO)"]
        )

    # 2. Intento 1: Conexión vía google-generativeai
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)

        candidate_models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-2.5-flash", "gemini-pro"]
        model = None
        for mod_name in candidate_models:
            try:
                model = genai.GenerativeModel(
                    model_name=mod_name,
                    system_instruction=TAITABOT_SYSTEM_PROMPT
                )
                break
            except Exception:
                continue

        if model is not None:
            prompt_text = f"Consulta del ciudadano/turista sobre el Carnaval de Pasto: {cleaned_message}"
            response = model.generate_content(prompt_text)
            if response and response.text:
                reply = response.text.strip()
                return ChatResponse(
                    response=reply,
                    reply=reply,
                    sources_used=["Google Gemini (google-generativeai)", "Carnaval de Negros y Blancos de Pasto"]
                )
    except Exception as e:
        logger.warning(f"Error conectando con google-generativeai: {e}. Intentando alternativa...")

    # 3. Intento 2: Conexión vía google-genai moderno (si está disponible)
    try:
        from google import genai as modern_genai
        from google.genai import types

        client = modern_genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=cleaned_message,
            config=types.GenerateContentConfig(
                system_instruction=TAITABOT_SYSTEM_PROMPT,
                temperature=0.35,
            )
        )
        if response and response.text:
            reply = response.text.strip()
            return ChatResponse(
                response=reply,
                reply=reply,
                sources_used=["Google Gemini (google-genai)", "Carnaval de Negros y Blancos de Pasto"]
            )
    except Exception as e:
        logger.warning(f"Error conectando con google-genai: {e}")

    # 4. Fallback garantizado oficial de TaitaBot
    logger.info("Activando respuesta oficial de respaldo de TaitaBot (Pasto).")
    fallback_reply = _generate_taitabot_fallback(cleaned_message)
    return ChatResponse(
        response=fallback_reply,
        reply=fallback_reply,
        sources_used=["Base Oficial del Carnaval de Negros y Blancos de Pasto (UNESCO)"]
    )
