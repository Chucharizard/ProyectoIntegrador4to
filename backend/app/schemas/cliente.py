from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from decimal import Decimal


class ClienteBase(BaseModel):
    """Schema base para Cliente"""
    nombres_completo_cliente: str
    apellidos_completo_cliente: str
    telefono_cliente: Optional[str] = None
    correo_electronico_cliente: Optional[EmailStr] = None
    preferencia_zona_cliente: Optional[str] = None
    presupuesto_max_cliente: Optional[Decimal] = None
    origen_cliente: Optional[str] = None


class ClienteCreate(ClienteBase):
    """Schema para crear un cliente"""
    ci_cliente: str
    # id_usuario_registrador se tomará del usuario autenticado


class ClienteUpdate(BaseModel):
    """Schema para actualizar un cliente (todos los campos opcionales)"""
    nombres_completo_cliente: Optional[str] = None
    apellidos_completo_cliente: Optional[str] = None
    telefono_cliente: Optional[str] = None
    correo_electronico_cliente: Optional[EmailStr] = None
    preferencia_zona_cliente: Optional[str] = None
    presupuesto_max_cliente: Optional[Decimal] = None
    origen_cliente: Optional[str] = None


class ClienteResponse(ClienteBase):
    """Schema para respuesta de cliente"""
    ci_cliente: str
    fecha_registro_cliente: Optional[datetime] = None
    id_usuario_registrador: Optional[str] = None

    class Config:
        from_attributes = True
