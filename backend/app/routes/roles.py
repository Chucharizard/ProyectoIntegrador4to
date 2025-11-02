from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from app.schemas.rol import RolCreate, RolUpdate, RolResponse
from app.database import get_supabase_client
from app.utils.dependencies import get_current_active_user

router = APIRouter()


@router.post("/roles/", response_model=RolResponse, status_code=201)
async def crear_rol(
    rol: RolCreate,
    current_user = Depends(get_current_active_user)
):
    """
    Crea un nuevo rol en el sistema.
    
    - **nombre_rol**: Nombre del rol (Ej: "Broker", "Asesor", "Asistente")
    - **descripcion_rol**: Descripción del rol (opcional)
    - **es_activo_rol**: Si el rol está activo (default: true)
    
    💡 Los roles definen los permisos y responsabilidades de los usuarios
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que no exista un rol con el mismo nombre
        existing = supabase.table("rol").select("id_rol").eq("nombre_rol", rol.nombre_rol).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail=f"Ya existe un rol con el nombre '{rol.nombre_rol}'")
        
        # Preparar datos para inserción
        rol_data = rol.model_dump()
        
        # Insertar rol
        result = supabase.table("rol").insert(rol_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al crear el rol")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/roles/", response_model=List[RolResponse])
async def listar_roles(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    activos_solo: bool = Query(False, description="Mostrar solo roles activos"),
    current_user = Depends(get_current_active_user)
):
    """
    Lista todos los roles del sistema.
    
    Filtros disponibles:
    - **activos_solo**: Si es true, solo muestra roles activos
    """
    supabase = get_supabase_client()
    
    try:
        query = supabase.table("rol").select("*")
        
        if activos_solo:
            query = query.eq("es_activo_rol", True)
        
        query = query.order("id_rol", desc=False).range(skip, skip + limit - 1)
        result = query.execute()
        
        return result.data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al listar roles: {str(e)}")


@router.get("/roles/{id_rol}", response_model=RolResponse)
async def obtener_rol(
    id_rol: int,
    current_user = Depends(get_current_active_user)
):
    """
    Obtiene los detalles de un rol específico por su ID.
    """
    supabase = get_supabase_client()
    
    try:
        result = supabase.table("rol").select("*").eq("id_rol", id_rol).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Rol no encontrado")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener el rol: {str(e)}")


@router.put("/roles/{id_rol}", response_model=RolResponse)
async def actualizar_rol(
    id_rol: int,
    rol: RolUpdate,
    current_user = Depends(get_current_active_user)
):
    """
    Actualiza los datos de un rol existente.
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que el rol existe
        rol_actual = supabase.table("rol").select("*").eq("id_rol", id_rol).execute()
        if not rol_actual.data:
            raise HTTPException(status_code=404, detail="Rol no encontrado")
        
        # Preparar datos para actualización (solo campos no None)
        rol_data = rol.model_dump(exclude_unset=True)
        
        if not rol_data:
            raise HTTPException(status_code=400, detail="No se proporcionaron datos para actualizar")
        
        # Si se actualiza el nombre, verificar que no exista otro con ese nombre
        if "nombre_rol" in rol_data:
            existing = supabase.table("rol").select("id_rol").eq("nombre_rol", rol_data["nombre_rol"]).execute()
            if existing.data and existing.data[0]["id_rol"] != id_rol:
                raise HTTPException(status_code=400, detail=f"Ya existe otro rol con el nombre '{rol_data['nombre_rol']}'")
        
        # Actualizar
        result = supabase.table("rol").update(rol_data).eq("id_rol", id_rol).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al actualizar el rol")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar el rol: {str(e)}")


@router.delete("/roles/{id_rol}", status_code=204)
async def eliminar_rol(
    id_rol: int,
    current_user = Depends(get_current_active_user)
):
    """
    Elimina un rol del sistema.
    
    ⚠️ No se puede eliminar un rol si hay usuarios asignados a él.
    Se recomienda desactivar el rol en lugar de eliminarlo.
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que el rol existe
        rol = supabase.table("rol").select("id_rol").eq("id_rol", id_rol).execute()
        if not rol.data:
            raise HTTPException(status_code=404, detail="Rol no encontrado")
        
        # Verificar que no haya usuarios con este rol
        usuarios = supabase.table("usuario").select("id_usuario").eq("id_rol", id_rol).execute()
        if usuarios.data:
            raise HTTPException(
                status_code=400, 
                detail=f"No se puede eliminar el rol porque hay {len(usuarios.data)} usuario(s) asignado(s) a él. Considere desactivarlo."
            )
        
        # Eliminar
        result = supabase.table("rol").delete().eq("id_rol", id_rol).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al eliminar el rol")
        
        return None
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al eliminar el rol: {str(e)}")


@router.get("/roles/{id_rol}/usuarios")
async def obtener_usuarios_por_rol(
    id_rol: int,
    current_user = Depends(get_current_active_user)
):
    """
    Obtiene todos los usuarios asignados a un rol específico.
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que el rol existe
        rol = supabase.table("rol").select("*").eq("id_rol", id_rol).execute()
        if not rol.data:
            raise HTTPException(status_code=404, detail="Rol no encontrado")
        
        # Obtener usuarios con este rol
        usuarios = supabase.table("usuario").select("id_usuario, nombre_usuario, es_activo_usuario, ci_empleado").eq("id_rol", id_rol).execute()
        
        return {
            "rol": rol.data[0],
            "total_usuarios": len(usuarios.data),
            "usuarios": usuarios.data
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener usuarios del rol: {str(e)}")
