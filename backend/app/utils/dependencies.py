from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.database import get_supabase_client
from app.utils.security import decode_access_token
from app.schemas.usuario import TokenData
from typing import Optional, Dict, Any  # ✅ Agregar Dict y Any
from datetime import datetime, timedelta

# Esquema de autenticación OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/usuarios/login")

# ✅ Caché simple de usuarios (en memoria) - CON TIPO
_user_cache: Dict[str, Dict[str, Any]] = {}
USER_CACHE_DURATION = timedelta(minutes=5)

# ✅ Caché de propiedades (en memoria) - CON TIPO
_propiedades_cache: Dict[str, Any] = {"data": None, "timestamp": None}
PROPIEDADES_CACHE_DURATION = timedelta(minutes=2)

def _get_cached_user(usuario_id: str):
    """Obtiene usuario del caché si existe y es válido"""
    if usuario_id in _user_cache:
        cached_data = _user_cache[usuario_id]
        if datetime.now() - cached_data["timestamp"] < USER_CACHE_DURATION:
            print(f"✅ [CACHE] Usuario {usuario_id} encontrado en caché")
            return cached_data["user"]
    return None

def _set_cached_user(usuario_id: str, user: dict):
    """Guarda usuario en caché"""
    _user_cache[usuario_id] = {
        "user": user,
        "timestamp": datetime.now()
    }
    print(f"💾 [CACHE] Usuario {usuario_id} guardado en caché")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Obtiene el usuario actual desde el token JWT con caché"""
    print("🔍 [DEBUG] get_current_user - Token recibido")
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if payload is None:
        print("❌ [ERROR] Token inválido o expirado")
        raise credentials_exception
    
    usuario_id: Optional[str] = payload.get("sub")
    if usuario_id is None:
        print("❌ [ERROR] No se encontró usuario_id en el token")
        raise credentials_exception
    
    print(f"✅ [DEBUG] Usuario ID del token: {usuario_id}")
    
    # Intentar obtener del caché primero
    cached_user = _get_cached_user(usuario_id)
    if cached_user:
        return cached_user
    
    # Si no está en caché, buscar en BD
    supabase = get_supabase_client()
    try:
        print(f"🔍 [DEBUG] Buscando usuario en BD: {usuario_id}")
        response = supabase.table("usuario").select("*").eq("id_usuario", usuario_id).execute()
        
        print(f"📦 [DEBUG] Respuesta de Supabase: {response.data}")
        
        if not response.data or len(response.data) == 0:
            print("❌ [ERROR] Usuario no encontrado en BD")
            raise credentials_exception
        
        usuario = response.data[0]
        print(f"✅ [DEBUG] Usuario encontrado: {usuario.get('nombre_usuario')}, id_rol: {usuario.get('id_rol')}")
        
        if not usuario.get("es_activo_usuario", False):
            print("❌ [ERROR] Usuario inactivo")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario inactivo"
            )
        
        # Guardar en caché
        _set_cached_user(usuario_id, usuario)
        
        print("✅ [DEBUG] Usuario activo, retornando datos")
        return usuario
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [ERROR] Excepción al buscar usuario: {str(e)}")
        raise credentials_exception

async def get_current_active_user(current_user: dict = Depends(get_current_user)):
    """Verifica que el usuario actual esté activo"""
    if not current_user.get("es_activo_usuario", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario inactivo"
        )
    return current_user

def invalidate_user_cache(usuario_id: str):
    """Invalida el caché de un usuario específico"""
    if usuario_id in _user_cache:
        del _user_cache[usuario_id]
        print(f"🗑️ [CACHE] Caché del usuario {usuario_id} invalidado")

# ✅ Funciones de caché para propiedades
def get_propiedades_cached():
    """Obtiene propiedades del caché si existe y es válido"""
    global _propiedades_cache
    now = datetime.now()
    
    if (_propiedades_cache["data"] is not None and 
        _propiedades_cache["timestamp"] is not None and
        now - _propiedades_cache["timestamp"] < PROPIEDADES_CACHE_DURATION):
        print("✅ [PROPIEDADES CACHE] Usando caché")
        return _propiedades_cache["data"]
    
    return None

def set_propiedades_cached(data):
    """Guarda propiedades en caché"""
    global _propiedades_cache
    _propiedades_cache["data"] = data
    _propiedades_cache["timestamp"] = datetime.now()
    print("💾 [PROPIEDADES CACHE] Guardado en caché")

def clear_propiedades_cache():
    """Invalida el caché de propiedades"""
    global _propiedades_cache
    _propiedades_cache["data"] = None
    _propiedades_cache["timestamp"] = None
    print("🗑️ [PROPIEDADES CACHE] Caché limpiado")
