"""
Dependencias reutilizables para los endpoints
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.database import get_supabase_client
from app.utils.security import decode_access_token
from app.schemas.usuario import TokenData
from typing import Optional

# Esquema de autenticación OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/usuarios/login")


async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Obtiene el usuario actual desde el token JWT
    
    Args:
        token: Token JWT del usuario
    
    Returns:
        Datos del usuario actual
    
    Raises:
        HTTPException: Si el token es inválido o el usuario no existe
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Decodificar token
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    usuario_id: Optional[str] = payload.get("sub")
    if usuario_id is None:
        raise credentials_exception
    
    token_data = TokenData(usuario_id=usuario_id)
    
    # Buscar usuario en la base de datos
    supabase = get_supabase_client()
    try:
        response = supabase.table("usuario").select("*").eq("id_usuario", usuario_id).execute()
        
        if not response.data or len(response.data) == 0:
            raise credentials_exception
        
        usuario = response.data[0]
        
        if not usuario.get("es_activo_usuario", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario inactivo"
            )
        
        return usuario
        
    except Exception as e:
        raise credentials_exception


async def get_current_active_user(current_user: dict = Depends(get_current_user)):
    """
    Verifica que el usuario actual esté activo
    
    Args:
        current_user: Usuario obtenido del token
    
    Returns:
        Usuario activo
    
    Raises:
        HTTPException: Si el usuario está inactivo
    """
    if not current_user.get("es_activo_usuario", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario inactivo"
        )
    return current_user
