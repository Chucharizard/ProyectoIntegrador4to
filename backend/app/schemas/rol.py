from pydantic import BaseModel, Field
from typing import Optional


class RolBase(BaseModel):
    nombre_rol: str = Field(..., min_length=1, max_length=50)
    descripcion_rol: Optional[str] = Field(None, max_length=200)
    es_activo_rol: bool = True


class RolCreate(RolBase):
    pass


class RolUpdate(BaseModel):
    nombre_rol: Optional[str] = Field(None, min_length=1, max_length=50)
    descripcion_rol: Optional[str] = Field(None, max_length=200)
    es_activo_rol: Optional[bool] = None


class RolResponse(RolBase):
    id_rol: int
    
    class Config:
        from_attributes = True
