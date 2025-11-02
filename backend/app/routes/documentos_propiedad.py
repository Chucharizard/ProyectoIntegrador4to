from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from app.schemas.documento_propiedad import DocumentoPropiedadCreate, DocumentoPropiedadUpdate, DocumentoPropiedadResponse
from app.database import get_supabase_client
from app.utils.dependencies import get_current_active_user

router = APIRouter()


@router.post("/documentos-propiedad/", response_model=DocumentoPropiedadResponse, status_code=201)
async def crear_documento_propiedad(
    documento: DocumentoPropiedadCreate,
    current_user = Depends(get_current_active_user)
):
    """
    Registra un nuevo documento para una propiedad.
    
    - **id_propiedad**: ID de la propiedad
    - **tipo_documento**: Tipo (ej: "Título", "Plano", "Folio Real", "Contrato")
    - **ruta_archivo_documento**: URL o ruta del archivo
    - **observaciones_documento**: Notas adicionales (opcional)
    
    💡 Tipos comunes: Título de propiedad, Plano catastral, Folio real, 
       Impuestos al día, Certificado de tradición, Contrato de compraventa
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que la propiedad existe
        propiedad = supabase.table("propiedad").select("id_propiedad").eq("id_propiedad", documento.id_propiedad).execute()
        if not propiedad.data:
            raise HTTPException(status_code=404, detail="La propiedad especificada no existe")
        
        # Preparar datos para inserción
        documento_data = documento.model_dump()
        
        # Insertar documento
        result = supabase.table("documentopropiedad").insert(documento_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al registrar el documento")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/documentos-propiedad/", response_model=List[DocumentoPropiedadResponse])
async def listar_documentos(
    id_propiedad: Optional[str] = Query(None, description="Filtrar por ID de propiedad"),
    tipo_documento: Optional[str] = Query(None, description="Filtrar por tipo de documento"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user = Depends(get_current_active_user)
):
    """
    Lista todos los documentos, opcionalmente filtrados.
    
    - **id_propiedad**: Filtrar documentos de una propiedad específica
    - **tipo_documento**: Filtrar por tipo (ej: "Título", "Plano")
    """
    supabase = get_supabase_client()
    
    try:
        query = supabase.table("documentopropiedad").select("*")
        
        if id_propiedad:
            query = query.eq("id_propiedad", id_propiedad)
        
        if tipo_documento:
            query = query.eq("tipo_documento", tipo_documento)
        
        # Ordenar por fecha de subida (más recientes primero)
        result = query.order("fecha_subida_documento", desc=True).range(skip, skip + limit - 1).execute()
        
        return result.data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener documentos: {str(e)}")


@router.get("/documentos-propiedad/{id_documento}", response_model=DocumentoPropiedadResponse)
async def obtener_documento(
    id_documento: str,
    current_user = Depends(get_current_active_user)
):
    """
    Obtiene un documento específico por su ID.
    """
    supabase = get_supabase_client()
    
    try:
        result = supabase.table("documentopropiedad").select("*").eq("id_documento", id_documento).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Documento no encontrado")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener el documento: {str(e)}")


@router.put("/documentos-propiedad/{id_documento}", response_model=DocumentoPropiedadResponse)
async def actualizar_documento(
    id_documento: str,
    documento: DocumentoPropiedadUpdate,
    current_user = Depends(get_current_active_user)
):
    """
    Actualiza los datos de un documento.
    
    Casos de uso:
    - Actualizar tipo de documento
    - Cambiar ruta del archivo (si se reemplaza)
    - Agregar/modificar observaciones
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que el documento existe
        existing = supabase.table("documentopropiedad").select("*").eq("id_documento", id_documento).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Documento no encontrado")
        
        # Preparar datos para actualización
        update_data = documento.model_dump(exclude_unset=True)
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No se proporcionaron datos para actualizar")
        
        # Actualizar documento
        result = supabase.table("documentopropiedad").update(update_data).eq("id_documento", id_documento).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al actualizar el documento")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar el documento: {str(e)}")


@router.delete("/documentos-propiedad/{id_documento}", response_model=dict)
async def eliminar_documento(
    id_documento: str,
    current_user = Depends(get_current_active_user)
):
    """
    Elimina un documento de la base de datos.
    
    ⚠️ Nota: Esto NO elimina el archivo físico del storage.
    Deberás eliminarlo manualmente del servicio de almacenamiento.
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que el documento existe
        documento = supabase.table("documentopropiedad").select("*").eq("id_documento", id_documento).execute()
        if not documento.data:
            raise HTTPException(status_code=404, detail="Documento no encontrado")
        
        # Eliminar documento
        result = supabase.table("documentopropiedad").delete().eq("id_documento", id_documento).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al eliminar el documento")
        
        return {
            "message": "Documento eliminado exitosamente de la base de datos",
            "id_documento": id_documento,
            "ruta_archivo": documento.data[0]["ruta_archivo_documento"],
            "nota": "Recuerda eliminar el archivo físico del storage si es necesario"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al eliminar el documento: {str(e)}")
