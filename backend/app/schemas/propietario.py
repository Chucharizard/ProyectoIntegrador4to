from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date


class PropietarioBase(BaseModel):
    """Schema base para Propietario"""
    nombres_completo_propietario: str
    apellidos_completo_propietario: str
    fecha_nacimiento_propietario: Optional[date] = None
    telefono_propietario: Optional[str] = None
    correo_electronico_propietario: Optional[EmailStr] = None


class PropietarioCreate(PropietarioBase):
    """Schema para crear un propietario"""
    ci_propietario: str


class PropietarioUpdate(BaseModel):
    """Schema para actualizar un propietario (todos los campos opcionales)"""
    nombres_completo_propietario: Optional[str] = None
    apellidos_completo_propietario: Optional[str] = None
    fecha_nacimiento_propietario: Optional[date] = None
    telefono_propietario: Optional[str] = None
    correo_electronico_propietario: Optional[EmailStr] = None
    es_activo_propietario: Optional[bool] = None


class PropietarioResponse(PropietarioBase):
    """Schema para respuesta de propietario"""
    ci_propietario: str
    es_activo_propietario: bool

    class Config:
        from_attributes = True
