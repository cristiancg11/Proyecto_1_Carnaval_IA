"""Punto de entrada principal para CarnavalIA API.

Sistema inteligente para el Carnaval de Negros y Blancos de Pasto.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine
# Importar modelos para que Base.metadata los reconozca al crear las tablas
import app.models  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ciclo de vida de la aplicación: crea tablas al iniciar."""
    # Creación automática de tablas en la base de datos configurada
    Base.metadata.create_all(bind=engine)
    yield


# Instancia de FastAPI con ciclo de vida (lifespan)
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="API inteligente para la gestión y experiencia interactiva del Carnaval de Negros y Blancos de Pasto.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configuración de Middleware de CORS (permite cualquier origen)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["General"])
async def root():
    """Ruta raíz de bienvenida al sistema CarnavalIA."""
    return {
        "message": "¡Bienvenido a CarnavalIA API! Sistema inteligente para el Carnaval de Negros y Blancos de Pasto.",
        "status": "online",
        "documentation": "/docs",
        "version": settings.VERSION
    }


@app.get("/api/v1/health", tags=["Health"])
async def health_check():
    """Endpoint para verificación del estado del servicio."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION
    }
