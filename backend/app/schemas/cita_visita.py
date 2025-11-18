from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


class CitaVisitaBase(BaseModel):
    """Schema base para CitaVisita"""
    fecha_visita_cita: datetime
    lugar_encuentro_cita: Optional[str] = None
    estado_cita: Optional[str] = None  # "Programada", "Confirmada", "Realizada", "Cancelada", "No asistió"
    nota_cita: Optional[str] = None
    recordatorio_minutos_cita: Optional[int] = 30
    
    @field_validator('fecha_visita_cita', mode='before')
    @classmethod
    def parse_fecha(cls, v):
        """Parsear diferentes formatos de fecha"""
        if isinstance(v, str):
            # Si viene con Z, reemplazar por +00:00
            if v.endswith('Z'):
                v = v[:-1] + '+00:00'
        return v


class CitaVisitaCreate(CitaVisitaBase):
    """Schema para crear una cita de visita"""
    id_propiedad: str
    ci_cliente: str
    id_usuario_asesor: str  # El broker elige qué asesor guiará la visita


class CitaVisitaUpdate(BaseModel):
    """Schema para actualizar una cita (todos los campos opcionales)"""
    fecha_visita_cita: Optional[datetime] = None
    lugar_encuentro_cita: Optional[str] = None
    estado_cita: Optional[str] = None
    nota_cita: Optional[str] = None
    recordatorio_minutos_cita: Optional[int] = None


class CitaVisitaResponse(CitaVisitaBase):
    """Schema para respuesta de cita"""
    id_cita: str
    id_propiedad: str
    ci_cliente: str
    id_usuario_asesor: Optional[str] = None

    class Config:
        from_attributes = True
