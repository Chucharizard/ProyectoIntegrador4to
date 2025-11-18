from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from app.schemas.propiedad import PropiedadCreate, PropiedadUpdate, PropiedadResponse
from app.database import get_supabase_client
from app.utils.dependencies import (
    get_current_active_user,
    get_propiedades_cached,
    set_propiedades_cached,
    clear_propiedades_cache
)

router = APIRouter()

@router.post("/propiedades/", response_model=PropiedadResponse, status_code=201)
async def crear_propiedad(
    propiedad: PropiedadCreate,
    current_user = Depends(get_current_active_user)
):
    """Crea una nueva propiedad en el sistema."""
    supabase = get_supabase_client()
    
    try:
        direccion_id = None
        
        # OPCIÓN B: Si viene dirección anidada, créala primero
        if propiedad.direccion:
            direccion_data = propiedad.direccion.model_dump()
            
            # Convertir Decimal a float
            if direccion_data.get("latitud_direccion") is not None:
                direccion_data["latitud_direccion"] = float(direccion_data["latitud_direccion"])
            if direccion_data.get("longitud_direccion") is not None:
                direccion_data["longitud_direccion"] = float(direccion_data["longitud_direccion"])
            
            result_dir = supabase.table("direccion").insert(direccion_data).execute()
            if not result_dir.data:
                raise HTTPException(status_code=500, detail="Error al crear la dirección")
            
            direccion_id = result_dir.data[0]["id_direccion"]
        
        # OPCIÓN A: Si viene id_direccion, verificar que existe
        elif propiedad.id_direccion:
            existing_dir = supabase.table("direccion").select("id_direccion").eq("id_direccion", propiedad.id_direccion).execute()
            if not existing_dir.data:
                raise HTTPException(status_code=404, detail="La dirección especificada no existe")
            direccion_id = propiedad.id_direccion
        
        # Verificar que el propietario existe
        propietario = supabase.table("propietario").select("ci_propietario").eq("ci_propietario", propiedad.ci_propietario).execute()
        if not propietario.data:
            raise HTTPException(status_code=404, detail="El propietario especificado no existe")
        
        # Verificar código público único si se proporciona
        if propiedad.codigo_publico_propiedad:
            existing_code = supabase.table("propiedad").select("codigo_publico_propiedad").eq("codigo_publico_propiedad", propiedad.codigo_publico_propiedad).execute()
            if existing_code.data:
                raise HTTPException(status_code=400, detail="Ya existe una propiedad con ese código público")
        
        # Preparar datos de la propiedad
        propiedad_data = propiedad.model_dump(exclude={"direccion"})
        propiedad_data["id_direccion"] = direccion_id
        propiedad_data["id_usuario_captador"] = current_user["id_usuario"]
        
        # Convertir Decimales a float
        if propiedad_data.get("precio_publicado_propiedad") is not None:
            propiedad_data["precio_publicado_propiedad"] = float(propiedad_data["precio_publicado_propiedad"])
        if propiedad_data.get("superficie_propiedad") is not None:
            propiedad_data["superficie_propiedad"] = float(propiedad_data["superficie_propiedad"])
        if propiedad_data.get("porcentaje_captacion_propiedad") is not None:
            propiedad_data["porcentaje_captacion_propiedad"] = float(propiedad_data["porcentaje_captacion_propiedad"])
        if propiedad_data.get("porcentaje_colocacion_propiedad") is not None:
            propiedad_data["porcentaje_colocacion_propiedad"] = float(propiedad_data["porcentaje_colocacion_propiedad"])
        
        # Convertir fechas a string
        if propiedad_data.get("fecha_captacion_propiedad"):
            propiedad_data["fecha_captacion_propiedad"] = propiedad_data["fecha_captacion_propiedad"].isoformat()
        if propiedad_data.get("fecha_publicacion_propiedad"):
            propiedad_data["fecha_publicacion_propiedad"] = propiedad_data["fecha_publicacion_propiedad"].isoformat()
        if propiedad_data.get("fecha_cierre_propiedad"):
            propiedad_data["fecha_cierre_propiedad"] = propiedad_data["fecha_cierre_propiedad"].isoformat()
        
        # Crear propiedad
        result = supabase.table("propiedad").insert(propiedad_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al crear la propiedad")
        
        # ✅ Invalidar caché
        clear_propiedades_cache()
        
        propiedad_creada = result.data[0]
        direccion = supabase.table("direccion").select("*").eq("id_direccion", direccion_id).execute()
        if direccion.data:
            propiedad_creada["direccion"] = direccion.data[0]
        
        return propiedad_creada
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.get("/propiedades/", response_model=List[PropiedadResponse])
async def listar_propiedades(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    tipo_operacion: Optional[str] = Query(None),
    estado: Optional[str] = Query(None),
    precio_min: Optional[float] = Query(None),
    precio_max: Optional[float] = Query(None),
    mis_captaciones: bool = Query(False),
    current_user = Depends(get_current_active_user)
):
    """Lista todas las propiedades CON CACHÉ"""
    
    # ✅ Intentar caché solo para consulta básica sin filtros
    if (skip == 0 and limit == 100 and not tipo_operacion and not estado and 
        not precio_min and not precio_max and not mis_captaciones):
        cached = get_propiedades_cached()
        if cached:
            return cached
    
    supabase = get_supabase_client()
    
    try:
        query = supabase.table("propiedad").select("*")
        
        # Filtros
        if tipo_operacion:
            query = query.eq("tipo_operacion_propiedad", tipo_operacion)
        
        if estado:
            query = query.eq("estado_propiedad", estado)
        
        if precio_min is not None:
            query = query.gte("precio_publicado_propiedad", precio_min)
        
        if precio_max is not None:
            query = query.lte("precio_publicado_propiedad", precio_max)
        
        if mis_captaciones:
            query = query.eq("id_usuario_captador", current_user["id_usuario"])
        
        # Paginación y orden
        result = query.order("fecha_captacion_propiedad", desc=True).range(skip, skip + limit - 1).execute()
        
        # Enriquecer con datos de dirección
        propiedades = result.data
        for propiedad in propiedades:
            direccion = supabase.table("direccion").select("*").eq("id_direccion", propiedad["id_direccion"]).execute()
            if direccion.data:
                propiedad["direccion"] = direccion.data[0]
        
        # ✅ Guardar en caché solo consulta básica
        if (skip == 0 and limit == 100 and not tipo_operacion and not estado and 
            not precio_min and not precio_max and not mis_captaciones):
            set_propiedades_cached(propiedades)
        
        return propiedades
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener propiedades: {str(e)}")

@router.get("/propiedades/{id_propiedad}", response_model=PropiedadResponse)
async def obtener_propiedad(
    id_propiedad: str,
    current_user = Depends(get_current_active_user)
):
    """Obtiene una propiedad específica por su ID"""
    supabase = get_supabase_client()
    
    try:
        result = supabase.table("propiedad").select("*").eq("id_propiedad", id_propiedad).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Propiedad no encontrada")
        
        propiedad = result.data[0]
        
        # Incluir dirección
        direccion = supabase.table("direccion").select("*").eq("id_direccion", propiedad["id_direccion"]).execute()
        if direccion.data:
            propiedad["direccion"] = direccion.data[0]
        
        return propiedad
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener la propiedad: {str(e)}")

@router.put("/propiedades/{id_propiedad}", response_model=PropiedadResponse)
async def actualizar_propiedad(
    id_propiedad: str,
    propiedad: PropiedadUpdate,
    current_user = Depends(get_current_active_user)
):
    """Actualiza los datos de una propiedad existente"""
    supabase = get_supabase_client()
    
    try:
        existing = supabase.table("propiedad").select("*").eq("id_propiedad", id_propiedad).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Propiedad no encontrada")
        
        update_data = propiedad.model_dump(exclude_unset=True)
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No se proporcionaron datos para actualizar")
        
        # Convertir Decimales a float
        if "precio_publicado_propiedad" in update_data and update_data["precio_publicado_propiedad"] is not None:
            update_data["precio_publicado_propiedad"] = float(update_data["precio_publicado_propiedad"])
        if "superficie_propiedad" in update_data and update_data["superficie_propiedad"] is not None:
            update_data["superficie_propiedad"] = float(update_data["superficie_propiedad"])
        if "porcentaje_captacion_propiedad" in update_data and update_data["porcentaje_captacion_propiedad"] is not None:
            update_data["porcentaje_captacion_propiedad"] = float(update_data["porcentaje_captacion_propiedad"])
        if "porcentaje_colocacion_propiedad" in update_data and update_data["porcentaje_colocacion_propiedad"] is not None:
            update_data["porcentaje_colocacion_propiedad"] = float(update_data["porcentaje_colocacion_propiedad"])
        
        # Convertir fechas a string
        if "fecha_publicacion_propiedad" in update_data and update_data["fecha_publicacion_propiedad"]:
            update_data["fecha_publicacion_propiedad"] = update_data["fecha_publicacion_propiedad"].isoformat()
        if "fecha_cierre_propiedad" in update_data and update_data["fecha_cierre_propiedad"]:
            update_data["fecha_cierre_propiedad"] = update_data["fecha_cierre_propiedad"].isoformat()
        
        result = supabase.table("propiedad").update(update_data).eq("id_propiedad", id_propiedad).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al actualizar la propiedad")
        
        # ✅ Invalidar caché
        clear_propiedades_cache()
        
        propiedad_actualizada = result.data[0]
        
        direccion = supabase.table("direccion").select("*").eq("id_direccion", propiedad_actualizada["id_direccion"]).execute()
        if direccion.data:
            propiedad_actualizada["direccion"] = direccion.data[0]
        
        return propiedad_actualizada
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar la propiedad: {str(e)}")

@router.delete("/propiedades/{id_propiedad}", response_model=dict)
async def eliminar_propiedad(
    id_propiedad: str,
    current_user = Depends(get_current_active_user)
):
    """Elimina una propiedad del sistema"""
    supabase = get_supabase_client()
    
    try:
        propiedad = supabase.table("propiedad").select("*").eq("id_propiedad", id_propiedad).execute()
        if not propiedad.data:
            raise HTTPException(status_code=404, detail="Propiedad no encontrada")
        
        citas = supabase.table("citavisita").select("id_cita").eq("id_propiedad", id_propiedad).execute()
        if citas.data:
            raise HTTPException(
                status_code=400, 
                detail=f"No se puede eliminar la propiedad porque tiene {len(citas.data)} cita(s) de visita registrada(s)"
            )
        
        contratos = supabase.table("contratooperacion").select("id_contrato_operacion").eq("id_propiedad", id_propiedad).execute()
        if contratos.data:
            raise HTTPException(
                status_code=400, 
                detail=f"No se puede eliminar la propiedad porque tiene {len(contratos.data)} contrato(s) registrado(s)"
            )
        
        result = supabase.table("propiedad").delete().eq("id_propiedad", id_propiedad).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al eliminar la propiedad")
        
        # ✅ Invalidar caché
        clear_propiedades_cache()
        
        return {
            "message": "Propiedad eliminada exitosamente (imágenes y documentos eliminados en cascada)",
            "id_propiedad": id_propiedad
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al eliminar la propiedad: {str(e)}")
