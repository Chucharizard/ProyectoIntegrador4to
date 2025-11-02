from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from app.schemas.ganancia_empleado import GananciaEmpleadoCreate, GananciaEmpleadoUpdate, GananciaEmpleadoResponse
from app.database import get_supabase_client
from app.utils.dependencies import get_current_active_user

router = APIRouter()


@router.post("/ganancias/", response_model=GananciaEmpleadoResponse, status_code=201)
async def registrar_ganancia(
    ganancia: GananciaEmpleadoCreate,
    current_user = Depends(get_current_active_user)
):
    """
    Registra una ganancia de empleado por una operación inmobiliaria.
    
    - **id_propiedad**: Propiedad de la cual se genera la ganancia
    - **id_usuario_empleado**: Empleado que recibe la ganancia
    - **tipo_operacion_ganancia**: "Captación", "Colocación" o "Ambas"
    - **porcentaje_ganado_ganancia**: Porcentaje sobre el precio (0-100)
    - **dinero_ganado_ganancia**: Monto en dinero de la ganancia
    - **esta_concretado_ganancia**: Si ya se pagó la ganancia (default: false)
    - **fecha_cierre_ganancia**: Fecha del cierre de la operación
    
    💡 Estas ganancias se calculan basándose en los porcentajes de captación/colocación
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que la propiedad existe
        propiedad = supabase.table("propiedad").select("id_propiedad, titulo_propiedad").eq("id_propiedad", ganancia.id_propiedad).execute()
        if not propiedad.data:
            raise HTTPException(status_code=404, detail="La propiedad especificada no existe")
        
        # Verificar que el empleado existe
        empleado = supabase.table("usuario").select("id_usuario").eq("id_usuario", ganancia.id_usuario_empleado).execute()
        if not empleado.data:
            raise HTTPException(status_code=404, detail="El empleado especificado no existe")
        
        # Preparar datos para inserción
        ganancia_data = ganancia.model_dump()
        
        # Convertir Decimal a float
        ganancia_data["porcentaje_ganado_ganancia"] = float(ganancia_data["porcentaje_ganado_ganancia"])
        ganancia_data["dinero_ganado_ganancia"] = float(ganancia_data["dinero_ganado_ganancia"])
        
        # Convertir date a string
        if ganancia_data.get("fecha_cierre_ganancia"):
            ganancia_data["fecha_cierre_ganancia"] = ganancia_data["fecha_cierre_ganancia"].isoformat()
        
        # Insertar ganancia
        result = supabase.table("gananciaempleado").insert(ganancia_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al registrar la ganancia")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/ganancias/", response_model=List[GananciaEmpleadoResponse])
async def listar_ganancias(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    id_usuario_empleado: Optional[str] = Query(None, description="Filtrar por empleado"),
    id_propiedad: Optional[str] = Query(None, description="Filtrar por propiedad"),
    tipo_operacion: Optional[str] = Query(None, description="Filtrar por tipo de operación"),
    solo_pendientes: bool = Query(False, description="Solo ganancias no concretadas"),
    current_user = Depends(get_current_active_user)
):
    """
    Lista todas las ganancias con filtros opcionales.
    
    Filtros disponibles:
    - **id_usuario_empleado**: ID del empleado
    - **id_propiedad**: ID de la propiedad
    - **tipo_operacion**: Captación, Colocación, Ambas
    - **solo_pendientes**: Si es true, solo muestra ganancias no pagadas
    """
    supabase = get_supabase_client()
    
    try:
        query = supabase.table("gananciaempleado").select("*")
        
        if id_usuario_empleado:
            query = query.eq("id_usuario_empleado", id_usuario_empleado)
        if id_propiedad:
            query = query.eq("id_propiedad", id_propiedad)
        if tipo_operacion:
            query = query.eq("tipo_operacion_ganancia", tipo_operacion)
        if solo_pendientes:
            query = query.eq("esta_concretado_ganancia", False)
        
        query = query.order("fecha_cierre_ganancia", desc=True).range(skip, skip + limit - 1)
        result = query.execute()
        
        return result.data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al listar ganancias: {str(e)}")


@router.get("/ganancias/{id_ganancia}", response_model=GananciaEmpleadoResponse)
async def obtener_ganancia(
    id_ganancia: str,
    current_user = Depends(get_current_active_user)
):
    """
    Obtiene los detalles de una ganancia específica.
    """
    supabase = get_supabase_client()
    
    try:
        result = supabase.table("gananciaempleado").select("*").eq("id_ganancia", id_ganancia).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Ganancia no encontrada")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener la ganancia: {str(e)}")


@router.put("/ganancias/{id_ganancia}", response_model=GananciaEmpleadoResponse)
async def actualizar_ganancia(
    id_ganancia: str,
    ganancia: GananciaEmpleadoUpdate,
    current_user = Depends(get_current_active_user)
):
    """
    Actualiza los datos de una ganancia existente.
    
    Típicamente usado para marcar como "concretado" cuando se paga.
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que la ganancia existe
        ganancia_actual = supabase.table("gananciaempleado").select("*").eq("id_ganancia", id_ganancia).execute()
        if not ganancia_actual.data:
            raise HTTPException(status_code=404, detail="Ganancia no encontrada")
        
        # Preparar datos para actualización (solo campos no None)
        ganancia_data = ganancia.model_dump(exclude_unset=True)
        
        if not ganancia_data:
            raise HTTPException(status_code=400, detail="No se proporcionaron datos para actualizar")
        
        # Convertir Decimal a float
        if "porcentaje_ganado_ganancia" in ganancia_data and ganancia_data["porcentaje_ganado_ganancia"]:
            ganancia_data["porcentaje_ganado_ganancia"] = float(ganancia_data["porcentaje_ganado_ganancia"])
        if "dinero_ganado_ganancia" in ganancia_data and ganancia_data["dinero_ganado_ganancia"]:
            ganancia_data["dinero_ganado_ganancia"] = float(ganancia_data["dinero_ganado_ganancia"])
        
        # Convertir date a string
        if "fecha_cierre_ganancia" in ganancia_data and ganancia_data["fecha_cierre_ganancia"]:
            ganancia_data["fecha_cierre_ganancia"] = ganancia_data["fecha_cierre_ganancia"].isoformat()
        
        # Actualizar
        result = supabase.table("gananciaempleado").update(ganancia_data).eq("id_ganancia", id_ganancia).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al actualizar la ganancia")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar la ganancia: {str(e)}")


@router.delete("/ganancias/{id_ganancia}", status_code=204)
async def eliminar_ganancia(
    id_ganancia: str,
    current_user = Depends(get_current_active_user)
):
    """
    Elimina una ganancia.
    
    ⚠️ Solo se recomienda eliminar ganancias no concretadas
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que la ganancia existe
        ganancia = supabase.table("gananciaempleado").select("esta_concretado_ganancia").eq("id_ganancia", id_ganancia).execute()
        if not ganancia.data:
            raise HTTPException(status_code=404, detail="Ganancia no encontrada")
        
        # Advertir si se intenta eliminar una ganancia ya pagada
        if ganancia.data[0].get("esta_concretado_ganancia"):
            raise HTTPException(status_code=400, detail="No se recomienda eliminar ganancias ya pagadas")
        
        # Eliminar
        result = supabase.table("gananciaempleado").delete().eq("id_ganancia", id_ganancia).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al eliminar la ganancia")
        
        return None
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al eliminar la ganancia: {str(e)}")


@router.post("/ganancias/marcar-pagadas")
async def marcar_ganancias_pagadas(
    ids_ganancias: List[str],
    current_user = Depends(get_current_active_user)
):
    """
    Marca múltiples ganancias como pagadas (concretadas) en lote.
    
    Útil para procesar pagos masivos.
    """
    supabase = get_supabase_client()
    
    try:
        resultados = []
        
        for id_ganancia in ids_ganancias:
            result = supabase.table("gananciaempleado").update({
                "esta_concretado_ganancia": True
            }).eq("id_ganancia", id_ganancia).execute()
            
            if result.data:
                resultados.append({"id_ganancia": id_ganancia, "status": "pagado"})
            else:
                resultados.append({"id_ganancia": id_ganancia, "status": "error"})
        
        exitosos = len([r for r in resultados if r["status"] == "pagado"])
        
        return {
            "total_procesados": len(ids_ganancias),
            "exitosos": exitosos,
            "fallidos": len(ids_ganancias) - exitosos,
            "detalles": resultados
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al marcar ganancias como pagadas: {str(e)}")


@router.get("/ganancias/empleado/{id_usuario}/resumen")
async def resumen_ganancias_empleado(
    id_usuario: str,
    current_user = Depends(get_current_active_user)
):
    """
    Obtiene un resumen de las ganancias de un empleado específico.
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que el empleado existe
        empleado = supabase.table("usuario").select("nombre_usuario, ci_empleado").eq("id_usuario", id_usuario).execute()
        if not empleado.data:
            raise HTTPException(status_code=404, detail="Empleado no encontrado")
        
        # Obtener todas las ganancias del empleado
        ganancias = supabase.table("gananciaempleado").select("*").eq("id_usuario_empleado", id_usuario).execute()
        
        # Calcular totales
        total_ganancias = sum(float(g["dinero_ganado_ganancia"]) for g in ganancias.data)
        total_pagado = sum(float(g["dinero_ganado_ganancia"]) for g in ganancias.data if g["esta_concretado_ganancia"])
        total_pendiente = total_ganancias - total_pagado
        
        # Agrupar por tipo de operación
        por_tipo = {
            "Captación": 0.0,
            "Colocación": 0.0,
            "Ambas": 0.0
        }
        for g in ganancias.data:
            tipo = g["tipo_operacion_ganancia"]
            por_tipo[tipo] = por_tipo.get(tipo, 0.0) + float(g["dinero_ganado_ganancia"])
        
        return {
            "empleado": empleado.data[0],
            "total_registros": len(ganancias.data),
            "resumen_financiero": {
                "total_ganancias": total_ganancias,
                "total_pagado": total_pagado,
                "total_pendiente": total_pendiente,
                "porcentaje_pagado": (total_pagado / total_ganancias * 100) if total_ganancias > 0 else 0
            },
            "por_tipo_operacion": por_tipo,
            "ganancias": ganancias.data
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener resumen: {str(e)}")
