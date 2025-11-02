from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DocumentoPropiedadBase(BaseModel):
    """Schema base para DocumentoPropiedad"""
    tipo_documento: Optional[str] = None  # "Título", "Plano", "Folio Real", "Contrato", etc.
    ruta_archivo_documento: str
    observaciones_documento: Optional[str] = None


class DocumentoPropiedadCreate(DocumentoPropiedadBase):
    """Schema para crear un documento de propiedad"""
    id_propiedad: str


class DocumentoPropiedadUpdate(BaseModel):
    """Schema para actualizar un documento (todos los campos opcionales)"""
    tipo_documento: Optional[str] = None
    ruta_archivo_documento: Optional[str] = None
    observaciones_documento: Optional[str] = None


class DocumentoPropiedadResponse(DocumentoPropiedadBase):
    """Schema para respuesta de documento"""
    id_documento: str
    id_propiedad: str
    fecha_subida_documento: Optional[datetime] = None

    class Config:
        from_attributes = True
