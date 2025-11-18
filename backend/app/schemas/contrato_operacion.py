from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import date
from decimal import Decimal


class ContratoOperacionBase(BaseModel):
    id_propiedad: str
    ci_cliente: str
    id_usuario_colocador: str  # Usuario que cerró la operación
    tipo_operacion_contrato: str = Field(..., description="Venta, Alquiler, etc.")
    fecha_inicio_contrato: date
    fecha_fin_contrato: Optional[date] = None
    estado_contrato: str = "Borrador"  # Borrador, Activo, Finalizado, Cancelado
    modalidad_pago_contrato: str = Field(..., description="Contado, Cuotas, Financiado, etc.")
    precio_cierre_contrato: Decimal = Field(..., gt=0)
    fecha_cierre_contrato: Optional[date] = None
    observaciones_contrato: Optional[str] = None


class ContratoOperacionCreate(ContratoOperacionBase):
    @field_validator('fecha_fin_contrato')
    def validar_fecha_fin(cls, v, info):
        """Valida que fecha_fin sea posterior a fecha_inicio"""
        if v is not None:
            fecha_inicio = info.data.get('fecha_inicio_contrato')
            if fecha_inicio and v < fecha_inicio:
                raise ValueError('La fecha de fin debe ser posterior a la fecha de inicio')
        return v
    
    @field_validator('tipo_operacion_contrato')
    def validar_tipo_operacion(cls, v):
        tipos_validos = ['Venta', 'Alquiler', 'Anticrético', 'Traspaso']
        if v not in tipos_validos:
            raise ValueError(f'Tipo de operación debe ser uno de: {", ".join(tipos_validos)}')
        return v
    
    @field_validator('estado_contrato')
    def validar_estado(cls, v):
        estados_validos = ['Borrador', 'Activo', 'Finalizado', 'Cancelado']
        if v not in estados_validos:
            raise ValueError(f'Estado debe ser uno de: {", ".join(estados_validos)}')
        return v


class ContratoOperacionUpdate(BaseModel):
    id_propiedad: Optional[str] = None
    ci_cliente: Optional[str] = None
    id_usuario_colocador: Optional[str] = None
    tipo_operacion_contrato: Optional[str] = None
    fecha_inicio_contrato: Optional[date] = None
    fecha_fin_contrato: Optional[date] = None
    estado_contrato: Optional[str] = None
    modalidad_pago_contrato: Optional[str] = None
    precio_cierre_contrato: Optional[Decimal] = None
    fecha_cierre_contrato: Optional[date] = None
    observaciones_contrato: Optional[str] = None


class ContratoOperacionResponse(ContratoOperacionBase):
    id_contrato_operacion: str
    
    class Config:
        from_attributes = True
