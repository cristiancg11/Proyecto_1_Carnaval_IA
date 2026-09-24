"""Configuración del motor de Base de Datos y Sesiones de SQLAlchemy."""
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings

# Para SQLite se requiere check_same_thread=False en entornos multihilo como FastAPI
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Creación del engine
engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False,
    pool_pre_ping=True
)

# Fábrica de sesiones
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# Clase base para todos los modelos ORM (SQLAlchemy 2.0)
class Base(DeclarativeBase):
    pass


def get_db() -> Generator:
    """Función generadora para inyección de dependencia de sesión de base de datos."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
