from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from app.schemas.direccion import DireccionCreate, DireccionUpdate, DireccionResponse
from app.database import get_supabase_client
from app.utils.dependencies import get_current_active_user

router = APIRouter()


@router.post("/direcciones/", response_model=DireccionResponse, status_code=201)
async def crear_direccion(
    direccion: DireccionCreate,
    current_user = Depends(get_current_active_user)
):
    """
    Crea una nueva dirección en el sistema.
    
    - **calle_direccion**: Calle, avenida y número
    - **ciudad_direccion**: Ciudad
    - **zona_direccion**: Zona o barrio (opcional)
    - **latitud_direccion**: Latitud GPS (opcional)
    - **longitud_direccion**: Longitud GPS (opcional)
    """
    supabase = get_supabase_client()
    
    try:
        # Preparar datos para inserción
        direccion_data = direccion.model_dump()
        
        # Convertir Decimal a float para Supabase
        if direccion_data.get("latitud_direccion") is not None:
            direccion_data["latitud_direccion"] = float(direccion_data["latitud_direccion"])
        if direccion_data.get("longitud_direccion") is not None:
            direccion_data["longitud_direccion"] = float(direccion_data["longitud_direccion"])
        
        # Insertar dirección
        result = supabase.table("direccion").insert(direccion_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al crear la dirección")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/direcciones/", response_model=List[DireccionResponse])
async def listar_direcciones(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros a devolver"),
    ciudad: Optional[str] = Query(None, description="Filtrar por ciudad"),
    zona: Optional[str] = Query(None, description="Filtrar por zona"),
    current_user = Depends(get_current_active_user)
):
    """
    Lista todas las direcciones del sistema con paginación y filtros.
    
    - **skip**: Número de registros a omitir (para paginación)
    - **limit**: Número máximo de registros a devolver
    - **ciudad**: Filtrar por ciudad (opcional)
    - **zona**: Filtrar por zona (búsqueda parcial, opcional)
    """
    supabase = get_supabase_client()
    
    try:
        query = supabase.table("direccion").select("*")
        
        # Filtrar por ciudad si se proporciona
        if ciudad:
            query = query.eq("ciudad_direccion", ciudad)
        
        # Filtrar por zona si se proporciona (búsqueda parcial)
        if zona:
            query = query.ilike("zona_direccion", f"%{zona}%")
        
        # Aplicar paginación y ordenamiento
        result = query.order("ciudad_direccion").order("zona_direccion").range(skip, skip + limit - 1).execute()
        
        return result.data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener direcciones: {str(e)}")


@router.get("/direcciones/{id_direccion}", response_model=DireccionResponse)
async def obtener_direccion(
    id_direccion: str,
    current_user = Depends(get_current_active_user)
):
    """
    Obtiene una dirección específica por su ID.
    """
    supabase = get_supabase_client()
    
    try:
        result = supabase.table("direccion").select("*").eq("id_direccion", id_direccion).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Dirección no encontrada")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener la dirección: {str(e)}")


@router.put("/direcciones/{id_direccion}", response_model=DireccionResponse)
async def actualizar_direccion(
    id_direccion: str,
    direccion: DireccionUpdate,
    current_user = Depends(get_current_active_user)
):
    """
    Actualiza los datos de una dirección existente.
    
    Todos los campos son opcionales. Solo se actualizarán los campos proporcionados.
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que la dirección existe
        existing = supabase.table("direccion").select("*").eq("id_direccion", id_direccion).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Dirección no encontrada")
        
        # Preparar datos para actualización (solo campos no-None)
        update_data = direccion.model_dump(exclude_unset=True)
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No se proporcionaron datos para actualizar")
        
        # Convertir Decimal a float si existen
        if "latitud_direccion" in update_data and update_data["latitud_direccion"] is not None:
            update_data["latitud_direccion"] = float(update_data["latitud_direccion"])
        if "longitud_direccion" in update_data and update_data["longitud_direccion"] is not None:
            update_data["longitud_direccion"] = float(update_data["longitud_direccion"])
        
        # Actualizar dirección
        result = supabase.table("direccion").update(update_data).eq("id_direccion", id_direccion).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al actualizar la dirección")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar la dirección: {str(e)}")


@router.delete("/direcciones/{id_direccion}", response_model=dict)
async def eliminar_direccion(
    id_direccion: str,
    current_user = Depends(get_current_active_user)
):
    """
    Elimina una dirección del sistema.
    
    ⚠️ No se puede eliminar si tiene propiedades asociadas.
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que la dirección existe
        direccion_exist = supabase.table("direccion").select("*").eq("id_direccion", id_direccion).execute()
        if not direccion_exist.data:
            raise HTTPException(status_code=404, detail="Dirección no encontrada")
        
        # Verificar si tiene propiedades asociadas
        propiedades = supabase.table("propiedad").select("id_propiedad").eq("id_direccion", id_direccion).execute()
        
        if propiedades.data:
            raise HTTPException(
                status_code=400, 
                detail=f"No se puede eliminar la dirección porque tiene {len(propiedades.data)} propiedad(es) asociada(s)"
            )
        
        # Eliminar dirección
        result = supabase.table("direccion").delete().eq("id_direccion", id_direccion).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al eliminar la dirección")
        
        return {
            "message": "Dirección eliminada exitosamente",
            "id_direccion": id_direccion
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al eliminar la dirección: {str(e)}")
