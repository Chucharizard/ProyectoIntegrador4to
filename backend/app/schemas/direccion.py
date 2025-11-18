from pydantic import BaseModel
from typing import Optional
from decimal import Decimal


class DireccionBase(BaseModel):
    """Schema base para Direccion"""
    calle_direccion: str
    ciudad_direccion: str
    zona_direccion: Optional[str] = None
    latitud_direccion: Optional[Decimal] = None
    longitud_direccion: Optional[Decimal] = None


class DireccionCreate(DireccionBase):
    """Schema para crear una dirección"""
    pass


class DireccionUpdate(BaseModel):
    """Schema para actualizar una dirección (todos los campos opcionales)"""
    calle_direccion: Optional[str] = None
    ciudad_direccion: Optional[str] = None
    zona_direccion: Optional[str] = None
    latitud_direccion: Optional[Decimal] = None
    longitud_direccion: Optional[Decimal] = None


class DireccionResponse(DireccionBase):
    """Schema para respuesta de dirección"""
    id_direccion: str

    class Config:
        from_attributes = True
