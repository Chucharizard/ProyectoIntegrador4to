from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import date
from decimal import Decimal


class GananciaEmpleadoBase(BaseModel):
    id_propiedad: str
    id_usuario_empleado: str
    tipo_operacion_ganancia: str = Field(..., description="Captación, Colocación, Ambas")
    porcentaje_ganado_ganancia: Decimal = Field(..., ge=0, le=100, description="Porcentaje 0-100")
    dinero_ganado_ganancia: Decimal = Field(..., ge=0)
    esta_concretado_ganancia: bool = False
    fecha_cierre_ganancia: Optional[date] = None


class GananciaEmpleadoCreate(GananciaEmpleadoBase):
    @field_validator('tipo_operacion_ganancia')
    def validar_tipo_operacion(cls, v):
        tipos_validos = ['Captación', 'Colocación', 'Ambas']
        if v not in tipos_validos:
            raise ValueError(f'Tipo de operación debe ser uno de: {", ".join(tipos_validos)}')
        return v


class GananciaEmpleadoUpdate(BaseModel):
    id_propiedad: Optional[str] = None
    id_usuario_empleado: Optional[str] = None
    tipo_operacion_ganancia: Optional[str] = None
    porcentaje_ganado_ganancia: Optional[Decimal] = Field(None, ge=0, le=100)
    dinero_ganado_ganancia: Optional[Decimal] = Field(None, ge=0)
    esta_concretado_ganancia: Optional[bool] = None
    fecha_cierre_ganancia: Optional[date] = None


class GananciaEmpleadoResponse(GananciaEmpleadoBase):
    id_ganancia: str
    
    class Config:
        from_attributes = True
