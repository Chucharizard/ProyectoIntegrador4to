from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import datetime, date, timezone
from app.schemas.cita_visita import CitaVisitaCreate, CitaVisitaUpdate, CitaVisitaResponse
from app.database import get_supabase_client
from app.utils.dependencies import get_current_active_user

router = APIRouter()


@router.post("/citas-visita/", response_model=CitaVisitaResponse, status_code=201)
async def crear_cita_visita(
    cita: CitaVisitaCreate,
    current_user = Depends(get_current_active_user)
):
    """
    Agenda una nueva cita de visita a una propiedad.
    
    - **id_propiedad**: ID de la propiedad a visitar
    - **ci_cliente**: CI del cliente interesado
    - **id_usuario_asesor**: ID del asesor que guiará la visita (asignado por el broker)
    - **fecha_visita_cita**: Fecha y hora de la visita
    - **lugar_encuentro_cita**: Dónde se encontrarán (opcional)
    - **estado_cita**: Estado inicial (default: "Programada")
    - **nota_cita**: Notas adicionales (opcional)
    - **recordatorio_minutos_cita**: Minutos antes para recordatorio (default: 30)
    
    💡 Estados: Programada → Confirmada → Realizada / Cancelada / No asistió
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que la propiedad existe
        propiedad = supabase.table("propiedad").select("id_propiedad, titulo_propiedad, estado_propiedad").eq("id_propiedad", cita.id_propiedad).execute()
        if not propiedad.data:
            raise HTTPException(status_code=404, detail="La propiedad especificada no existe")
        
        # Verificar que la propiedad esté disponible
        if propiedad.data[0].get("estado_propiedad") == "Cerrada":
            raise HTTPException(status_code=400, detail="No se pueden agendar visitas a propiedades cerradas")
        
        # Verificar que el cliente existe
        cliente = supabase.table("cliente").select("ci_cliente").eq("ci_cliente", cita.ci_cliente).execute()
        if not cliente.data:
            raise HTTPException(status_code=404, detail="El cliente especificado no existe")
        
        # Verificar que el asesor existe
        asesor = supabase.table("usuario").select("id_usuario").eq("id_usuario", cita.id_usuario_asesor).execute()
        if not asesor.data:
            raise HTTPException(status_code=404, detail="El asesor especificado no existe")
        
        # Verificar que la fecha no sea en el pasado
        # Usar datetime con timezone para comparar correctamente
        ahora = datetime.now(timezone.utc)
        if cita.fecha_visita_cita < ahora:
            raise HTTPException(status_code=400, detail="No se pueden agendar citas en el pasado")
        
        # Preparar datos para inserción
        cita_data = cita.model_dump()
        
        # Convertir datetime a string ISO
        if isinstance(cita_data["fecha_visita_cita"], datetime):
            cita_data["fecha_visita_cita"] = cita_data["fecha_visita_cita"].isoformat()
        
        # Insertar cita
        result = supabase.table("citavisita").insert(cita_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al crear la cita")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/citas-visita/", response_model=List[CitaVisitaResponse])
async def listar_citas(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    estado: Optional[str] = Query(None, description="Filtrar por estado"),
    ci_cliente: Optional[str] = Query(None, description="Filtrar por cliente"),
    id_propiedad: Optional[str] = Query(None, description="Filtrar por propiedad"),
    mis_citas: bool = Query(False, description="Solo mis citas como asesor"),
    fecha_desde: Optional[date] = Query(None, description="Fecha desde (YYYY-MM-DD)"),
    fecha_hasta: Optional[date] = Query(None, description="Fecha hasta (YYYY-MM-DD)"),
    current_user = Depends(get_current_active_user)
):
    """
    Lista todas las citas de visita con filtros avanzados.
    
    **Filtros:**
    - **estado**: "Programada", "Confirmada", "Realizada", "Cancelada", "No asistió"
    - **ci_cliente**: Citas de un cliente específico
    - **id_propiedad**: Citas de una propiedad específica
    - **mis_citas**: Solo citas donde yo soy el asesor
    - **fecha_desde** y **fecha_hasta**: Rango de fechas
    """
    supabase = get_supabase_client()
    
    try:
        query = supabase.table("citavisita").select("*")
        
        # Filtros
        if estado:
            query = query.eq("estado_cita", estado)
        
        if ci_cliente:
            query = query.eq("ci_cliente", ci_cliente)
        
        if id_propiedad:
            query = query.eq("id_propiedad", id_propiedad)
        
        if mis_citas:
            query = query.eq("id_usuario_asesor", current_user["id_usuario"])
        
        if fecha_desde:
            query = query.gte("fecha_visita_cita", fecha_desde.isoformat())
        
        if fecha_hasta:
            # Agregar un día para incluir todo el día
            fecha_hasta_str = f"{fecha_hasta.isoformat()}T23:59:59"
            query = query.lte("fecha_visita_cita", fecha_hasta_str)
        
        # Ordenar por fecha (más próximas primero)
        result = query.order("fecha_visita_cita", desc=False).range(skip, skip + limit - 1).execute()
        
        return result.data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener citas: {str(e)}")


@router.get("/citas-visita/{id_cita}", response_model=CitaVisitaResponse)
async def obtener_cita(
    id_cita: str,
    current_user = Depends(get_current_active_user)
):
    """
    Obtiene una cita específica por su ID.
    """
    supabase = get_supabase_client()
    
    try:
        result = supabase.table("citavisita").select("*").eq("id_cita", id_cita).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Cita no encontrada")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener la cita: {str(e)}")


@router.put("/citas-visita/{id_cita}", response_model=CitaVisitaResponse)
async def actualizar_cita(
    id_cita: str,
    cita: CitaVisitaUpdate,
    current_user = Depends(get_current_active_user)
):
    """
    Actualiza los datos de una cita.
    
    **Casos de uso comunes:**
    - Confirmar cita: `{ "estado_cita": "Confirmada" }`
    - Marcar como realizada: `{ "estado_cita": "Realizada", "nota_cita": "Cliente interesado" }`
    - Cancelar: `{ "estado_cita": "Cancelada", "nota_cita": "Cliente canceló" }`
    - Reprogramar: `{ "fecha_visita_cita": "2025-10-25T15:00:00" }`
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que la cita existe
        existing = supabase.table("citavisita").select("*").eq("id_cita", id_cita).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Cita no encontrada")
        
        # Preparar datos para actualización
        update_data = cita.model_dump(exclude_unset=True)
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No se proporcionaron datos para actualizar")
        
        # Convertir datetime a string si existe
        if "fecha_visita_cita" in update_data and update_data["fecha_visita_cita"]:
            update_data["fecha_visita_cita"] = update_data["fecha_visita_cita"].isoformat()
        
        # Actualizar cita
        result = supabase.table("citavisita").update(update_data).eq("id_cita", id_cita).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al actualizar la cita")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar la cita: {str(e)}")


@router.delete("/citas-visita/{id_cita}", response_model=dict)
async def eliminar_cita(
    id_cita: str,
    current_user = Depends(get_current_active_user)
):
    """
    Elimina una cita del sistema.
    
    💡 Recomendación: En lugar de eliminar, considera cambiar el estado a "Cancelada".
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que la cita existe
        cita = supabase.table("citavisita").select("*").eq("id_cita", id_cita).execute()
        if not cita.data:
            raise HTTPException(status_code=404, detail="Cita no encontrada")
        
        # Eliminar cita
        result = supabase.table("citavisita").delete().eq("id_cita", id_cita).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al eliminar la cita")
        
        return {
            "message": "Cita eliminada exitosamente",
            "id_cita": id_cita
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al eliminar la cita: {str(e)}")


@router.get("/citas-visita/hoy/resumen", response_model=dict)
async def obtener_citas_hoy(
    current_user = Depends(get_current_active_user)
):
    """
    Obtiene un resumen de las citas de hoy del asesor actual.
    
    Útil para dashboard o vista de agenda diaria.
    """
    supabase = get_supabase_client()
    
    try:
        # Fechas de hoy
        hoy = datetime.now().date()
        inicio_dia = f"{hoy.isoformat()}T00:00:00"
        fin_dia = f"{hoy.isoformat()}T23:59:59"
        
        # Obtener citas de hoy del usuario actual
        citas = supabase.table("citavisita").select("*").eq("id_usuario_asesor", current_user["id_usuario"]).gte("fecha_visita_cita", inicio_dia).lte("fecha_visita_cita", fin_dia).order("fecha_visita_cita").execute()
        
        # Contar por estado
        total = len(citas.data)
        por_estado = {}
        for cita in citas.data:
            estado = cita.get("estado_cita") or "Sin estado"
            por_estado[estado] = por_estado.get(estado, 0) + 1
        
        return {
            "fecha": hoy.isoformat(),
            "total_citas": total,
            "por_estado": por_estado,
            "citas": citas.data
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener citas de hoy: {str(e)}")
