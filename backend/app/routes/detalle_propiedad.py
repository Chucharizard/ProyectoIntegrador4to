"""
Router para endpoints de Detalle de Propiedad (características para publicación)
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.schemas.detalle_propiedad import DetalleCreate, DetalleUpdate, DetalleResponse
from app.database import get_supabase_client
from app.utils.dependencies import get_current_active_user

router = APIRouter()


@router.post("/propiedades/{id_propiedad}/detalles", response_model=DetalleResponse, status_code=201)
async def crear_o_actualizar_detalle(
    id_propiedad: str,
    detalle: DetalleCreate,
    current_user = Depends(get_current_active_user)
):
    """
    Crea o actualiza los detalles de una propiedad para publicación.
    
    Si ya existen detalles, los actualiza. Si no, los crea.
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que la propiedad existe
        propiedad = supabase.table("propiedad").select("id_propiedad").eq("id_propiedad", id_propiedad).execute()
        if not propiedad.data:
            raise HTTPException(status_code=404, detail="Propiedad no encontrada")
        
        # Verificar si ya existen detalles
        existing = supabase.table("detallepropiedad").select("*").eq("id_propiedad", id_propiedad).execute()
        
        detalle_data = detalle.model_dump()
        detalle_data["id_propiedad"] = id_propiedad
        
        if existing.data:
            # Actualizar detalles existentes
            result = supabase.table("detallepropiedad").update(detalle_data).eq("id_propiedad", id_propiedad).execute()
        else:
            # Crear nuevos detalles
            result = supabase.table("detallepropiedad").insert(detalle_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al guardar los detalles")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.get("/propiedades/{id_propiedad}/detalles", response_model=DetalleResponse)
async def obtener_detalle(
    id_propiedad: str,
    current_user = Depends(get_current_active_user)
):
    """Obtiene los detalles de una propiedad"""
    supabase = get_supabase_client()
    
    try:
        result = supabase.table("detallepropiedad").select("*").eq("id_propiedad", id_propiedad).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Detalles no encontrados para esta propiedad")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener detalles: {str(e)}")


@router.put("/propiedades/{id_propiedad}/publicar", response_model=dict)
async def publicar_propiedad(
    id_propiedad: str,
    detalle: DetalleCreate,
    current_user = Depends(get_current_active_user)
):
    """
    Publica una propiedad:
    1. Guarda/actualiza los detalles
    2. Cambia el estado a 'Publicada'
    3. Establece fecha de publicación
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que la propiedad existe y no está cerrada
        propiedad = supabase.table("propiedad").select("*").eq("id_propiedad", id_propiedad).execute()
        if not propiedad.data:
            raise HTTPException(status_code=404, detail="Propiedad no encontrada")
        
        if propiedad.data[0].get("estado_propiedad") == "Cerrada":
            raise HTTPException(status_code=400, detail="No se puede publicar una propiedad cerrada")
        
        # 1. Guardar detalles
        detalle_data = detalle.model_dump()
        detalle_data["id_propiedad"] = id_propiedad
        
        existing = supabase.table("detallepropiedad").select("*").eq("id_propiedad", id_propiedad).execute()
        
        if existing.data:
            supabase.table("detallepropiedad").update(detalle_data).eq("id_propiedad", id_propiedad).execute()
        else:
            supabase.table("detallepropiedad").insert(detalle_data).execute()
        
        # 2. Cambiar estado a Publicada
        from datetime import date
        update_data = {
            "estado_propiedad": "Publicada",
            "fecha_publicacion_propiedad": date.today().isoformat()
        }
        
        result = supabase.table("propiedad").update(update_data).eq("id_propiedad", id_propiedad).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al publicar la propiedad")
        
        return {
            "message": "Propiedad publicada exitosamente",
            "id_propiedad": id_propiedad,
            "estado": "Publicada"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al publicar: {str(e)}")


@router.put("/propiedades/{id_propiedad}/despublicar", response_model=dict)
async def despublicar_propiedad(
    id_propiedad: str,
    current_user = Depends(get_current_active_user)
):
    """
    Retira una propiedad de publicación:
    - Cambia el estado a 'Captada' (mantiene los detalles)
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que la propiedad existe
        propiedad = supabase.table("propiedad").select("*").eq("id_propiedad", id_propiedad).execute()
        if not propiedad.data:
            raise HTTPException(status_code=404, detail="Propiedad no encontrada")
        
        # Cambiar estado a Captada
        update_data = {
            "estado_propiedad": "Captada"
        }
        
        result = supabase.table("propiedad").update(update_data).eq("id_propiedad", id_propiedad).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al despublicar la propiedad")
        
        return {
            "message": "Propiedad retirada de publicación exitosamente",
            "id_propiedad": id_propiedad,
            "estado": "Captada"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al despublicar: {str(e)}")


@router.get("/propiedades/publicadas/lista", response_model=List[dict])
async def listar_propiedades_publicadas(
    current_user = Depends(get_current_active_user)
):
    """
    Lista todas las propiedades publicadas con sus detalles.
    
    Retorna propiedad + detalles + dirección en un solo objeto.
    """
    supabase = get_supabase_client()
    
    try:
        # Obtener propiedades publicadas
        propiedades = supabase.table("propiedad").select("*").eq("estado_propiedad", "Publicada").execute()
        
        resultado = []
        for prop in propiedades.data:
            # Obtener detalles
            detalles = supabase.table("detallepropiedad").select("*").eq("id_propiedad", prop["id_propiedad"]).execute()
            
            # Obtener dirección
            direccion = supabase.table("direccion").select("*").eq("id_direccion", prop["id_direccion"]).execute()
            
            # Obtener imágenes
            imagenes = supabase.table("imagenpropiedad").select("*").eq("id_propiedad", prop["id_propiedad"]).order("orden_imagen").execute()
            
            # Combinar todo
            prop_completa = {
                **prop,
                "detalles": detalles.data[0] if detalles.data else None,
                "direccion": direccion.data[0] if direccion.data else None,
                "imagenes": imagenes.data if imagenes.data else []
            }
            
            resultado.append(prop_completa)
        
        return resultado
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al listar publicadas: {str(e)}")
