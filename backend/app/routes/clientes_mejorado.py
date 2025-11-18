"""
Router MEJORADO para endpoints de Clientes con PAGINACIÓN COMPLETA
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from app.schemas.cliente import ClienteCreate, ClienteUpdate, ClienteResponse
from app.schemas.pagination import PaginatedResponse, create_paginated_response
from app.database import get_supabase_client
from app.utils.dependencies import get_current_active_user
from decimal import Decimal

router = APIRouter()

@router.post("/clientes/", response_model=ClienteResponse, status_code=201)
async def crear_cliente(
    cliente: ClienteCreate,
    current_user = Depends(get_current_active_user)
):
    """
    Crea un nuevo cliente en el sistema.
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar si el cliente ya existe
        existing = supabase.table("cliente").select("*").eq("ci_cliente", cliente.ci_cliente).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Ya existe un cliente con ese CI")
        
        # Preparar datos para inserción
        cliente_data = cliente.model_dump()
        
        # Agregar el ID del usuario registrador
        cliente_data["id_usuario_registrador"] = current_user["id_usuario"]
        
        # Convertir Decimal a float para Supabase
        if cliente_data.get("presupuesto_max_cliente") is not None:
            cliente_data["presupuesto_max_cliente"] = float(cliente_data["presupuesto_max_cliente"])
        
        # Insertar cliente
        result = supabase.table("cliente").insert(cliente_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al crear el cliente")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


# ✅ ENDPOINT CON PAGINACIÓN COMPLETA
@router.get("/clientes/", response_model=PaginatedResponse[ClienteResponse])
async def listar_clientes(
    page: int = Query(1, ge=1, description="Número de página"),
    page_size: int = Query(30, ge=1, le=100, description="Items por página"),
    origen: Optional[str] = Query(None, description="Filtrar por origen del cliente"),
    zona_preferencia: Optional[str] = Query(None, description="Filtrar por zona de preferencia"),
    mis_clientes: bool = Query(False, description="Mostrar solo mis clientes registrados"),
    search: Optional[str] = Query(None, description="Buscar por nombre o CI"),
    current_user = Depends(get_current_active_user)
):
    """
    Lista todos los clientes con paginación, filtros y búsqueda.
    
    - **page**: Número de página (default: 1)
    - **page_size**: Items por página (default: 30, max: 100)
    - **origen**: Filtrar por origen
    - **zona_preferencia**: Filtrar por zona
    - **mis_clientes**: Solo mis clientes
    - **search**: Buscar por nombre o CI
    """
    supabase = get_supabase_client()
    
    try:
        # 🔹 PASO 1: Construir query base para CONTAR
        query_count = supabase.table("cliente").select("ci_cliente", count="exact")
        
        # Aplicar filtros
        if mis_clientes:
            query_count = query_count.eq("id_usuario_registrador", current_user["id_usuario"])
        
        if origen:
            query_count = query_count.eq("origen_cliente", origen)
        
        if zona_preferencia:
            query_count = query_count.ilike("preferencia_zona_cliente", f"%{zona_preferencia}%")
        
        if search:
            # Buscar en nombre o CI
            query_count = query_count.or_(f"nombres_completo_cliente.ilike.%{search}%,ci_cliente.ilike.%{search}%")
        
        # Obtener total
        count_result = query_count.execute()
        total = count_result.count if hasattr(count_result, 'count') else len(count_result.data)
        
        # 🔹 PASO 2: Construir query para datos paginados
        skip = (page - 1) * page_size
        
        query_data = supabase.table("cliente").select("*")
        
        # Aplicar los mismos filtros
        if mis_clientes:
            query_data = query_data.eq("id_usuario_registrador", current_user["id_usuario"])
        
        if origen:
            query_data = query_data.eq("origen_cliente", origen)
        
        if zona_preferencia:
            query_data = query_data.ilike("preferencia_zona_cliente", f"%{zona_preferencia}%")
        
        if search:
            query_data = query_data.or_(f"nombres_completo_cliente.ilike.%{search}%,ci_cliente.ilike.%{search}%")
        
        # Aplicar paginación y ordenamiento
        data_result = query_data.order("fecha_registro_cliente", desc=True).range(skip, skip + page_size - 1).execute()
        
        # 🔹 PASO 3: Crear respuesta paginada
        return create_paginated_response(
            items=data_result.data,
            total=total,
            page=page,
            page_size=page_size
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener clientes: {str(e)}")


# ✅ ENDPOINT SIMPLIFICADO SIN PAGINACIÓN (para selectores)
@router.get("/clientes/all/simple", response_model=List[ClienteResponse])
async def listar_clientes_simple(
    limit: int = Query(1000, ge=1, le=5000, description="Límite de registros"),
    current_user = Depends(get_current_active_user)
):
    """
    Lista clientes sin paginación (para selectores/dropdowns).
    Útil cuando necesitas todos los datos sin metadata de paginación.
    """
    supabase = get_supabase_client()
    
    try:
        result = supabase.table("cliente")\
            .select("*")\
            .order("nombres_completo_cliente")\
            .limit(limit)\
            .execute()
        
        return result.data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener clientes: {str(e)}")


@router.get("/clientes/{ci_cliente}", response_model=ClienteResponse)
async def obtener_cliente(
    ci_cliente: str,
    current_user = Depends(get_current_active_user)
):
    """
    Obtiene un cliente específico por su CI.
    """
    supabase = get_supabase_client()
    
    try:
        result = supabase.table("cliente").select("*").eq("ci_cliente", ci_cliente).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.put("/clientes/{ci_cliente}", response_model=ClienteResponse)
async def actualizar_cliente(
    ci_cliente: str,
    cliente_update: ClienteUpdate,
    current_user = Depends(get_current_active_user)
):
    """
    Actualiza los datos de un cliente existente.
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que el cliente existe
        existing = supabase.table("cliente").select("*").eq("ci_cliente", ci_cliente).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
        
        # Preparar datos actualizados (excluir None)
        update_data = cliente_update.model_dump(exclude_none=True)
        
        # Convertir Decimal a float
        if update_data.get("presupuesto_max_cliente") is not None:
            update_data["presupuesto_max_cliente"] = float(update_data["presupuesto_max_cliente"])
        
        # Actualizar
        result = supabase.table("cliente").update(update_data).eq("ci_cliente", ci_cliente).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al actualizar el cliente")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.delete("/clientes/{ci_cliente}")
async def eliminar_cliente(
    ci_cliente: str,
    current_user = Depends(get_current_active_user)
):
    """
    Elimina (desactiva) un cliente del sistema.
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que el cliente existe
        existing = supabase.table("cliente").select("*").eq("ci_cliente", ci_cliente).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
        
        # Soft delete
        result = supabase.table("cliente")\
            .update({"es_activo_cliente": False})\
            .eq("ci_cliente", ci_cliente)\
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al desactivar el cliente")
        
        return {"message": "Cliente desactivado correctamente"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
