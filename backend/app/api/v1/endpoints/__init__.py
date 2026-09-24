"""Controladores y endpoints de la API v1."""
from app.api.v1.endpoints.reports import router as reports_router

__all__ = ["reports_router"]
