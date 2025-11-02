from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from app.schemas.imagen_propiedad import ImagenPropiedadCreate, ImagenPropiedadUpdate, ImagenPropiedadResponse
from app.database import get_supabase_client
from app.utils.dependencies import get_current_active_user

router = APIRouter()


@router.post("/imagenes-propiedad/", response_model=ImagenPropiedadResponse, status_code=201)
async def crear_imagen_propiedad(
    imagen: ImagenPropiedadCreate,
    current_user = Depends(get_current_active_user)
):
    """
    Registra una nueva imagen para una propiedad.
    
    - **id_propiedad**: ID de la propiedad
    - **url_imagen**: URL de la imagen (puede ser URL de Supabase Storage, Cloudinary, etc.)
    - **descripcion_imagen**: Descripción de la imagen (opcional)
    - **es_portada_imagen**: Si es la imagen principal (default: false)
    - **orden_imagen**: Orden de visualización (default: 0)
    
    💡 Tip: Si marcas una imagen como portada, considera desmarcar las demás.
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que la propiedad existe
        propiedad = supabase.table("propiedad").select("id_propiedad").eq("id_propiedad", imagen.id_propiedad).execute()
        if not propiedad.data:
            raise HTTPException(status_code=404, detail="La propiedad especificada no existe")
        
        # Si se marca como portada, desmarcar las demás
        if imagen.es_portada_imagen:
            supabase.table("imagenpropiedad").update({"es_portada_imagen": False}).eq("id_propiedad", imagen.id_propiedad).execute()
        
        # Preparar datos para inserción
        imagen_data = imagen.model_dump()
        
        # Insertar imagen
        result = supabase.table("imagenpropiedad").insert(imagen_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al registrar la imagen")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/imagenes-propiedad/", response_model=List[ImagenPropiedadResponse])
async def listar_imagenes(
    id_propiedad: Optional[str] = Query(None, description="Filtrar por ID de propiedad"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user = Depends(get_current_active_user)
):
    """
    Lista todas las imágenes, opcionalmente filtradas por propiedad.
    
    - **id_propiedad**: Filtrar imágenes de una propiedad específica
    """
    supabase = get_supabase_client()
    
    try:
        query = supabase.table("imagenpropiedad").select("*")
        
        if id_propiedad:
            query = query.eq("id_propiedad", id_propiedad)
        
        # Ordenar por portada primero, luego por orden
        result = query.order("es_portada_imagen", desc=True).order("orden_imagen").range(skip, skip + limit - 1).execute()
        
        return result.data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener imágenes: {str(e)}")


@router.get("/imagenes-propiedad/{id_imagen}", response_model=ImagenPropiedadResponse)
async def obtener_imagen(
    id_imagen: str,
    current_user = Depends(get_current_active_user)
):
    """
    Obtiene una imagen específica por su ID.
    """
    supabase = get_supabase_client()
    
    try:
        result = supabase.table("imagenpropiedad").select("*").eq("id_imagen", id_imagen).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Imagen no encontrada")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener la imagen: {str(e)}")


@router.put("/imagenes-propiedad/{id_imagen}", response_model=ImagenPropiedadResponse)
async def actualizar_imagen(
    id_imagen: str,
    imagen: ImagenPropiedadUpdate,
    current_user = Depends(get_current_active_user)
):
    """
    Actualiza los datos de una imagen.
    
    Casos de uso:
    - Cambiar descripción
    - Cambiar orden de visualización
    - Marcar/desmarcar como portada
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que la imagen existe
        existing = supabase.table("imagenpropiedad").select("*").eq("id_imagen", id_imagen).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Imagen no encontrada")
        
        # Preparar datos para actualización
        update_data = imagen.model_dump(exclude_unset=True)
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No se proporcionaron datos para actualizar")
        
        # Si se marca como portada, desmarcar las demás de la misma propiedad
        if update_data.get("es_portada_imagen") == True:
            id_propiedad = existing.data[0]["id_propiedad"]
            supabase.table("imagenpropiedad").update({"es_portada_imagen": False}).eq("id_propiedad", id_propiedad).execute()
        
        # Actualizar imagen
        result = supabase.table("imagenpropiedad").update(update_data).eq("id_imagen", id_imagen).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al actualizar la imagen")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar la imagen: {str(e)}")


@router.delete("/imagenes-propiedad/{id_imagen}", response_model=dict)
async def eliminar_imagen(
    id_imagen: str,
    current_user = Depends(get_current_active_user)
):
    """
    Elimina una imagen de la base de datos.
    
    ⚠️ Nota: Esto NO elimina el archivo físico del storage.
    Deberás eliminarlo manualmente del servicio de almacenamiento.
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que la imagen existe
        imagen = supabase.table("imagenpropiedad").select("*").eq("id_imagen", id_imagen).execute()
        if not imagen.data:
            raise HTTPException(status_code=404, detail="Imagen no encontrada")
        
        # Eliminar imagen
        result = supabase.table("imagenpropiedad").delete().eq("id_imagen", id_imagen).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al eliminar la imagen")
        
        return {
            "message": "Imagen eliminada exitosamente de la base de datos",
            "id_imagen": id_imagen,
            "url_imagen": imagen.data[0]["url_imagen"],
            "nota": "Recuerda eliminar el archivo físico del storage si es necesario"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al eliminar la imagen: {str(e)}")
