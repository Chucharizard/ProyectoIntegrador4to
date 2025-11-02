from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import date
from decimal import Decimal
from app.schemas.direccion import DireccionCreate, DireccionResponse


class PropiedadBase(BaseModel):
    """Schema base para Propiedad"""
    codigo_publico_propiedad: Optional[str] = None
    titulo_propiedad: str
    descripcion_propiedad: Optional[str] = None
    precio_publicado_propiedad: Optional[Decimal] = None
    superficie_propiedad: Optional[Decimal] = None
    tipo_operacion_propiedad: Optional[str] = None  # "Venta", "Alquiler", "Anticrético"
    estado_propiedad: Optional[str] = None  # "Captada", "Publicada", "Reservada", "Cerrada"
    fecha_captacion_propiedad: Optional[date] = None
    fecha_publicacion_propiedad: Optional[date] = None
    fecha_cierre_propiedad: Optional[date] = None
    porcentaje_captacion_propiedad: Optional[Decimal] = None
    porcentaje_colocacion_propiedad: Optional[Decimal] = None


class PropiedadCreate(PropiedadBase):
    """Schema para crear una propiedad"""
    ci_propietario: str
    
    # Opción 1: ID de dirección existente
    id_direccion: Optional[str] = None
    
    # Opción 2: Objeto dirección (se crea automáticamente)
    direccion: Optional[DireccionCreate] = None
    
    # Usuario captador se asigna automáticamente del usuario autenticado
    # id_usuario_colocador es NULL hasta que se cierre la operación
    id_usuario_colocador: Optional[str] = None
    
    @field_validator('id_direccion')
    @classmethod
    def limpiar_id_direccion(cls, v):
        """Convertir strings vacíos a None"""
        if v == "" or (isinstance(v, str) and v.strip() == ""):
            return None
        return v
    
    @field_validator('id_usuario_colocador')
    @classmethod
    def limpiar_id_colocador(cls, v):
        """Convertir strings vacíos a None y validar que no sea 'string'"""
        if v == "" or v == "string" or (isinstance(v, str) and v.strip() == ""):
            return None
        return v
    
    @field_validator('direccion')
    @classmethod
    def validar_direccion_completa(cls, v, info):
        """Validar que al menos una forma de dirección esté presente"""
        # Obtener id_direccion (ya limpio por el validator anterior)
        id_direccion = info.data.get('id_direccion')
        
        # Al menos uno debe estar presente
        if not id_direccion and not v:
            raise ValueError('Debes proporcionar id_direccion o direccion')
        
        # No ambos al mismo tiempo
        if id_direccion and v:
            raise ValueError('Proporciona solo id_direccion O direccion, no ambos')
        
        return v


class PropiedadUpdate(BaseModel):
    """Schema para actualizar una propiedad (todos los campos opcionales)"""
    codigo_publico_propiedad: Optional[str] = None
    titulo_propiedad: Optional[str] = None
    descripcion_propiedad: Optional[str] = None
    precio_publicado_propiedad: Optional[Decimal] = None
    superficie_propiedad: Optional[Decimal] = None
    tipo_operacion_propiedad: Optional[str] = None
    estado_propiedad: Optional[str] = None
    fecha_publicacion_propiedad: Optional[date] = None
    fecha_cierre_propiedad: Optional[date] = None
    id_usuario_colocador: Optional[str] = None
    porcentaje_captacion_propiedad: Optional[Decimal] = None
    porcentaje_colocacion_propiedad: Optional[Decimal] = None
    
    @field_validator('id_usuario_colocador')
    @classmethod
    def limpiar_id_colocador_update(cls, v):
        """Convertir strings vacíos a None"""
        if v == "" or v == "string" or (isinstance(v, str) and v.strip() == ""):
            return None
        return v


class PropiedadResponse(PropiedadBase):
    """Schema para respuesta de propiedad"""
    id_propiedad: str
    id_direccion: str
    ci_propietario: str
    id_usuario_captador: Optional[str] = None
    id_usuario_colocador: Optional[str] = None
    
    # Incluir la dirección completa en la respuesta
    direccion: Optional[DireccionResponse] = None

    class Config:
        from_attributes = True
