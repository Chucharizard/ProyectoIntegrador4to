from pydantic import BaseModel, HttpUrl
from typing import Optional
from datetime import datetime


class ImagenPropiedadBase(BaseModel):
    """Schema base para ImagenPropiedad"""
    url_imagen: str
    descripcion_imagen: Optional[str] = None
    es_portada_imagen: Optional[bool] = False
    orden_imagen: Optional[int] = 0


class ImagenPropiedadCreate(ImagenPropiedadBase):
    """Schema para crear una imagen de propiedad"""
    id_propiedad: str


class ImagenPropiedadUpdate(BaseModel):
    """Schema para actualizar una imagen (todos los campos opcionales)"""
    url_imagen: Optional[str] = None
    descripcion_imagen: Optional[str] = None
    es_portada_imagen: Optional[bool] = None
    orden_imagen: Optional[int] = None


class ImagenPropiedadResponse(ImagenPropiedadBase):
    """Schema para respuesta de imagen"""
    id_imagen: str
    id_propiedad: str

    class Config:
        from_attributes = True
