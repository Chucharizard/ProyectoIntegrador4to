from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from app.schemas.cliente import ClienteCreate, ClienteUpdate, ClienteResponse
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
    
    - **ci_cliente**: Cédula de identidad del cliente (único)
    - **nombres_completo_cliente**: Nombres completos
    - **apellidos_completo_cliente**: Apellidos completos
    - **telefono_cliente**: Número de teléfono (opcional)
    - **correo_electronico_cliente**: Correo electrónico (opcional)
    - **preferencia_zona_cliente**: Zona de preferencia para propiedades (opcional)
    - **presupuesto_max_cliente**: Presupuesto máximo (opcional)
    - **origen_cliente**: Cómo llegó el cliente (opcional, ej: "Referido", "Redes sociales", "Walk-in")
    
    El usuario registrador se toma automáticamente del usuario autenticado.
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar si el cliente ya existe
        existing = supabase.table("cliente").select("*").eq("ci_cliente", cliente.ci_cliente).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Ya existe un cliente con ese CI")
        
        # Preparar datos para inserción
        cliente_data = cliente.model_dump()
        
        # Agregar el ID del usuario registrador (usuario actual autenticado)
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


@router.get("/clientes/", response_model=List[ClienteResponse])
async def listar_clientes(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros a devolver"),
    origen: Optional[str] = Query(None, description="Filtrar por origen del cliente"),
    zona_preferencia: Optional[str] = Query(None, description="Filtrar por zona de preferencia"),
    mis_clientes: bool = Query(False, description="Mostrar solo mis clientes registrados"),
    current_user = Depends(get_current_active_user)
):
    """
    Lista todos los clientes del sistema con paginación y filtros.
    
    - **skip**: Número de registros a omitir (para paginación)
    - **limit**: Número máximo de registros a devolver
    - **origen**: Filtrar por origen del cliente (opcional)
    - **zona_preferencia**: Filtrar por zona de preferencia (opcional)
    - **mis_clientes**: Si es True, solo devuelve clientes registrados por el usuario autenticado
    """
    supabase = get_supabase_client()
    
    try:
        query = supabase.table("cliente").select("*")
        
        # Filtrar por usuario registrador si se solicita
        if mis_clientes:
            query = query.eq("id_usuario_registrador", current_user["id_usuario"])
        
        # Filtrar por origen si se proporciona
        if origen:
            query = query.eq("origen_cliente", origen)
        
        # Filtrar por zona de preferencia si se proporciona
        if zona_preferencia:
            query = query.ilike("preferencia_zona_cliente", f"%{zona_preferencia}%")
        
        # Aplicar paginación y ordenamiento
        result = query.order("fecha_registro_cliente", desc=True).range(skip, skip + limit - 1).execute()
        
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
        raise HTTPException(status_code=500, detail=f"Error al obtener el cliente: {str(e)}")


@router.put("/clientes/{ci_cliente}", response_model=ClienteResponse)
async def actualizar_cliente(
    ci_cliente: str,
    cliente: ClienteUpdate,
    current_user = Depends(get_current_active_user)
):
    """
    Actualiza los datos de un cliente existente.
    
    Todos los campos son opcionales. Solo se actualizarán los campos proporcionados.
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que el cliente existe
        existing = supabase.table("cliente").select("*").eq("ci_cliente", ci_cliente).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
        
        # Preparar datos para actualización (solo campos no-None)
        update_data = cliente.model_dump(exclude_unset=True)
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No se proporcionaron datos para actualizar")
        
        # Convertir Decimal a float si existe
        if "presupuesto_max_cliente" in update_data and update_data["presupuesto_max_cliente"] is not None:
            update_data["presupuesto_max_cliente"] = float(update_data["presupuesto_max_cliente"])
        
        # Actualizar cliente
        result = supabase.table("cliente").update(update_data).eq("ci_cliente", ci_cliente).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al actualizar el cliente")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar el cliente: {str(e)}")


@router.delete("/clientes/{ci_cliente}", response_model=dict)
async def eliminar_cliente(
    ci_cliente: str,
    current_user = Depends(get_current_active_user)
):
    """
    Elimina un cliente del sistema.
    
    ⚠️ No se puede eliminar si el cliente tiene:
    - Citas de visita programadas o realizadas
    - Contratos de operación activos
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que el cliente existe
        cliente_exist = supabase.table("cliente").select("*").eq("ci_cliente", ci_cliente).execute()
        if not cliente_exist.data:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
        
        # Verificar si tiene citas de visita
        citas = supabase.table("citavisita").select("id_cita").eq("ci_cliente", ci_cliente).execute()
        
        if citas.data:
            raise HTTPException(
                status_code=400, 
                detail=f"No se puede eliminar el cliente porque tiene {len(citas.data)} cita(s) de visita registrada(s)"
            )
        
        # Verificar si tiene contratos
        contratos = supabase.table("contratooperacion").select("id_contrato_operacion").eq("ci_cliente", ci_cliente).execute()
        
        if contratos.data:
            raise HTTPException(
                status_code=400, 
                detail=f"No se puede eliminar el cliente porque tiene {len(contratos.data)} contrato(s) registrado(s)"
            )
        
        # Eliminar cliente (hard delete, ya que no tiene campo is_active)
        result = supabase.table("cliente").delete().eq("ci_cliente", ci_cliente).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al eliminar el cliente")
        
        return {
            "message": "Cliente eliminado exitosamente",
            "ci_cliente": ci_cliente
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al eliminar el cliente: {str(e)}")


@router.get("/clientes/estadisticas/resumen", response_model=dict)
async def obtener_estadisticas_clientes(
    current_user = Depends(get_current_active_user)
):
    """
    Obtiene estadísticas generales de clientes.
    
    Retorna:
    - Total de clientes registrados
    - Clientes registrados por el usuario actual
    - Distribución por origen
    """
    supabase = get_supabase_client()
    
    try:
        # Total de clientes
        total = supabase.table("cliente").select("ci_cliente", count="exact").execute()
        
        # Clientes registrados por el usuario actual
        mis_clientes = supabase.table("cliente").select("ci_cliente", count="exact").eq("id_usuario_registrador", current_user["id_usuario"]).execute()
        
        # Obtener todos los clientes para calcular distribución por origen
        clientes = supabase.table("cliente").select("origen_cliente").execute()
        
        # Calcular distribución por origen
        origenes = {}
        for cliente in clientes.data:
            origen = cliente.get("origen_cliente") or "Sin especificar"
            origenes[origen] = origenes.get(origen, 0) + 1
        
        return {
            "total_clientes": total.count,
            "mis_clientes": mis_clientes.count,
            "distribucion_por_origen": origenes
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener estadísticas: {str(e)}")
