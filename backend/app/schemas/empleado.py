"""
Schemas Pydantic para Empleado
"""
from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel, Field, EmailStr, ConfigDict


# Schema base de Empleado
class EmpleadoBase(BaseModel):
    """Campos base de Empleado"""
    nombres_completo_empleado: str = Field(..., max_length=120, description="Nombres completos del empleado")
    apellidos_completo_empleado: str = Field(..., max_length=120, description="Apellidos completos del empleado")
    correo_electronico_empleado: EmailStr = Field(..., description="Correo electrónico del empleado")
    fecha_nacimiento_empleado: Optional[date] = Field(None, description="Fecha de nacimiento del empleado")
    telefono_empleado: Optional[str] = Field(None, max_length=20, description="Teléfono del empleado")


# Schema para crear Empleado
class EmpleadoCreate(EmpleadoBase):
    """Schema para crear un nuevo empleado"""
    ci_empleado: str = Field(..., max_length=20, description="Cédula de identidad del empleado")


# Schema para actualizar Empleado
class EmpleadoUpdate(BaseModel):
    """Schema para actualizar empleado (todos los campos opcionales)"""
    nombres_completo_empleado: Optional[str] = Field(None, max_length=120)
    apellidos_completo_empleado: Optional[str] = Field(None, max_length=120)
    correo_electronico_empleado: Optional[EmailStr] = None
    fecha_nacimiento_empleado: Optional[date] = None
    telefono_empleado: Optional[str] = Field(None, max_length=20)
    es_activo_empleado: Optional[bool] = None


# Schema de respuesta de Empleado
class EmpleadoResponse(EmpleadoBase):
    """Schema de respuesta con información del empleado"""
    ci_empleado: str
    es_activo_empleado: bool
    created_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)
