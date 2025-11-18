"""
Schemas Pydantic para Usuario
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID


# Schema base de Usuario
class UsuarioBase(BaseModel):
    """Campos base de Usuario"""
    ci_empleado: str = Field(..., max_length=20, description="CI del empleado")
    id_rol: int = Field(..., description="ID del rol")
    nombre_usuario: str = Field(..., max_length=60, description="Nombre de usuario único")


# Schema para crear Usuario
class UsuarioCreate(UsuarioBase):
    """Schema para crear un nuevo usuario"""
    contrasenia_usuario: str = Field(..., min_length=8, description="Contraseña del usuario")


# Schema para actualizar Usuario
class UsuarioUpdate(BaseModel):
    """Schema para actualizar usuario (todos los campos opcionales)"""
    ci_empleado: Optional[str] = Field(None, max_length=20)
    id_rol: Optional[int] = None
    nombre_usuario: Optional[str] = Field(None, max_length=60)
    contrasenia_usuario: Optional[str] = Field(None, min_length=8)
    es_activo_usuario: Optional[bool] = None


# Schema de respuesta de Usuario (lo que se devuelve al cliente)
class UsuarioResponse(UsuarioBase):
    """Schema de respuesta con información del usuario (sin contraseña)"""
    id_usuario: UUID
    fecha_creacion_usuario: datetime
    es_activo_usuario: bool
    
    model_config = ConfigDict(from_attributes=True, extra='ignore')


# Schema para Login
class UsuarioLogin(BaseModel):
    """Schema para autenticación"""
    nombre_usuario: str = Field(..., description="Nombre de usuario")
    contrasenia_usuario: str = Field(..., description="Contraseña")


# Schema de respuesta de Token
class Token(BaseModel):
    """Schema de respuesta tras login exitoso"""
    access_token: str
    token_type: str = "bearer"


class TokenWithUser(BaseModel):
    """Schema de respuesta tras login exitoso con datos del usuario"""
    access_token: str
    token_type: str = "bearer"
    user: dict  # Incluye los datos del usuario


class TokenData(BaseModel):
    """Datos contenidos en el token"""
    usuario_id: Optional[str] = None
    nombre_usuario: Optional[str] = None
