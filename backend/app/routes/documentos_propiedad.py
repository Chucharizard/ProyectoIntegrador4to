from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File, Form
from typing import List, Optional
import uuid
from datetime import datetime
from app.schemas.documento_propiedad import DocumentoPropiedadCreate, DocumentoPropiedadUpdate, DocumentoPropiedadResponse
from app.database import get_supabase_client
from app.utils.dependencies import get_current_active_user

router = APIRouter()


@router.post("/documentos-propiedad/upload", response_model=DocumentoPropiedadResponse, status_code=201)
async def subir_documento_propiedad(
    id_propiedad: str = Form(...),
    tipo_documento: str = Form(...),
    observaciones_documento: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user = Depends(get_current_active_user)
):
    """
    Sube un documento a Supabase Storage y registra en la base de datos.
    
    - **id_propiedad**: ID de la propiedad
    - **tipo_documento**: Tipo del documento
    - **observaciones_documento**: Notas adicionales
    - **file**: Archivo a subir (PDF, Word, etc.)
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que la propiedad existe
        propiedad = supabase.table("propiedad").select("id_propiedad").eq("id_propiedad", id_propiedad).execute()
        if not propiedad.data:
            raise HTTPException(status_code=404, detail="La propiedad especificada no existe")
        
        # Validar tipo de archivo
        allowed_extensions = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png']
        file_extension = file.filename.split('.')[-1].lower()
        if f'.{file_extension}' not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"Tipo de archivo no permitido. Use: {', '.join(allowed_extensions)}"
            )
        
        # Leer contenido del archivo
        file_content = await file.read()
        
        # Generar nombre único para el archivo
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_filename = f"{id_propiedad}/{timestamp}_{uuid.uuid4().hex[:8]}_{file.filename}"
        
        # Subir a Supabase Storage (bucket: documentos-propiedades)
        try:
            upload_response = supabase.storage.from_("documentos-propiedades").upload(
                path=unique_filename,
                file=file_content,
                file_options={"content-type": file.content_type}
            )
        except Exception as storage_error:
            raise HTTPException(
                status_code=500, 
                detail=f"Error al subir archivo a storage: {str(storage_error)}"
            )
        
        # Obtener URL pública del archivo
        file_url = supabase.storage.from_("documentos-propiedades").get_public_url(unique_filename)
        
        # Registrar en base de datos
        documento_data = {
            "id_propiedad": id_propiedad,
            "tipo_documento": tipo_documento,
            "ruta_archivo_documento": file_url,
            "nombre_archivo_original": file.filename,
            "observaciones_documento": observaciones_documento
        }
        
        result = supabase.table("documentopropiedad").insert(documento_data).execute()
        
        if not result.data:
            # Intentar eliminar el archivo del storage si falla el registro
            try:
                supabase.storage.from_("documentos-propiedades").remove([unique_filename])
            except:
                pass
            raise HTTPException(status_code=500, detail="Error al registrar el documento en la base de datos")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


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
    Elimina un documento de la base de datos y de Supabase Storage.
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que el documento existe
        documento = supabase.table("documentopropiedad").select("*").eq("id_documento", id_documento).execute()
        if not documento.data:
            raise HTTPException(status_code=404, detail="Documento no encontrado")
        
        documento_data = documento.data[0]
        ruta_archivo = documento_data.get("ruta_archivo_documento", "")
        
        # Extraer path del archivo desde la URL
        if "documentos-propiedades" in ruta_archivo:
            # Extraer solo el path después del bucket
            file_path = ruta_archivo.split("documentos-propiedades/")[-1].split("?")[0]
            
            # Intentar eliminar del storage
            try:
                supabase.storage.from_("documentos-propiedades").remove([file_path])
            except Exception as storage_error:
                print(f"Advertencia: No se pudo eliminar del storage: {storage_error}")
        
        # Eliminar de la base de datos
        result = supabase.table("documentopropiedad").delete().eq("id_documento", id_documento).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al eliminar el documento de la base de datos")
        
        return {
            "message": "Documento eliminado exitosamente",
            "id_documento": id_documento
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al eliminar el documento: {str(e)}")
