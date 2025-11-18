from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import date
from decimal import Decimal


class PagoBase(BaseModel):
    id_contrato_operacion: str
    monto_pago: Decimal = Field(..., gt=0, description="Monto del pago")
    fecha_pago: date
    numero_cuota_pago: Optional[int] = Field(None, ge=1, description="Número de cuota si aplica")
    estado_pago: str = "Pendiente"  # Pendiente, Pagado, Atrasado, Cancelado


class PagoCreate(PagoBase):
    @field_validator('estado_pago')
    def validar_estado(cls, v):
        estados_validos = ['Pendiente', 'Pagado', 'Atrasado', 'Cancelado']
        if v not in estados_validos:
            raise ValueError(f'Estado debe ser uno de: {", ".join(estados_validos)}')
        return v


class PagoUpdate(BaseModel):
    id_contrato_operacion: Optional[str] = None
    monto_pago: Optional[Decimal] = None
    fecha_pago: Optional[date] = None
    numero_cuota_pago: Optional[int] = None
    estado_pago: Optional[str] = None


class PagoResponse(PagoBase):
    id_pago: str
    
    class Config:
        from_attributes = True
