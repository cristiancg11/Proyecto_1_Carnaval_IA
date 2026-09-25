"""Módulo de esquemas de datos Pydantic para validación y serialización."""
from app.schemas.report import ReportBase, ReportCreate, ReportResponse
from app.schemas.point_of_interest import POIBase, POICreate, POIResponse
from app.schemas.chat import ChatRequest, ChatResponse
from app.schemas.zone_risk import ZoneRiskBase, ZoneRiskResponse

__all__ = [
    "ReportBase",
    "ReportCreate",
    "ReportResponse",
    "POIBase",
    "POICreate",
    "POIResponse",
    "ChatRequest",
    "ChatResponse",
    "ZoneRiskBase",
    "ZoneRiskResponse",
]
