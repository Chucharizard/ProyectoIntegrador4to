"""
Schemas para DetallePropiedad (características adicionales para publicación)
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DetalleBase(BaseModel):
    """Schema base para detalle de propiedad"""
    # Números
    num_dormitorios: Optional[int] = 0
    num_banos: Optional[int] = 0
    capacidad_estacionamiento: Optional[int] = 0
    
    # Características booleanas
    tiene_jardin: Optional[bool] = False
    tiene_piscina: Optional[bool] = False
    tiene_garaje_techado: Optional[bool] = False
    tiene_area_servicio: Optional[bool] = False
    tiene_buena_vista: Optional[bool] = False
    tiene_ascensor: Optional[bool] = False
    tiene_balcon: Optional[bool] = False
    tiene_terraza: Optional[bool] = False
    tiene_sala_estar: Optional[bool] = False
    tiene_cocina_equipada: Optional[bool] = False
    
    # Otros detalles
    antiguedad_anios: Optional[int] = None
    estado_construccion: Optional[str] = None  # "Nuevo", "A estrenar", "Buen estado", "A refaccionar"


class DetalleCreate(DetalleBase):
    """Schema para crear detalle de propiedad"""
    id_propiedad: str


class DetalleUpdate(DetalleBase):
    """Schema para actualizar detalle (todos opcionales)"""
    pass


class DetalleResponse(DetalleBase):
    """Schema para respuesta de detalle"""
    id_detalle: str
    id_propiedad: str
    fecha_creacion_detalle: datetime

    class Config:
        from_attributes = True
