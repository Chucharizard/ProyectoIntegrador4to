from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import date
from decimal import Decimal
from app.schemas.contrato_operacion import ContratoOperacionCreate, ContratoOperacionUpdate, ContratoOperacionResponse
from app.database import get_supabase_client
from app.utils.dependencies import get_current_active_user

router = APIRouter()


async def generar_ganancias_empleados(supabase, id_propiedad: str, id_usuario_colocador: str, precio_cierre: float, fecha_cierre: date):
    """
    Genera los registros de ganancia para el asesor captador y colocador cuando un contrato se activa.
    
    Args:
        supabase: Cliente de Supabase
        id_propiedad: ID de la propiedad
        id_usuario_colocador: ID del usuario que colocó (cerró la operación)
        precio_cierre: Precio final del contrato
        fecha_cierre: Fecha del cierre
    """
    try:
        # Obtener datos de la propiedad (incluye id_usuario_captador y porcentajes)
        propiedad = supabase.table("propiedad").select(
            "id_usuario_captador, porcentaje_captacion_propiedad, porcentaje_colocacion_propiedad, tipo_operacion_propiedad"
        ).eq("id_propiedad", id_propiedad).execute()
        
        if not propiedad.data:
            raise HTTPException(status_code=404, detail="Propiedad no encontrada")
        
        prop_data = propiedad.data[0]
        id_usuario_captador = prop_data.get("id_usuario_captador")
        porcentaje_captacion = float(prop_data.get("porcentaje_captacion_propiedad") or 0)
        porcentaje_colocacion = float(prop_data.get("porcentaje_colocacion_propiedad") or 0)
        tipo_operacion = prop_data.get("tipo_operacion_propiedad")
        
        # Verificar que existan los porcentajes y usuarios
        if not id_usuario_captador:
            raise HTTPException(status_code=400, detail="La propiedad no tiene usuario captador asignado")
        
        if porcentaje_captacion <= 0 or porcentaje_colocacion <= 0:
            raise HTTPException(status_code=400, detail="Los porcentajes de captación y colocación deben ser mayores a 0")
        
        # Calcular ganancias
        dinero_captacion = (precio_cierre * porcentaje_captacion) / 100
        dinero_colocacion = (precio_cierre * porcentaje_colocacion) / 100
        
        # Verificar si ya existen ganancias para evitar duplicados
        ganancias_existentes = supabase.table("gananciaempleado").select("id_ganancia").eq(
            "id_propiedad", id_propiedad
        ).eq("esta_concretado_ganancia", False).execute()
        
        if ganancias_existentes.data and len(ganancias_existentes.data) > 0:
            # Ya existen ganancias pendientes, no crear duplicados
            return
        
        # Preparar registros de ganancia
        ganancias = []
        
        # Ganancia del captador
        ganancia_captador = {
            "id_propiedad": id_propiedad,
            "id_usuario_empleado": id_usuario_captador,
            "tipo_operacion_ganancia": "Captación",
            "porcentaje_ganado_ganancia": porcentaje_captacion,
            "dinero_ganado_ganancia": dinero_captacion,
            "esta_concretado_ganancia": False,
            "fecha_cierre_ganancia": fecha_cierre.isoformat() if isinstance(fecha_cierre, date) else fecha_cierre
        }
        ganancias.append(ganancia_captador)
        
        # Ganancia del colocador (solo si es diferente al captador)
        if id_usuario_colocador != id_usuario_captador:
            ganancia_colocador = {
                "id_propiedad": id_propiedad,
                "id_usuario_empleado": id_usuario_colocador,
                "tipo_operacion_ganancia": "Colocación",
                "porcentaje_ganado_ganancia": porcentaje_colocacion,
                "dinero_ganado_ganancia": dinero_colocacion,
                "esta_concretado_ganancia": False,
                "fecha_cierre_ganancia": fecha_cierre.isoformat() if isinstance(fecha_cierre, date) else fecha_cierre
            }
            ganancias.append(ganancia_colocador)
        else:
            # Si es la misma persona, crear una sola ganancia con "Ambas"
            ganancias[0]["tipo_operacion_ganancia"] = "Ambas"
            ganancias[0]["porcentaje_ganado_ganancia"] = porcentaje_captacion + porcentaje_colocacion
            ganancias[0]["dinero_ganado_ganancia"] = dinero_captacion + dinero_colocacion
        
        # Insertar ganancias
        result = supabase.table("gananciaempleado").insert(ganancias).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al generar ganancias de empleados")
        
        return result.data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar ganancias: {str(e)}")


@router.post("/contratos/", response_model=ContratoOperacionResponse, status_code=201)
async def crear_contrato(
    contrato: ContratoOperacionCreate,
    current_user = Depends(get_current_active_user)
):
    """
    Crea un nuevo contrato de operación (Venta/Alquiler).
    
    - **id_propiedad**: Propiedad involucrada
    - **ci_cliente**: Cliente que adquiere/alquila
    - **id_usuario_colocador**: Usuario que cerró la operación
    - **tipo_operacion_contrato**: Venta, Alquiler, Anticrético, Traspaso
    - **fecha_inicio_contrato**: Fecha de inicio del contrato
    - **fecha_fin_contrato**: Fecha de finalización (opcional, requerido para alquileres)
    - **estado_contrato**: Borrador, Activo, Finalizado, Cancelado
    - **modalidad_pago_contrato**: Contado, Cuotas, Financiado, etc.
    - **precio_cierre_contrato**: Precio final acordado
    - **fecha_cierre_contrato**: Fecha en que se cerró el negocio
    - **observaciones_contrato**: Notas adicionales
    
    💡 Al crear un contrato, considera actualizar el estado de la propiedad a "Cerrada"
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que la propiedad existe
        propiedad = supabase.table("propiedad").select("id_propiedad, estado_propiedad, tipo_operacion_propiedad").eq("id_propiedad", contrato.id_propiedad).execute()
        if not propiedad.data:
            raise HTTPException(status_code=404, detail="La propiedad especificada no existe")
        
        # Verificar que la propiedad no esté ya cerrada
        if propiedad.data[0].get("estado_propiedad") == "Cerrada":
            raise HTTPException(status_code=400, detail="La propiedad ya está cerrada")
        
        # Verificar que el cliente existe
        cliente = supabase.table("cliente").select("ci_cliente").eq("ci_cliente", contrato.ci_cliente).execute()
        if not cliente.data:
            raise HTTPException(status_code=404, detail="El cliente especificado no existe")
        
        # Verificar que el usuario colocador existe
        colocador = supabase.table("usuario").select("id_usuario").eq("id_usuario", contrato.id_usuario_colocador).execute()
        if not colocador.data:
            raise HTTPException(status_code=404, detail="El usuario colocador especificado no existe")
        
        # Validar que tipo de operación coincida con la propiedad
        if propiedad.data[0].get("tipo_operacion_propiedad") != contrato.tipo_operacion_contrato:
            raise HTTPException(
                status_code=400, 
                detail=f"El tipo de operación del contrato debe coincidir con el de la propiedad ({propiedad.data[0].get('tipo_operacion_propiedad')})"
            )
        
        # Para alquileres, fecha_fin es obligatoria
        if contrato.tipo_operacion_contrato == "Alquiler" and not contrato.fecha_fin_contrato:
            raise HTTPException(status_code=400, detail="Los contratos de alquiler deben tener fecha de finalización")
        
        # Preparar datos para inserción
        contrato_data = contrato.model_dump()
        
        # Convertir Decimal a float para Supabase
        if contrato_data.get("precio_cierre_contrato"):
            contrato_data["precio_cierre_contrato"] = float(contrato_data["precio_cierre_contrato"])
        
        # Convertir dates a strings
        if contrato_data.get("fecha_inicio_contrato"):
            contrato_data["fecha_inicio_contrato"] = contrato_data["fecha_inicio_contrato"].isoformat()
        if contrato_data.get("fecha_fin_contrato"):
            contrato_data["fecha_fin_contrato"] = contrato_data["fecha_fin_contrato"].isoformat()
        if contrato_data.get("fecha_cierre_contrato"):
            contrato_data["fecha_cierre_contrato"] = contrato_data["fecha_cierre_contrato"].isoformat()
        
        # Insertar contrato
        result = supabase.table("contratooperacion").insert(contrato_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al crear el contrato")
        
        # Si el contrato está activo, actualizar la propiedad a cerrada y generar ganancias
        if contrato.estado_contrato == "Activo":
            supabase.table("propiedad").update({
                "estado_propiedad": "Cerrada",
                "fecha_cierre_propiedad": date.today().isoformat(),
                "id_usuario_colocador": contrato.id_usuario_colocador
            }).eq("id_propiedad", contrato.id_propiedad).execute()
            
            # Generar ganancias para captador y colocador
            await generar_ganancias_empleados(
                supabase=supabase,
                id_propiedad=contrato.id_propiedad,
                id_usuario_colocador=contrato.id_usuario_colocador,
                precio_cierre=float(contrato.precio_cierre_contrato),
                fecha_cierre=contrato.fecha_cierre_contrato or date.today()
            )
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/contratos/", response_model=List[ContratoOperacionResponse])
async def listar_contratos(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    estado: Optional[str] = Query(None, description="Filtrar por estado"),
    tipo_operacion: Optional[str] = Query(None, description="Filtrar por tipo de operación"),
    ci_cliente: Optional[str] = Query(None, description="Filtrar por cliente"),
    id_usuario_colocador: Optional[str] = Query(None, description="Filtrar por colocador"),
    current_user = Depends(get_current_active_user)
):
    """
    Lista todos los contratos con filtros opcionales.
    
    Filtros disponibles:
    - **estado**: Borrador, Activo, Finalizado, Cancelado
    - **tipo_operacion**: Venta, Alquiler, Anticrético, Traspaso
    - **ci_cliente**: CI del cliente
    - **id_usuario_colocador**: ID del usuario que cerró la operación
    """
    supabase = get_supabase_client()
    
    try:
        query = supabase.table("contratooperacion").select("*")
        
        if estado:
            query = query.eq("estado_contrato", estado)
        if tipo_operacion:
            query = query.eq("tipo_operacion_contrato", tipo_operacion)
        if ci_cliente:
            query = query.eq("ci_cliente", ci_cliente)
        if id_usuario_colocador:
            query = query.eq("id_usuario_colocador", id_usuario_colocador)
        
        query = query.order("fecha_cierre_contrato", desc=True).range(skip, skip + limit - 1)
        result = query.execute()
        
        return result.data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al listar contratos: {str(e)}")


@router.get("/contratos/{id_contrato}", response_model=ContratoOperacionResponse)
async def obtener_contrato(
    id_contrato: str,
    current_user = Depends(get_current_active_user)
):
    """
    Obtiene los detalles de un contrato específico por su ID.
    """
    supabase = get_supabase_client()
    
    try:
        result = supabase.table("contratooperacion").select("*").eq("id_contrato_operacion", id_contrato).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Contrato no encontrado")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener el contrato: {str(e)}")


@router.put("/contratos/{id_contrato}", response_model=ContratoOperacionResponse)
async def actualizar_contrato(
    id_contrato: str,
    contrato: ContratoOperacionUpdate,
    current_user = Depends(get_current_active_user)
):
    """
    Actualiza los datos de un contrato existente.
    
    ⚠️ Solo se pueden actualizar contratos en estado "Borrador" o "Activo"
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que el contrato existe
        contrato_actual = supabase.table("contratooperacion").select("*").eq("id_contrato_operacion", id_contrato).execute()
        if not contrato_actual.data:
            raise HTTPException(status_code=404, detail="Contrato no encontrado")
        
        # No permitir editar contratos finalizados o cancelados
        if contrato_actual.data[0].get("estado_contrato") in ["Finalizado", "Cancelado"]:
            raise HTTPException(status_code=400, detail="No se pueden editar contratos finalizados o cancelados")
        
        # Preparar datos para actualización (solo campos no None)
        contrato_data = contrato.model_dump(exclude_unset=True)
        
        if not contrato_data:
            raise HTTPException(status_code=400, detail="No se proporcionaron datos para actualizar")
        
        # Convertir Decimal a float
        if "precio_cierre_contrato" in contrato_data and contrato_data["precio_cierre_contrato"]:
            contrato_data["precio_cierre_contrato"] = float(contrato_data["precio_cierre_contrato"])
        
        # Convertir dates a strings
        for field in ["fecha_inicio_contrato", "fecha_fin_contrato", "fecha_cierre_contrato"]:
            if field in contrato_data and contrato_data[field]:
                contrato_data[field] = contrato_data[field].isoformat()
        
        # Detectar si el estado cambió a "Activo"
        estado_anterior = contrato_actual.data[0].get("estado_contrato")
        estado_nuevo = contrato_data.get("estado_contrato")
        
        # Actualizar
        result = supabase.table("contratooperacion").update(contrato_data).eq("id_contrato_operacion", id_contrato).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al actualizar el contrato")
        
        # Si el contrato cambió a estado "Activo", generar ganancias y cerrar propiedad
        if estado_nuevo == "Activo" and estado_anterior != "Activo":
            contrato_actualizado = result.data[0]
            
            # Cerrar la propiedad
            supabase.table("propiedad").update({
                "estado_propiedad": "Cerrada",
                "fecha_cierre_propiedad": date.today().isoformat(),
                "id_usuario_colocador": contrato_actualizado.get("id_usuario_colocador")
            }).eq("id_propiedad", contrato_actualizado.get("id_propiedad")).execute()
            
            # Generar ganancias
            await generar_ganancias_empleados(
                supabase=supabase,
                id_propiedad=contrato_actualizado.get("id_propiedad"),
                id_usuario_colocador=contrato_actualizado.get("id_usuario_colocador"),
                precio_cierre=float(contrato_actualizado.get("precio_cierre_contrato")),
                fecha_cierre=contrato_actualizado.get("fecha_cierre_contrato") or date.today()
            )
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar el contrato: {str(e)}")


@router.delete("/contratos/{id_contrato}", status_code=204)
async def eliminar_contrato(
    id_contrato: str,
    current_user = Depends(get_current_active_user)
):
    """
    Elimina un contrato.
    
    ⚠️ Esto también eliminará todos los pagos asociados (CASCADE).
    Solo se pueden eliminar contratos en estado "Borrador" o "Cancelado".
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que el contrato existe
        contrato = supabase.table("contratooperacion").select("estado_contrato").eq("id_contrato_operacion", id_contrato).execute()
        if not contrato.data:
            raise HTTPException(status_code=404, detail="Contrato no encontrado")
        
        # Solo permitir eliminar borradores o cancelados
        if contrato.data[0].get("estado_contrato") not in ["Borrador", "Cancelado"]:
            raise HTTPException(status_code=400, detail="Solo se pueden eliminar contratos en estado Borrador o Cancelado")
        
        # Eliminar
        result = supabase.table("contratooperacion").delete().eq("id_contrato_operacion", id_contrato).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al eliminar el contrato")
        
        return None
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al eliminar el contrato: {str(e)}")


@router.get("/contratos/{id_contrato}/resumen")
async def resumen_contrato(
    id_contrato: str,
    current_user = Depends(get_current_active_user)
):
    """
    Obtiene un resumen completo del contrato incluyendo:
    - Datos del contrato
    - Información de la propiedad
    - Información del cliente
    - Lista de pagos asociados
    - Total pagado vs precio del contrato
    """
    supabase = get_supabase_client()
    
    try:
        # Obtener contrato
        contrato = supabase.table("contratooperacion").select("*").eq("id_contrato_operacion", id_contrato).execute()
        if not contrato.data:
            raise HTTPException(status_code=404, detail="Contrato no encontrado")
        
        contrato_data = contrato.data[0]
        
        # Obtener propiedad
        propiedad = supabase.table("propiedad").select("titulo_propiedad, tipo_operacion_propiedad, precio_publicado_propiedad").eq("id_propiedad", contrato_data["id_propiedad"]).execute()
        
        # Obtener cliente
        cliente = supabase.table("cliente").select("nombres_completo_cliente, apellidos_completo_cliente, telefono_cliente").eq("ci_cliente", contrato_data["ci_cliente"]).execute()
        
        # Obtener pagos
        pagos = supabase.table("pago").select("*").eq("id_contrato_operacion", id_contrato).order("fecha_pago", desc=False).execute()
        
        # Calcular total pagado
        total_pagado = sum(float(p["monto_pago"]) for p in pagos.data)
        precio_contrato = float(contrato_data["precio_cierre_contrato"])
        saldo_pendiente = precio_contrato - total_pagado
        
        return {
            "contrato": contrato_data,
            "propiedad": propiedad.data[0] if propiedad.data else None,
            "cliente": cliente.data[0] if cliente.data else None,
            "pagos": pagos.data,
            "resumen_financiero": {
                "precio_contrato": precio_contrato,
                "total_pagado": total_pagado,
                "saldo_pendiente": saldo_pendiente,
                "porcentaje_pagado": (total_pagado / precio_contrato * 100) if precio_contrato > 0 else 0,
                "numero_pagos": len(pagos.data)
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener resumen: {str(e)}")
