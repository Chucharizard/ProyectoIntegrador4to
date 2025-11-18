"""
Schemas para respuestas paginadas
"""
from pydantic import BaseModel
from typing import Generic, TypeVar, List
import math

T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    """
    Schema genérico para respuestas paginadas
    
    Ejemplo de uso:
        PaginatedResponse[PropiedadResponse]
        PaginatedResponse[ClienteResponse]
    """
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool

    class Config:
        from_attributes = True


def create_paginated_response(
    items: List,
    total: int,
    page: int,
    page_size: int
) -> dict:
    """
    Crear diccionario de respuesta paginada
    
    Args:
        items: Lista de items de la página actual
        total: Total de registros
        page: Número de página actual
        page_size: Tamaño de página
    
    Returns:
        Dict con estructura de PaginatedResponse
    """
    total_pages = math.ceil(total / page_size) if total > 0 else 0
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_prev": page > 1
    }
