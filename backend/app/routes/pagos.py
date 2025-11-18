"""
Router para endpoints de Pagos con PAGINACIÓN
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import date
from app.schemas.pago import PagoCreate, PagoUpdate, PagoResponse
from app.schemas.pagination import PaginatedResponse, create_paginated_response
from app.database import get_supabase_client
from app.utils.dependencies import get_current_active_user


router = APIRouter()


@router.post("/pagos/", response_model=PagoResponse, status_code=201)
async def registrar_pago(
    pago: PagoCreate,
    current_user = Depends(get_current_active_user)
):
    """Registra un nuevo pago asociado a un contrato."""
    supabase = get_supabase_client()
    
    try:
        # Verificar que el contrato existe y está activo
        contrato = supabase.table("contratooperacion").select("id_contrato_operacion, estado_contrato, precio_cierre_contrato").eq("id_contrato_operacion", pago.id_contrato_operacion).execute()
        if not contrato.data:
            raise HTTPException(status_code=404, detail="El contrato especificado no existe")
        
        if contrato.data[0].get("estado_contrato") != "Activo":
            raise HTTPException(status_code=400, detail="Solo se pueden registrar pagos en contratos activos")
        
        # Verificar que no se exceda el precio del contrato
        pagos_existentes = supabase.table("pago").select("monto_pago").eq("id_contrato_operacion", pago.id_contrato_operacion).execute()
        total_pagado = sum(float(p["monto_pago"]) for p in pagos_existentes.data)
        precio_contrato = float(contrato.data[0]["precio_cierre_contrato"])
        
        if total_pagado + float(pago.monto_pago) > precio_contrato:
            raise HTTPException(
                status_code=400, 
                detail=f"El monto total de pagos excedería el precio del contrato"
            )
        
        # Preparar datos
        pago_data = pago.model_dump()
        pago_data["monto_pago"] = float(pago_data["monto_pago"])
        
        if pago_data.get("fecha_pago"):
            pago_data["fecha_pago"] = pago_data["fecha_pago"].isoformat()
        
        # Insertar
        result = supabase.table("pago").insert(pago_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al registrar el pago")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


# ✅ ENDPOINT CON PAGINACIÓN (SIMPLIFICADO)
@router.get("/pagos/", response_model=PaginatedResponse[PagoResponse])
async def listar_pagos_paginados(
    page: int = Query(1, ge=1, description="Número de página"),
    page_size: int = Query(30, ge=1, le=100, description="Items por página"),
    id_contrato: Optional[str] = Query(None, description="Filtrar por contrato"),
    estado: Optional[str] = Query(None, description="Filtrar por estado"),
    current_user = Depends(get_current_active_user)
):
    """
    Lista todos los pagos con paginación.
    
    - **page**: Número de página (default: 1)
    - **page_size**: Items por página (default: 30, max: 100)
    - **id_contrato**: Filtrar por ID de contrato
    - **estado**: Filtrar por estado (Pendiente, Pagado, Atrasado, Cancelado)
    """
    supabase = get_supabase_client()
    
    try:
        # 🔹 PASO 1: Obtener TODOS los datos (para contar)
        query_all = supabase.table("pago").select("id_pago")
        
        if id_contrato:
            query_all = query_all.eq("id_contrato_operacion", id_contrato)
        if estado:
            query_all = query_all.eq("estado_pago", estado)
        
        all_items = query_all.execute()
        total = len(all_items.data)
        
        # 🔹 PASO 2: Obtener datos paginados
        skip = (page - 1) * page_size
        
        query_paginated = supabase.table("pago").select("*")
        
        if id_contrato:
            query_paginated = query_paginated.eq("id_contrato_operacion", id_contrato)
        if estado:
            query_paginated = query_paginated.eq("estado_pago", estado)
        
        query_paginated = query_paginated.order("fecha_pago", desc=True).range(skip, skip + page_size - 1)
        
        result = query_paginated.execute()
        
        # 🔹 PASO 3: Crear respuesta paginada
        return create_paginated_response(
            items=result.data,
            total=total,
            page=page,
            page_size=page_size
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al listar pagos: {str(e)}")


# ✅ ENDPOINT PARA DASHBOARD (OPTIMIZADO)
@router.get("/pagos/dashboard", response_model=List[PagoResponse])
async def listar_pagos_dashboard(
    limit: int = Query(30, ge=1, le=100),
    current_user = Depends(get_current_active_user)
):
    """
    Endpoint optimizado para el dashboard.
    Devuelve solo los últimos N pagos.
    """
    supabase = get_supabase_client()
    
    try:
        result = (
            supabase.table("pago")
            .select("*")
            .order("fecha_pago", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/pagos/atrasados/lista")
async def listar_pagos_atrasados(
    current_user = Depends(get_current_active_user)
):
    """Lista pagos pendientes cuya fecha ya pasó."""
    supabase = get_supabase_client()
    
    try:
        hoy = date.today().isoformat()
        result = (
            supabase.table("pago")
            .select("*")
            .eq("estado_pago", "Pendiente")
            .lt("fecha_pago", hoy)
            .execute()
        )
        
        return {
            "total_atrasados": len(result.data),
            "pagos": result.data
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/pagos/{id_pago}", response_model=PagoResponse)
async def obtener_pago(
    id_pago: str,
    current_user = Depends(get_current_active_user)
):
    """Obtiene un pago específico por ID."""
    supabase = get_supabase_client()
    
    try:
        result = supabase.table("pago").select("*").eq("id_pago", id_pago).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Pago no encontrado")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.put("/pagos/{id_pago}", response_model=PagoResponse)
async def actualizar_pago(
    id_pago: str,
    pago: PagoUpdate,
    current_user = Depends(get_current_active_user)
):
    """Actualiza un pago existente."""
    supabase = get_supabase_client()
    
    try:
        # Verificar que existe
        pago_actual = supabase.table("pago").select("*").eq("id_pago", id_pago).execute()
        if not pago_actual.data:
            raise HTTPException(status_code=404, detail="Pago no encontrado")
        
        # Preparar datos
        pago_data = pago.model_dump(exclude_unset=True)
        
        if not pago_data:
            raise HTTPException(status_code=400, detail="No hay datos para actualizar")
        
        if "monto_pago" in pago_data and pago_data["monto_pago"]:
            pago_data["monto_pago"] = float(pago_data["monto_pago"])
        
        if "fecha_pago" in pago_data and pago_data["fecha_pago"]:
            pago_data["fecha_pago"] = pago_data["fecha_pago"].isoformat()
        
        # Actualizar
        result = supabase.table("pago").update(pago_data).eq("id_pago", id_pago).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al actualizar")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.delete("/pagos/{id_pago}", status_code=204)
async def eliminar_pago(
    id_pago: str,
    current_user = Depends(get_current_active_user)
):
    """Elimina un pago."""
    supabase = get_supabase_client()
    
    try:
        # Verificar que existe
        pago = supabase.table("pago").select("estado_pago").eq("id_pago", id_pago).execute()
        if not pago.data:
            raise HTTPException(status_code=404, detail="Pago no encontrado")
        
        # Validar estado
        if pago.data[0].get("estado_pago") == "Pagado":
            raise HTTPException(
                status_code=400, 
                detail="No se puede eliminar un pago confirmado"
            )
        
        # Eliminar
        result = supabase.table("pago").delete().eq("id_pago", id_pago).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al eliminar")
        
        return None
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
