from pydantic import BaseModel, Field, field_validator
from typing import Optional


class DesempenoAsesorBase(BaseModel):
    id_usuario_asesor: str
    periodo_desempeno: str = Field(..., description="Formato: 'YYYY-MM' (mensual) o 'YYYY' (anual)")
    captaciones_desempeno: int = Field(default=0, ge=0, description="Propiedades captadas en el periodo")
    colocaciones_desempeno: int = Field(default=0, ge=0, description="Contratos cerrados en el periodo")
    visitas_agendadas_desempeno: int = Field(default=0, ge=0, description="Citas asignadas en el periodo")
    operaciones_cerradas_desempeno: int = Field(default=0, ge=0, description="No usado actualmente")
    tiempo_promedio_cierre_dias_desempeno: int = Field(default=0, ge=0, description="No usado actualmente")


class DesempenoAsesorCreate(DesempenoAsesorBase):
    @field_validator('periodo_desempeno')
    def validar_periodo(cls, v):
        # Validar formatos: YYYY-MM (mensual) o YYYY (anual)
        import re
        if not re.match(r'^\d{4}(-\d{2})?$', v):
            raise ValueError('Formato de periodo inválido. Use: YYYY-MM (mensual) o YYYY (anual)')
        return v


class DesempenoAsesorGenerar(BaseModel):
    """Schema para generar análisis de desempeño automáticamente"""
    id_usuario_asesor: str
    tipo_periodo: str = Field(..., description="'mensual' o 'anual'")
    anio: int = Field(..., ge=2020, le=2030)
    mes: Optional[int] = Field(None, ge=1, le=12, description="Requerido si tipo_periodo es 'mensual'")
    
    @field_validator('tipo_periodo')
    def validar_tipo_periodo(cls, v):
        if v not in ['mensual', 'anual']:
            raise ValueError("tipo_periodo debe ser 'mensual' o 'anual'")
        return v


class DesempenoAsesorUpdate(BaseModel):
    id_usuario_asesor: Optional[str] = None
    periodo_desempeno: Optional[str] = None
    captaciones_desempeno: Optional[int] = Field(None, ge=0)
    colocaciones_desempeno: Optional[int] = Field(None, ge=0)
    visitas_agendadas_desempeno: Optional[int] = Field(None, ge=0)
    operaciones_cerradas_desempeno: Optional[int] = Field(None, ge=0)
    tiempo_promedio_cierre_dias_desempeno: Optional[int] = Field(None, ge=0)


class DesempenoAsesorResponse(DesempenoAsesorBase):
    id_desempeno: str
    
    class Config:
        from_attributes = True
