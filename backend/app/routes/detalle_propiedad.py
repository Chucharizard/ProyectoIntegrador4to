"""
Router para endpoints de Detalle de Propiedad (características para publicación)
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
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
    buscar: Optional[str] = Query(None, description="Buscar en título o descripción"),
    tipo_operacion: Optional[str] = Query(None, description="Tipo de operación: Venta o Alquiler"),
    zona: Optional[str] = Query(None, description="Zona de la propiedad"),
    ciudad: Optional[str] = Query(None, description="Ciudad de la propiedad"),
    precio_min: Optional[float] = Query(None, ge=0, description="Precio mínimo"),
    precio_max: Optional[float] = Query(None, ge=0, description="Precio máximo"),
    superficie_min: Optional[float] = Query(None, ge=0, description="Superficie mínima en m²"),
    superficie_max: Optional[float] = Query(None, ge=0, description="Superficie máxima en m²"),
):
    """
    Lista todas las propiedades publicadas con sus detalles y filtros opcionales.
    
    Endpoint PÚBLICO - No requiere autenticación (para sitio web de clientes).
    Retorna propiedad + detalles + dirección en un solo objeto.
    
    Filtros disponibles:
    - buscar: Busca en título y descripción
    - tipo_operacion: "Venta" o "Alquiler"
    - zona: Zona específica
    - ciudad: Ciudad específica
    - precio_min/precio_max: Rango de precios
    - superficie_min/superficie_max: Rango de superficie
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
            
            # Aplicar filtros
            direccion_data = prop_completa.get("direccion", {}) or {}
            
            # Filtro de búsqueda en título y descripción
            if buscar:
                titulo = (prop_completa.get("titulo_propiedad") or "").lower()
                descripcion = (prop_completa.get("descripcion_propiedad") or "").lower()
                buscar_lower = buscar.lower()
                if buscar_lower not in titulo and buscar_lower not in descripcion:
                    continue
            
            # Filtro de tipo de operación
            if tipo_operacion:
                if (prop_completa.get("tipo_operacion_propiedad") or "").lower() != tipo_operacion.lower():
                    continue
            
            # Filtro de zona
            if zona:
                zona_prop = direccion_data.get("zona_direccion") or ""
                if zona.lower() not in zona_prop.lower():
                    continue
            
            # Filtro de ciudad
            if ciudad:
                ciudad_prop = direccion_data.get("ciudad_direccion") or ""
                if ciudad.lower() != ciudad_prop.lower():
                    continue
            
            # Filtro de precio
            precio = prop_completa.get("precio_publicado_propiedad")
            if precio is not None:
                if precio_min is not None and precio < precio_min:
                    continue
                if precio_max is not None and precio > precio_max:
                    continue
            
            # Filtro de superficie
            superficie = prop_completa.get("superficie_propiedad")
            if superficie is not None:
                if superficie_min is not None and superficie < superficie_min:
                    continue
                if superficie_max is not None and superficie > superficie_max:
                    continue
            
            resultado.append(prop_completa)
        
        return resultado
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al listar publicadas: {str(e)}")


@router.get("/propiedades/publicadas/{id_propiedad}", response_model=dict)
async def obtener_propiedad_publicada(id_propiedad: str):
    """
    Obtiene una propiedad publicada específica por su ID.
    
    Endpoint PÚBLICO - No requiere autenticación (para sitio web de clientes).
    Retorna propiedad + detalles + dirección + imágenes.
    """
    supabase = get_supabase_client()
    
    try:
        # Obtener propiedad publicada
        propiedad = supabase.table("propiedad")\
            .select("*")\
            .eq("id_propiedad", id_propiedad)\
            .eq("estado_propiedad", "Publicada")\
            .execute()
        
        if not propiedad.data:
            raise HTTPException(status_code=404, detail="Propiedad no encontrada o no está publicada")
        
        prop = propiedad.data[0]
        
        # Obtener detalles
        detalles = supabase.table("detallepropiedad")\
            .select("*")\
            .eq("id_propiedad", prop["id_propiedad"])\
            .execute()
        
        # Obtener dirección
        direccion = supabase.table("direccion")\
            .select("*")\
            .eq("id_direccion", prop["id_direccion"])\
            .execute()
        
        # Obtener imágenes
        imagenes = supabase.table("imagenpropiedad")\
            .select("*")\
            .eq("id_propiedad", prop["id_propiedad"])\
            .order("orden_imagen")\
            .execute()
        
        # Combinar todo
        prop_completa = {
            **prop,
            "detalles": detalles.data[0] if detalles.data else None,
            "direccion": direccion.data[0] if direccion.data else None,
            "imagenes": imagenes.data if imagenes.data else []
        }
        
        return prop_completa
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener propiedad: {str(e)}")
