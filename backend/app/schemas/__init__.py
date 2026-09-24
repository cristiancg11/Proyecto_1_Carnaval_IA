"""Módulo de esquemas de datos Pydantic para validación y serialización."""
from app.schemas.report import ReportBase, ReportCreate, ReportResponse
from app.schemas.point_of_interest import POIBase, POICreate, POIResponse

__all__ = [
    "ReportBase",
    "ReportCreate",
    "ReportResponse",
    "POIBase",
    "POICreate",
    "POIResponse",
]
