from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import date
from app.schemas.pago import PagoCreate, PagoUpdate, PagoResponse
from app.database import get_supabase_client
from app.utils.dependencies import get_current_active_user

router = APIRouter()


@router.post("/pagos/", response_model=PagoResponse, status_code=201)
async def registrar_pago(
    pago: PagoCreate,
    current_user = Depends(get_current_active_user)
):
    """
    Registra un nuevo pago asociado a un contrato.
    
    - **id_contrato_operacion**: ID del contrato al que pertenece el pago
    - **monto_pago**: Monto del pago (debe ser > 0)
    - **fecha_pago**: Fecha en que se realizó o realizará el pago
    - **numero_cuota_pago**: Número de cuota (opcional, para pagos en cuotas)
    - **estado_pago**: Pendiente, Pagado, Atrasado, Cancelado
    
    💡 El sistema validará que el contrato exista y esté activo
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que el contrato existe y está activo
        contrato = supabase.table("contratooperacion").select("id_contrato_operacion, estado_contrato, precio_cierre_contrato").eq("id_contrato_operacion", pago.id_contrato_operacion).execute()
        if not contrato.data:
            raise HTTPException(status_code=404, detail="El contrato especificado no existe")
        
        # Solo permitir pagos en contratos activos
        if contrato.data[0].get("estado_contrato") != "Activo":
            raise HTTPException(status_code=400, detail="Solo se pueden registrar pagos en contratos activos")
        
        # Verificar que no se exceda el precio del contrato
        pagos_existentes = supabase.table("pago").select("monto_pago").eq("id_contrato_operacion", pago.id_contrato_operacion).execute()
        total_pagado = sum(float(p["monto_pago"]) for p in pagos_existentes.data)
        precio_contrato = float(contrato.data[0]["precio_cierre_contrato"])
        
        if total_pagado + float(pago.monto_pago) > precio_contrato:
            raise HTTPException(
                status_code=400, 
                detail=f"El monto total de pagos ({total_pagado + float(pago.monto_pago)}) excedería el precio del contrato ({precio_contrato})"
            )
        
        # Preparar datos para inserción
        pago_data = pago.model_dump()
        
        # Convertir Decimal a float
        pago_data["monto_pago"] = float(pago_data["monto_pago"])
        
        # Convertir date a string
        if pago_data.get("fecha_pago"):
            pago_data["fecha_pago"] = pago_data["fecha_pago"].isoformat()
        
        # Insertar pago
        result = supabase.table("pago").insert(pago_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al registrar el pago")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/pagos/", response_model=List[PagoResponse])
async def listar_pagos(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    id_contrato: Optional[str] = Query(None, description="Filtrar por contrato"),
    estado: Optional[str] = Query(None, description="Filtrar por estado"),
    current_user = Depends(get_current_active_user)
):
    """
    Lista todos los pagos con filtros opcionales.
    
    Filtros disponibles:
    - **id_contrato**: ID del contrato
    - **estado**: Pendiente, Pagado, Atrasado, Cancelado
    """
    supabase = get_supabase_client()
    
    try:
        query = supabase.table("pago").select("*")
        
        if id_contrato:
            query = query.eq("id_contrato_operacion", id_contrato)
        if estado:
            query = query.eq("estado_pago", estado)
        
        query = query.order("fecha_pago", desc=True).range(skip, skip + limit - 1)
        result = query.execute()
        
        return result.data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al listar pagos: {str(e)}")


@router.get("/pagos/{id_pago}", response_model=PagoResponse)
async def obtener_pago(
    id_pago: str,
    current_user = Depends(get_current_active_user)
):
    """
    Obtiene los detalles de un pago específico por su ID.
    """
    supabase = get_supabase_client()
    
    try:
        result = supabase.table("pago").select("*").eq("id_pago", id_pago).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Pago no encontrado")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener el pago: {str(e)}")


@router.put("/pagos/{id_pago}", response_model=PagoResponse)
async def actualizar_pago(
    id_pago: str,
    pago: PagoUpdate,
    current_user = Depends(get_current_active_user)
):
    """
    Actualiza los datos de un pago existente.
    
    ⚠️ Típicamente se usa para cambiar el estado a "Pagado" cuando se confirma el pago
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que el pago existe
        pago_actual = supabase.table("pago").select("*").eq("id_pago", id_pago).execute()
        if not pago_actual.data:
            raise HTTPException(status_code=404, detail="Pago no encontrado")
        
        # Preparar datos para actualización (solo campos no None)
        pago_data = pago.model_dump(exclude_unset=True)
        
        if not pago_data:
            raise HTTPException(status_code=400, detail="No se proporcionaron datos para actualizar")
        
        # Convertir Decimal a float
        if "monto_pago" in pago_data and pago_data["monto_pago"]:
            pago_data["monto_pago"] = float(pago_data["monto_pago"])
        
        # Convertir date a string
        if "fecha_pago" in pago_data and pago_data["fecha_pago"]:
            pago_data["fecha_pago"] = pago_data["fecha_pago"].isoformat()
        
        # Actualizar
        result = supabase.table("pago").update(pago_data).eq("id_pago", id_pago).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al actualizar el pago")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar el pago: {str(e)}")


@router.delete("/pagos/{id_pago}", status_code=204)
async def eliminar_pago(
    id_pago: str,
    current_user = Depends(get_current_active_user)
):
    """
    Elimina un pago.
    
    ⚠️ Solo se recomienda eliminar pagos en estado "Pendiente" o "Cancelado"
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que el pago existe
        pago = supabase.table("pago").select("estado_pago").eq("id_pago", id_pago).execute()
        if not pago.data:
            raise HTTPException(status_code=404, detail="Pago no encontrado")
        
        # Advertir si se intenta eliminar un pago confirmado
        if pago.data[0].get("estado_pago") == "Pagado":
            raise HTTPException(status_code=400, detail="No se recomienda eliminar pagos ya confirmados. Considere cambiar el estado a 'Cancelado'")
        
        # Eliminar
        result = supabase.table("pago").delete().eq("id_pago", id_pago).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al eliminar el pago")
        
        return None
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al eliminar el pago: {str(e)}")


@router.get("/pagos/atrasados/lista")
async def listar_pagos_atrasados(
    current_user = Depends(get_current_active_user)
):
    """
    Lista todos los pagos pendientes cuya fecha de pago ya pasó.
    
    Útil para identificar pagos morosos automáticamente.
    """
    supabase = get_supabase_client()
    
    try:
        hoy = date.today().isoformat()
        
        # Buscar pagos pendientes con fecha anterior a hoy
        result = supabase.table("pago").select("*").eq("estado_pago", "Pendiente").lt("fecha_pago", hoy).execute()
        
        return {
            "total_atrasados": len(result.data),
            "pagos": result.data
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al listar pagos atrasados: {str(e)}")
