from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from app.schemas.propietario import PropietarioCreate, PropietarioUpdate, PropietarioResponse
from app.database import get_supabase_client
from app.utils.dependencies import get_current_active_user
from datetime import datetime

router = APIRouter()


@router.post("/propietarios/", response_model=PropietarioResponse, status_code=201)
async def crear_propietario(
    propietario: PropietarioCreate,
    current_user = Depends(get_current_active_user)
):
    """
    Crea un nuevo propietario en el sistema.
    
    - **ci_propietario**: Cédula de identidad del propietario (único)
    - **nombres_completo_propietario**: Nombres completos
    - **apellidos_completo_propietario**: Apellidos completos
    - **fecha_nacimiento_propietario**: Fecha de nacimiento (opcional)
    - **telefono_propietario**: Número de teléfono (opcional)
    - **correo_electronico_propietario**: Correo electrónico (opcional)
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar si el propietario ya existe
        existing = supabase.table("propietario").select("*").eq("ci_propietario", propietario.ci_propietario).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Ya existe un propietario con ese CI")
        
        # Preparar datos para inserción
        propietario_data = propietario.model_dump()
        
        # Convertir fecha a string si existe
        if propietario_data.get("fecha_nacimiento_propietario"):
            propietario_data["fecha_nacimiento_propietario"] = propietario_data["fecha_nacimiento_propietario"].isoformat()
        
        # Insertar propietario
        result = supabase.table("propietario").insert(propietario_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al crear el propietario")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/propietarios/", response_model=List[PropietarioResponse])
async def listar_propietarios(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros a devolver"),
    activos_solo: bool = Query(False, description="Mostrar solo propietarios activos"),
    current_user = Depends(get_current_active_user)
):
    """
    Lista todos los propietarios del sistema con paginación.
    
    - **skip**: Número de registros a omitir (para paginación)
    - **limit**: Número máximo de registros a devolver
    - **activos_solo**: Si es True, solo devuelve propietarios activos
    """
    supabase = get_supabase_client()
    
    try:
        query = supabase.table("propietario").select("*")
        
        # Filtrar solo activos si se solicita
        if activos_solo:
            query = query.eq("es_activo_propietario", True)
        
        # Aplicar paginación y ordenamiento
        result = query.order("ci_propietario").range(skip, skip + limit - 1).execute()
        
        return result.data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener propietarios: {str(e)}")


@router.get("/propietarios/{ci_propietario}", response_model=PropietarioResponse)
async def obtener_propietario(
    ci_propietario: str,
    current_user = Depends(get_current_active_user)
):
    """
    Obtiene un propietario específico por su CI.
    """
    supabase = get_supabase_client()
    
    try:
        result = supabase.table("propietario").select("*").eq("ci_propietario", ci_propietario).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Propietario no encontrado")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener el propietario: {str(e)}")


@router.put("/propietarios/{ci_propietario}", response_model=PropietarioResponse)
async def actualizar_propietario(
    ci_propietario: str,
    propietario: PropietarioUpdate,
    current_user = Depends(get_current_active_user)
):
    """
    Actualiza los datos de un propietario existente.
    
    Todos los campos son opcionales. Solo se actualizarán los campos proporcionados.
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que el propietario existe
        existing = supabase.table("propietario").select("*").eq("ci_propietario", ci_propietario).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Propietario no encontrado")
        
        # Preparar datos para actualización (solo campos no-None)
        update_data = propietario.model_dump(exclude_unset=True)
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No se proporcionaron datos para actualizar")
        
        # Convertir fecha a string si existe
        if "fecha_nacimiento_propietario" in update_data and update_data["fecha_nacimiento_propietario"]:
            update_data["fecha_nacimiento_propietario"] = update_data["fecha_nacimiento_propietario"].isoformat()
        
        # Actualizar propietario
        result = supabase.table("propietario").update(update_data).eq("ci_propietario", ci_propietario).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al actualizar el propietario")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar el propietario: {str(e)}")


@router.delete("/propietarios/{ci_propietario}", response_model=dict)
async def desactivar_propietario(
    ci_propietario: str,
    current_user = Depends(get_current_active_user)
):
    """
    Desactiva un propietario (soft delete).
    
    No se puede desactivar si tiene propiedades asociadas activas.
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que el propietario existe
        propietario_exist = supabase.table("propietario").select("*").eq("ci_propietario", ci_propietario).execute()
        if not propietario_exist.data:
            raise HTTPException(status_code=404, detail="Propietario no encontrado")
        
        # Verificar si tiene propiedades activas
        propiedades = supabase.table("propiedad").select("id_propiedad").eq("ci_propietario", ci_propietario).neq("estado_propiedad", "Cerrada").execute()
        
        if propiedades.data:
            raise HTTPException(
                status_code=400, 
                detail=f"No se puede desactivar el propietario porque tiene {len(propiedades.data)} propiedad(es) activa(s)"
            )
        
        # Desactivar propietario
        result = supabase.table("propietario").update({"es_activo_propietario": False}).eq("ci_propietario", ci_propietario).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al desactivar el propietario")
        
        return {
            "message": "Propietario desactivado exitosamente",
            "ci_propietario": ci_propietario
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al desactivar el propietario: {str(e)}")
