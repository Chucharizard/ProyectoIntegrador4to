"""
Router para endpoints de Usuarios
"""
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from typing import List
from datetime import timedelta
from uuid import UUID

from app.database import get_supabase_client
from app.schemas.usuario import (
    UsuarioCreate,
    UsuarioUpdate,
    UsuarioResponse,
    UsuarioLogin,
    Token,
    TokenWithUser
)
from app.utils.security import (
    get_password_hash,
    verify_password,
    create_access_token
)
from app.utils.dependencies import get_current_active_user
from app.config import get_settings

settings = get_settings()
router = APIRouter()


@router.post("/usuarios/", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
async def crear_usuario(
    usuario: UsuarioCreate,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Crear un nuevo usuario
    Requiere autenticación
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar si el usuario ya existe
        existing = supabase.table("usuario").select("*").eq("nombre_usuario", usuario.nombre_usuario).execute()
        
        if existing.data and len(existing.data) > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre de usuario ya existe"
            )
        
        # Verificar si el empleado existe
        empleado = supabase.table("empleado").select("*").eq("ci_empleado", usuario.ci_empleado).execute()
        
        if not empleado.data or len(empleado.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="El empleado no existe"
            )
        
        # Verificar si el rol existe
        rol = supabase.table("rol").select("*").eq("id_rol", usuario.id_rol).execute()
        
        if not rol.data or len(rol.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="El rol no existe"
            )
        
        # Hash de la contraseña
        hashed_password = get_password_hash(usuario.contrasenia_usuario)
        
        # Crear usuario
        nuevo_usuario = {
            "ci_empleado": usuario.ci_empleado,
            "id_rol": usuario.id_rol,
            "nombre_usuario": usuario.nombre_usuario,
            "contrasenia_usuario": hashed_password,
            "es_activo_usuario": True
        }
        
        response = supabase.table("usuario").insert(nuevo_usuario).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al crear el usuario"
            )
        
        return response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear usuario: {str(e)}"
        )


@router.get("/usuarios/", response_model=List[UsuarioResponse])
async def listar_usuarios(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Listar todos los usuarios
    Requiere autenticación
    """
    supabase = get_supabase_client()
    
    try:
        response = supabase.table("usuario").select("*").range(skip, skip + limit - 1).execute()
        return response.data
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al listar usuarios: {str(e)}"
        )


@router.get("/usuarios/{id_usuario}", response_model=UsuarioResponse)
async def obtener_usuario(
    id_usuario: UUID,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Obtener un usuario por ID
    Requiere autenticación
    """
    supabase = get_supabase_client()
    
    try:
        response = supabase.table("usuario").select("*").eq("id_usuario", str(id_usuario)).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        return response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener usuario: {str(e)}"
        )


@router.put("/usuarios/{id_usuario}", response_model=UsuarioResponse)
async def actualizar_usuario(
    id_usuario: UUID,
    usuario_update: UsuarioUpdate,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Actualizar un usuario existente
    Requiere autenticación
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar si el usuario existe
        existing = supabase.table("usuario").select("*").eq("id_usuario", str(id_usuario)).execute()
        
        if not existing.data or len(existing.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        # Preparar datos para actualizar (solo los campos que no son None)
        update_data = {}
        
        if usuario_update.ci_empleado is not None:
            # Verificar si el empleado existe
            empleado = supabase.table("empleado").select("*").eq("ci_empleado", usuario_update.ci_empleado).execute()
            if not empleado.data or len(empleado.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="El empleado no existe"
                )
            update_data["ci_empleado"] = usuario_update.ci_empleado
        
        if usuario_update.id_rol is not None:
            # Verificar si el rol existe
            rol = supabase.table("rol").select("*").eq("id_rol", usuario_update.id_rol).execute()
            if not rol.data or len(rol.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="El rol no existe"
                )
            update_data["id_rol"] = usuario_update.id_rol
        
        if usuario_update.nombre_usuario is not None:
            # Verificar si el nombre de usuario ya existe (en otro usuario)
            nombre_exists = supabase.table("usuario").select("*").eq("nombre_usuario", usuario_update.nombre_usuario).neq("id_usuario", str(id_usuario)).execute()
            if nombre_exists.data and len(nombre_exists.data) > 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El nombre de usuario ya existe"
                )
            update_data["nombre_usuario"] = usuario_update.nombre_usuario
        
        if usuario_update.contrasenia_usuario is not None:
            update_data["contrasenia_usuario"] = get_password_hash(usuario_update.contrasenia_usuario)
        
        if usuario_update.es_activo_usuario is not None:
            update_data["es_activo_usuario"] = usuario_update.es_activo_usuario
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No hay datos para actualizar"
            )
        
        # Actualizar usuario
        response = supabase.table("usuario").update(update_data).eq("id_usuario", str(id_usuario)).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al actualizar usuario"
            )
        
        return response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar usuario: {str(e)}"
        )


@router.delete("/usuarios/{id_usuario}", status_code=status.HTTP_200_OK)
async def desactivar_usuario(
    id_usuario: UUID,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Desactivar un usuario (soft delete)
    Requiere autenticación
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar si el usuario existe
        existing = supabase.table("usuario").select("*").eq("id_usuario", str(id_usuario)).execute()
        
        if not existing.data or len(existing.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        # Desactivar usuario
        response = supabase.table("usuario").update({"es_activo_usuario": False}).eq("id_usuario", str(id_usuario)).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al desactivar usuario"
            )
        
        return {"message": "Usuario desactivado exitosamente", "id_usuario": str(id_usuario)}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al desactivar usuario: {str(e)}"
        )


@router.post("/usuarios/login", response_model=TokenWithUser)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Endpoint de login para autenticación
    Retorna un token JWT y los datos del usuario
    """
    supabase = get_supabase_client()
    
    try:
        # Buscar usuario por nombre de usuario
        response = supabase.table("usuario").select("*").eq("nombre_usuario", form_data.username).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales incorrectas",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        usuario = response.data[0]
        
        # Verificar contraseña
        if not verify_password(form_data.password, usuario["contrasenia_usuario"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales incorrectas",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Verificar que el usuario esté activo
        if not usuario.get("es_activo_usuario", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario inactivo"
            )
        
        # Crear token JWT
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": usuario["id_usuario"]},
            expires_delta=access_token_expires
        )
        
        # Preparar datos del usuario sin contraseña
        user_data = {**usuario}
        user_data.pop('contrasenia_usuario', None)
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en el login: {str(e)}"
        )


@router.get("/usuarios/me/", response_model=UsuarioResponse)
async def obtener_usuario_actual(current_user: dict = Depends(get_current_active_user)):
    """
    Obtener información del usuario autenticado actualmente
    """
    print("🔍 [DEBUG /me] ========== Endpoint /me llamado ==========")
    print(f"📦 [DEBUG /me] current_user keys: {list(current_user.keys())}")
    
    # Remover la contraseña antes de retornar
    user_data = {**current_user}
    user_data.pop('contrasenia_usuario', None)
    
    print(f"✅ [DEBUG /me] user_data sin contraseña, keys: {list(user_data.keys())}")
    print(f"✅ [DEBUG /me] ========== Retornando ==========")
    return user_data
