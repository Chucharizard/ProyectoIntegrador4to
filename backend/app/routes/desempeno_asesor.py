from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from app.schemas.desempeno_asesor import DesempenoAsesorCreate, DesempenoAsesorUpdate, DesempenoAsesorResponse
from app.database import get_supabase_client
from app.utils.dependencies import get_current_active_user

router = APIRouter()


@router.post("/desempeno/", response_model=DesempenoAsesorResponse, status_code=201)
async def registrar_desempeno(
    desempeno: DesempenoAsesorCreate,
    current_user = Depends(get_current_active_user)
):
    """
    Registra el desempeño de un asesor para un periodo específico.
    
    - **id_usuario_asesor**: ID del asesor
    - **periodo_desempeno**: Periodo (Ej: "2025-01", "2025-Q1", "2025")
    - **captaciones_desempeno**: Número de propiedades captadas
    - **publicaciones_desempeno**: Número de propiedades publicadas
    - **visitas_agendadas_desempeno**: Número de visitas agendadas
    - **operaciones_cerradas_desempeno**: Número de operaciones cerradas
    - **tiempo_promedio_cierre_dias_desempeno**: Tiempo promedio de cierre en días
    
    💡 Formatos de periodo válidos: YYYY-MM, YYYY-Q1, YYYY
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que el asesor existe
        asesor = supabase.table("usuario").select("id_usuario").eq("id_usuario", desempeno.id_usuario_asesor).execute()
        if not asesor.data:
            raise HTTPException(status_code=404, detail="El asesor especificado no existe")
        
        # Verificar que no exista un registro para este asesor y periodo
        existing = supabase.table("desempenoasesor").select("id_desempeno").eq("id_usuario_asesor", desempeno.id_usuario_asesor).eq("periodo_desempeno", desempeno.periodo_desempeno).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail=f"Ya existe un registro de desempeño para este asesor en el periodo {desempeno.periodo_desempeno}")
        
        # Preparar datos para inserción
        desempeno_data = desempeno.model_dump()
        
        # Insertar desempeño
        result = supabase.table("desempenoasesor").insert(desempeno_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al registrar el desempeño")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/desempeno/", response_model=List[DesempenoAsesorResponse])
async def listar_desempenos(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    id_usuario_asesor: Optional[str] = Query(None, description="Filtrar por asesor"),
    periodo: Optional[str] = Query(None, description="Filtrar por periodo"),
    current_user = Depends(get_current_active_user)
):
    """
    Lista todos los registros de desempeño con filtros opcionales.
    
    Filtros disponibles:
    - **id_usuario_asesor**: ID del asesor
    - **periodo**: Periodo específico
    """
    supabase = get_supabase_client()
    
    try:
        query = supabase.table("desempenoasesor").select("*")
        
        if id_usuario_asesor:
            query = query.eq("id_usuario_asesor", id_usuario_asesor)
        if periodo:
            query = query.eq("periodo_desempeno", periodo)
        
        query = query.order("periodo_desempeno", desc=True).range(skip, skip + limit - 1)
        result = query.execute()
        
        return result.data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al listar desempeños: {str(e)}")


@router.get("/desempeno/{id_desempeno}", response_model=DesempenoAsesorResponse)
async def obtener_desempeno(
    id_desempeno: str,
    current_user = Depends(get_current_active_user)
):
    """
    Obtiene los detalles de un registro de desempeño específico.
    """
    supabase = get_supabase_client()
    
    try:
        result = supabase.table("desempenoasesor").select("*").eq("id_desempeno", id_desempeno).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Registro de desempeño no encontrado")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener el desempeño: {str(e)}")


@router.put("/desempeno/{id_desempeno}", response_model=DesempenoAsesorResponse)
async def actualizar_desempeno(
    id_desempeno: str,
    desempeno: DesempenoAsesorUpdate,
    current_user = Depends(get_current_active_user)
):
    """
    Actualiza los datos de un registro de desempeño existente.
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que el desempeño existe
        desempeno_actual = supabase.table("desempenoasesor").select("*").eq("id_desempeno", id_desempeno).execute()
        if not desempeno_actual.data:
            raise HTTPException(status_code=404, detail="Registro de desempeño no encontrado")
        
        # Preparar datos para actualización (solo campos no None)
        desempeno_data = desempeno.model_dump(exclude_unset=True)
        
        if not desempeno_data:
            raise HTTPException(status_code=400, detail="No se proporcionaron datos para actualizar")
        
        # Actualizar
        result = supabase.table("desempenoasesor").update(desempeno_data).eq("id_desempeno", id_desempeno).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al actualizar el desempeño")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar el desempeño: {str(e)}")


@router.delete("/desempeno/{id_desempeno}", status_code=204)
async def eliminar_desempeno(
    id_desempeno: str,
    current_user = Depends(get_current_active_user)
):
    """
    Elimina un registro de desempeño.
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que el desempeño existe
        desempeno = supabase.table("desempenoasesor").select("id_desempeno").eq("id_desempeno", id_desempeno).execute()
        if not desempeno.data:
            raise HTTPException(status_code=404, detail="Registro de desempeño no encontrado")
        
        # Eliminar
        result = supabase.table("desempenoasesor").delete().eq("id_desempeno", id_desempeno).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al eliminar el desempeño")
        
        return None
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al eliminar el desempeño: {str(e)}")


@router.get("/desempeno/ranking/asesores")
async def ranking_asesores(
    periodo: Optional[str] = Query(None, description="Filtrar por periodo"),
    top: int = Query(10, ge=1, le=100, description="Número de asesores a mostrar"),
    current_user = Depends(get_current_active_user)
):
    """
    Obtiene un ranking de los mejores asesores basado en operaciones cerradas.
    
    Ordena por número de operaciones cerradas (descendente).
    """
    supabase = get_supabase_client()
    
    try:
        query = supabase.table("desempenoasesor").select("*")
        
        if periodo:
            query = query.eq("periodo_desempeno", periodo)
        
        query = query.order("operaciones_cerradas_desempeno", desc=True).limit(top)
        result = query.execute()
        
        # Enriquecer con datos del asesor
        ranking = []
        for idx, desempeno in enumerate(result.data, 1):
            asesor = supabase.table("usuario").select("nombre_usuario, ci_empleado").eq("id_usuario", desempeno["id_usuario_asesor"]).execute()
            
            ranking.append({
                "posicion": idx,
                "asesor": asesor.data[0] if asesor.data else None,
                "desempeno": desempeno
            })
        
        return {
            "periodo": periodo or "Todos",
            "top": top,
            "ranking": ranking
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener el ranking: {str(e)}")


@router.get("/desempeno/asesor/{id_usuario_asesor}/historico")
async def historico_asesor(
    id_usuario_asesor: str,
    current_user = Depends(get_current_active_user)
):
    """
    Obtiene el histórico completo de desempeño de un asesor.
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que el asesor existe
        asesor = supabase.table("usuario").select("nombre_usuario, ci_empleado").eq("id_usuario", id_usuario_asesor).execute()
        if not asesor.data:
            raise HTTPException(status_code=404, detail="Asesor no encontrado")
        
        # Obtener todos los registros de desempeño
        desempenos = supabase.table("desempenoasesor").select("*").eq("id_usuario_asesor", id_usuario_asesor).order("periodo_desempeno", desc=True).execute()
        
        # Calcular totales
        total_captaciones = sum(d["captaciones_desempeno"] for d in desempenos.data)
        total_publicaciones = sum(d["publicaciones_desempeno"] for d in desempenos.data)
        total_visitas = sum(d["visitas_agendadas_desempeno"] for d in desempenos.data)
        total_operaciones = sum(d["operaciones_cerradas_desempeno"] for d in desempenos.data)
        
        return {
            "asesor": asesor.data[0],
            "total_periodos": len(desempenos.data),
            "resumen_total": {
                "captaciones": total_captaciones,
                "publicaciones": total_publicaciones,
                "visitas": total_visitas,
                "operaciones_cerradas": total_operaciones
            },
            "historico": desempenos.data
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener el histórico: {str(e)}")
