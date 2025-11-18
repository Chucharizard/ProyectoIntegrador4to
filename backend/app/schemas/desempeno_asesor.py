from pydantic import BaseModel, Field, field_validator
from typing import Optional


class DesempenoAsesorBase(BaseModel):
    id_usuario_asesor: str
    periodo_desempeno: str = Field(..., description="Ej: '2025-01', '2025-Q1', '2025'")
    captaciones_desempeno: int = Field(default=0, ge=0)
    publicaciones_desempeno: int = Field(default=0, ge=0)
    visitas_agendadas_desempeno: int = Field(default=0, ge=0)
    operaciones_cerradas_desempeno: int = Field(default=0, ge=0)
    tiempo_promedio_cierre_dias_desempeno: int = Field(default=0, ge=0)


class DesempenoAsesorCreate(DesempenoAsesorBase):
    @field_validator('periodo_desempeno')
    def validar_periodo(cls, v):
        # Validar formatos: YYYY-MM, YYYY-Q1, YYYY
        import re
        if not re.match(r'^\d{4}(-\d{2}|-Q[1-4])?$', v):
            raise ValueError('Formato de periodo inválido. Use: YYYY-MM, YYYY-Q1 o YYYY')
        return v


class DesempenoAsesorUpdate(BaseModel):
    id_usuario_asesor: Optional[str] = None
    periodo_desempeno: Optional[str] = None
    captaciones_desempeno: Optional[int] = Field(None, ge=0)
    publicaciones_desempeno: Optional[int] = Field(None, ge=0)
    visitas_agendadas_desempeno: Optional[int] = Field(None, ge=0)
    operaciones_cerradas_desempeno: Optional[int] = Field(None, ge=0)
    tiempo_promedio_cierre_dias_desempeno: Optional[int] = Field(None, ge=0)


class DesempenoAsesorResponse(DesempenoAsesorBase):
    id_desempeno: str
    
    class Config:
        from_attributes = True
