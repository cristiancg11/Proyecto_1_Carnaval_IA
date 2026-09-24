"""Endpoints para la gestión de reportes ciudadanos e incidencias."""
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.report import Report
from app.schemas.report import ReportCreate, ReportResponse
from app.services.ai_service import analyze_report_risk

router = APIRouter()


@router.post(
    "",
    response_model=ReportResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False
)
@router.post(
    "/",
    response_model=ReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un nuevo reporte ciudadano con análisis de IA",
    description="Registra un reporte de incidencia ciudadana y evalúa automáticamente su nivel de riesgo con Gemini AI."
)
def create_report(
    report_in: ReportCreate,
    db: Session = Depends(get_db)
):
    """Crea un reporte, ejecuta el análisis de riesgo con IA y lo almacena en la base de datos."""
    # 1. Analizar nivel de riesgo con el servicio de IA (Gemini 2.5 Flash)
    ai_result = analyze_report_risk(
        title=report_in.title,
        description=report_in.description or ""
    )
    ai_risk_level = ai_result.get("risk_level", "Bajo")

    # 2. Instanciar el modelo ORM con los datos validados y el riesgo calculado
    db_report = Report(
        title=report_in.title,
        description=report_in.description,
        category=report_in.category,
        latitude=report_in.latitude,
        longitude=report_in.longitude,
        ai_risk_level=ai_risk_level,
        status="Pendiente"
    )

    # 3. Guardar en base de datos
    db.add(db_report)
    db.commit()
    db.refresh(db_report)

    return db_report


@router.get(
    "",
    response_model=List[ReportResponse],
    include_in_schema=False
)
@router.get(
    "/",
    response_model=List[ReportResponse],
    summary="Obtener lista de reportes",
    description="Permite listar y filtrar reportes ciudadanos por categoría y/o estado de atención."
)
def list_reports(
    category: Annotated[Optional[str], Query(description="Filtrar por categoría (ej. Aglomeracion, Emergencia, etc.)")] = None,
    status: Annotated[Optional[str], Query(description="Filtrar por estado (ej. Pendiente, En_Revision, Atendido)")] = None,
    skip: Annotated[int, Query(ge=0, description="Número de registros a omitir")] = 0,
    limit: Annotated[int, Query(ge=1, le=500, description="Límite de registros a retornar")] = 100,
    db: Session = Depends(get_db)
):
    """Retorna la lista de reportes aplicando los filtros especificados."""
    query = db.query(Report)

    if category is not None:
        query = query.filter(Report.category == category)
    if status is not None:
        query = query.filter(Report.status == status)

    return query.order_by(Report.created_at.desc()).offset(skip).limit(limit).all()


@router.get(
    "/{report_id}",
    response_model=ReportResponse,
    summary="Obtener reporte por ID",
    description="Retorna la información detallada de un reporte específico según su identificador único."
)
def get_report(
    report_id: int,
    db: Session = Depends(get_db)
):
    """Busca y retorna un reporte individual por su identificador primario."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reporte con ID {report_id} no fue encontrado."
        )
    return report
