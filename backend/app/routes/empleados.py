"""
Router para endpoints de Empleados
"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import List

from app.database import get_supabase_client
from app.schemas.empleado import (
    EmpleadoCreate,
    EmpleadoUpdate,
    EmpleadoResponse
)
from app.utils.dependencies import get_current_active_user

router = APIRouter()


@router.post("/empleados/", response_model=EmpleadoResponse, status_code=status.HTTP_201_CREATED)
async def crear_empleado(
    empleado: EmpleadoCreate,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Crear un nuevo empleado
    Requiere autenticación
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar si el empleado ya existe
        existing = supabase.table("empleado").select("*").eq("ci_empleado", empleado.ci_empleado).execute()
        
        if existing.data and len(existing.data) > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El empleado con este CI ya existe"
            )
        
        # Crear empleado
        nuevo_empleado = {
            "ci_empleado": empleado.ci_empleado,
            "nombres_completo_empleado": empleado.nombres_completo_empleado,
            "apellidos_completo_empleado": empleado.apellidos_completo_empleado,
            "correo_electronico_empleado": empleado.correo_electronico_empleado,
            "fecha_nacimiento_empleado": empleado.fecha_nacimiento_empleado.isoformat() if empleado.fecha_nacimiento_empleado else None,
            "telefono_empleado": empleado.telefono_empleado,
            "es_activo_empleado": True
        }
        
        response = supabase.table("empleado").insert(nuevo_empleado).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al crear el empleado"
            )
        
        return response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear empleado: {str(e)}"
        )


@router.get("/empleados/", response_model=List[EmpleadoResponse])
async def listar_empleados(
    skip: int = 0,
    limit: int = 100,
    activos_solo: bool = False,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Listar todos los empleados
    Requiere autenticación
    
    - skip: número de registros a omitir
    - limit: número máximo de registros a retornar
    - activos_solo: si es True, solo retorna empleados activos
    """
    supabase = get_supabase_client()
    
    try:
        query = supabase.table("empleado").select("*")
        
        if activos_solo:
            query = query.eq("es_activo_empleado", True)
        
        response = query.range(skip, skip + limit - 1).execute()
        return response.data
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al listar empleados: {str(e)}"
        )


@router.get("/empleados/{ci_empleado}", response_model=EmpleadoResponse)
async def obtener_empleado(
    ci_empleado: str,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Obtener un empleado por CI
    Requiere autenticación
    """
    supabase = get_supabase_client()
    
    try:
        response = supabase.table("empleado").select("*").eq("ci_empleado", ci_empleado).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Empleado no encontrado"
            )
        
        return response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener empleado: {str(e)}"
        )


@router.put("/empleados/{ci_empleado}", response_model=EmpleadoResponse)
async def actualizar_empleado(
    ci_empleado: str,
    empleado_update: EmpleadoUpdate,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Actualizar un empleado existente
    Requiere autenticación
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar si el empleado existe
        existing = supabase.table("empleado").select("*").eq("ci_empleado", ci_empleado).execute()
        
        if not existing.data or len(existing.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Empleado no encontrado"
            )
        
        # Preparar datos para actualizar (solo los campos que no son None)
        update_data = {}
        
        if empleado_update.nombres_completo_empleado is not None:
            update_data["nombres_completo_empleado"] = empleado_update.nombres_completo_empleado
        
        if empleado_update.apellidos_completo_empleado is not None:
            update_data["apellidos_completo_empleado"] = empleado_update.apellidos_completo_empleado
        
        if empleado_update.correo_electronico_empleado is not None:
            update_data["correo_electronico_empleado"] = empleado_update.correo_electronico_empleado
        
        if empleado_update.fecha_nacimiento_empleado is not None:
            update_data["fecha_nacimiento_empleado"] = empleado_update.fecha_nacimiento_empleado.isoformat()
        
        if empleado_update.telefono_empleado is not None:
            update_data["telefono_empleado"] = empleado_update.telefono_empleado
        
        if empleado_update.es_activo_empleado is not None:
            update_data["es_activo_empleado"] = empleado_update.es_activo_empleado
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No hay datos para actualizar"
            )
        
        # Actualizar empleado
        response = supabase.table("empleado").update(update_data).eq("ci_empleado", ci_empleado).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al actualizar empleado"
            )
        
        return response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar empleado: {str(e)}"
        )


@router.delete("/empleados/{ci_empleado}", status_code=status.HTTP_200_OK)
async def desactivar_empleado(
    ci_empleado: str,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Desactivar un empleado (soft delete)
    Requiere autenticación
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar si el empleado existe
        existing = supabase.table("empleado").select("*").eq("ci_empleado", ci_empleado).execute()
        
        if not existing.data or len(existing.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Empleado no encontrado"
            )
        
        # Verificar si el empleado tiene usuarios asociados activos
        usuarios = supabase.table("usuario").select("*").eq("ci_empleado", ci_empleado).eq("es_activo_usuario", True).execute()
        
        if usuarios.data and len(usuarios.data) > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede desactivar el empleado porque tiene usuarios activos asociados"
            )
        
        # Desactivar empleado
        response = supabase.table("empleado").update({"es_activo_empleado": False}).eq("ci_empleado", ci_empleado).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al desactivar empleado"
            )
        
        return {"message": "Empleado desactivado exitosamente", "ci_empleado": ci_empleado}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al desactivar empleado: {str(e)}"
        )
