"""
Router para endpoints de Citas de Visita con PAGINACIÓN
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import datetime, date, timezone
from app.schemas.cita_visita import CitaVisitaCreate, CitaVisitaUpdate, CitaVisitaResponse
from app.schemas.pagination import PaginatedResponse, create_paginated_response
from app.database import get_supabase_client
from app.utils.dependencies import get_current_active_user

# Importar notificaciones de forma segura
try:
    from app.utils.notificaciones import notificar_cita_nueva, notificar_cita_reprogramada
    NOTIFICACIONES_DISPONIBLES = True
except Exception as e:
    print(f"⚠️ No se pudieron cargar las notificaciones: {e}")
    NOTIFICACIONES_DISPONIBLES = False

router = APIRouter()


def actualizar_citas_vencidas(supabase):
    """
    Actualiza automáticamente las citas programadas/confirmadas cuya fecha ya pasó a estado 'Vencida'.
    """
    try:
        ahora = datetime.now(timezone.utc)
        
        # Buscar citas que deberían estar vencidas
        citas_a_vencer = supabase.table("citavisita")\
            .select("id_cita, fecha_visita_cita, estado_cita")\
            .in_("estado_cita", ["Programada", "Confirmada", "Reprogramada"])\
            .lt("fecha_visita_cita", ahora.isoformat())\
            .execute()
        
        if citas_a_vencer.data:
            # Actualizar cada cita a 'Vencida'
            for cita in citas_a_vencer.data:
                supabase.table("citavisita")\
                    .update({"estado_cita": "Vencida"})\
                    .eq("id_cita", cita["id_cita"])\
                    .execute()
            
            print(f"✅ Se actualizaron {len(citas_a_vencer.data)} citas a estado 'Vencida'")
    
    except Exception as e:
        print(f"Error al actualizar citas vencidas: {e}")


def asignar_asesor_automaticamente(supabase):
    """
    Asigna automáticamente el asesor con menos citas activas (excluyendo vencidas).
    """
    try:
        # Obtener todos los usuarios (asesores)
        usuarios = supabase.table("usuario").select("id_usuario").execute()
        if not usuarios.data:
            return None
        
        # Obtener todas las citas activas (NO vencidas, canceladas ni realizadas)
        estados_activos = ["Programada", "Confirmada", "Reprogramada"]
        citas = supabase.table("citavisita").select("id_usuario_asesor").in_("estado_cita", estados_activos).execute()
        
        # Contar citas por asesor
        conteo_por_asesor = {}
        for usuario in usuarios.data:
            id_usuario = usuario["id_usuario"]
            conteo_por_asesor[id_usuario] = 0
        
        for cita in citas.data:
            id_asesor = cita.get("id_usuario_asesor")
            if id_asesor and id_asesor in conteo_por_asesor:
                conteo_por_asesor[id_asesor] += 1
        
        # Encontrar el asesor con menos citas
        asesor_con_menos_citas = min(conteo_por_asesor.items(), key=lambda x: x[1])
        return asesor_con_menos_citas[0]
    
    except Exception as e:
        print(f"Error al asignar asesor: {e}")
        return None


@router.post("/citas-visita/", response_model=CitaVisitaResponse, status_code=201)
async def crear_cita_visita(
    cita: CitaVisitaCreate,
    current_user = Depends(get_current_active_user)
):
    """
    Agenda una nueva cita de visita a una propiedad.
    
    - **id_propiedad**: ID de la propiedad a visitar
    - **ci_cliente**: CI del cliente interesado
    - **id_usuario_asesor**: ID del asesor (opcional, se asigna automáticamente si no se especifica)
    - **fecha_visita_cita**: Fecha y hora de la visita
    - **lugar_encuentro_cita**: Dónde se encontrarán (opcional)
    - **estado_cita**: Estado inicial (default: "Programada")
    - **nota_cita**: Notas adicionales (opcional)
    - **recordatorio_minutos_cita**: Minutos antes para recordatorio (default: 30)
    
    💡 Estados: Programada → Confirmada → Realizada / Cancelada / No asistió / Vencida
    💡 Si no se especifica asesor, se asigna automáticamente al que tiene menos citas activas
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
        
        # 🔹 ASIGNACIÓN AUTOMÁTICA DE ASESOR
        if not cita.id_usuario_asesor:
            # Asignar automáticamente al asesor con menos citas
            asesor_id = asignar_asesor_automaticamente(supabase)
            if not asesor_id:
                raise HTTPException(status_code=500, detail="No se pudo asignar un asesor automáticamente")
            cita.id_usuario_asesor = asesor_id
        else:
            # Verificar que el asesor especificado existe
            asesor = supabase.table("usuario").select("id_usuario").eq("id_usuario", cita.id_usuario_asesor).execute()
            if not asesor.data:
                raise HTTPException(status_code=404, detail="El asesor especificado no existe")
        
        # Verificar que la fecha no sea en el pasado
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
        
        # 🔔 Enviar notificación al asesor asignado
        if NOTIFICACIONES_DISPONIBLES:
            try:
                cita_creada = result.data[0]
                notificar_cita_nueva(supabase, cita_creada["id_cita"], cita_creada["id_usuario_asesor"])
            except Exception as e:
                print(f"⚠️ Error al enviar notificación: {e}")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


# ✅ NUEVO: Endpoint con paginación
@router.get("/citas-visita/", response_model=PaginatedResponse[CitaVisitaResponse])
async def listar_citas_paginadas(
    page: int = Query(1, ge=1, description="Número de página"),
    page_size: int = Query(20, ge=1, le=100, description="Items por página"),
    estado: Optional[str] = Query(None, description="Filtrar por estado"),
    ci_cliente: Optional[str] = Query(None, description="Filtrar por cliente"),
    id_propiedad: Optional[str] = Query(None, description="Filtrar por propiedad"),
    mis_citas: bool = Query(False, description="Solo mis citas como asesor"),
    fecha_desde: Optional[date] = Query(None, description="Fecha desde (YYYY-MM-DD)"),
    fecha_hasta: Optional[date] = Query(None, description="Fecha hasta (YYYY-MM-DD)"),
    current_user = Depends(get_current_active_user)
):
    """
    Lista todas las citas de visita con paginación y filtros avanzados.
    
    - **page**: Número de página (default: 1)
    - **page_size**: Items por página (default: 20, max: 100)
    
    **Filtros:**
    - **estado**: "Programada", "Confirmada", "Realizada", "Cancelada", "No asistió"
    - **ci_cliente**: Citas de un cliente específico
    - **id_propiedad**: Citas de una propiedad específica
    - **mis_citas**: Solo citas donde yo soy el asesor
    - **fecha_desde** y **fecha_hasta**: Rango de fechas
    """
    supabase = get_supabase_client()
    
    try:
        # 🔹 ACTUALIZAR CITAS VENCIDAS AUTOMÁTICAMENTE
        actualizar_citas_vencidas(supabase)
        
        # 🔹 PASO 1: Contar total
        count_query = supabase.table("citavisita").select("id_cita")
        
        # Aplicar filtros
        if estado:
            count_query = count_query.eq("estado_cita", estado)
        if ci_cliente:
            count_query = count_query.eq("ci_cliente", ci_cliente)
        if id_propiedad:
            count_query = count_query.eq("id_propiedad", id_propiedad)
        if mis_citas:
            count_query = count_query.eq("id_usuario_asesor", current_user["id_usuario"])
        if fecha_desde:
            count_query = count_query.gte("fecha_visita_cita", fecha_desde.isoformat())
        if fecha_hasta:
            fecha_hasta_str = f"{fecha_hasta.isoformat()}T23:59:59"
            count_query = count_query.lte("fecha_visita_cita", fecha_hasta_str)
        
        all_items = count_query.execute()
        total = len(all_items.data)
        
        # 🔹 PASO 2: Obtener datos paginados
        skip = (page - 1) * page_size
        data_query = supabase.table("citavisita").select("*")
        
        # Aplicar mismos filtros
        if estado:
            data_query = data_query.eq("estado_cita", estado)
        if ci_cliente:
            data_query = data_query.eq("ci_cliente", ci_cliente)
        if id_propiedad:
            data_query = data_query.eq("id_propiedad", id_propiedad)
        if mis_citas:
            data_query = data_query.eq("id_usuario_asesor", current_user["id_usuario"])
        if fecha_desde:
            data_query = data_query.gte("fecha_visita_cita", fecha_desde.isoformat())
        if fecha_hasta:
            fecha_hasta_str = f"{fecha_hasta.isoformat()}T23:59:59"
            data_query = data_query.lte("fecha_visita_cita", fecha_hasta_str)
        
        # Ordenar y paginar
        data_query = data_query.order("fecha_visita_cita", desc=False).range(skip, skip + page_size - 1)
        result = data_query.execute()
        
        # 🔹 PASO 3: Crear respuesta paginada
        return create_paginated_response(
            items=result.data,
            total=total,
            page=page,
            page_size=page_size
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener citas: {str(e)}")


# ✅ Endpoint legacy (sin paginación)
@router.get("/citas-visita/all", response_model=List[CitaVisitaResponse])
async def listar_todas_citas(
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
    Lista todas las citas sin paginación (legacy).
    ⚠️ Usar solo para casos específicos
    """
    supabase = get_supabase_client()
    
    try:
        query = supabase.table("citavisita").select("*")
        
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
            fecha_hasta_str = f"{fecha_hasta.isoformat()}T23:59:59"
            query = query.lte("fecha_visita_cita", fecha_hasta_str)
        
        result = query.order("fecha_visita_cita", desc=False).range(skip, skip + limit - 1).execute()
        return result.data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener citas: {str(e)}")


# ✅ Endpoint optimizado para Dashboard
@router.get("/citas-visita/proximas", response_model=List[CitaVisitaResponse])
async def obtener_proximas_citas(
    limit: int = Query(5, ge=1, le=50, description="Límite de citas"),
    current_user = Depends(get_current_active_user)
):
    """
    Obtiene las próximas N citas (optimizado para dashboard).
    
    Requiere autenticación
    """
    supabase = get_supabase_client()
    
    try:
        hoy = datetime.now().isoformat()
        
        result = (
            supabase.table("citavisita")
            .select("*")
            .gte("fecha_visita_cita", hoy)
            .order("fecha_visita_cita", desc=False)
            .limit(limit)
            .execute()
        )
        
        return result.data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener próximas citas: {str(e)}")


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
        hoy = datetime.now().date()
        inicio_dia = f"{hoy.isoformat()}T00:00:00"
        fin_dia = f"{hoy.isoformat()}T23:59:59"
        
        citas = (
            supabase.table("citavisita")
            .select("*")
            .eq("id_usuario_asesor", current_user["id_usuario"])
            .gte("fecha_visita_cita", inicio_dia)
            .lte("fecha_visita_cita", fin_dia)
            .order("fecha_visita_cita")
            .execute()
        )
        
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


@router.get("/citas-visita/{id_cita}", response_model=CitaVisitaResponse)
async def obtener_cita(
    id_cita: str,
    current_user = Depends(get_current_active_user)
):
    """Obtiene una cita específica por su ID."""
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
        existing = supabase.table("citavisita").select("*").eq("id_cita", id_cita).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Cita no encontrada")
        
        cita_original = existing.data[0]
        update_data = cita.model_dump(exclude_unset=True)
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No se proporcionaron datos para actualizar")
        
        # 🔄 Detectar si es reprogramación (cambio de fecha o estado a Reprogramada)
        es_reprogramacion = False
        if "fecha_visita_cita" in update_data and update_data["fecha_visita_cita"]:
            update_data["fecha_visita_cita"] = update_data["fecha_visita_cita"].isoformat()
            # Comparar fechas (solo si cambió)
            if update_data["fecha_visita_cita"] != cita_original.get("fecha_visita_cita"):
                es_reprogramacion = True
        
        if update_data.get("estado_cita") == "Reprogramada":
            es_reprogramacion = True
        
        result = supabase.table("citavisita").update(update_data).eq("id_cita", id_cita).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al actualizar la cita")
        
        # 🔔 Enviar notificación si fue reprogramada
        if NOTIFICACIONES_DISPONIBLES and es_reprogramacion:
            try:
                cita_actualizada = result.data[0]
                notificar_cita_reprogramada(supabase, id_cita, cita_actualizada["id_usuario_asesor"])
            except Exception as e:
                print(f"⚠️ Error al enviar notificación de reprogramación: {e}")
        
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
        cita = supabase.table("citavisita").select("*").eq("id_cita", id_cita).execute()
        if not cita.data:
            raise HTTPException(status_code=404, detail="Cita no encontrada")
        
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
