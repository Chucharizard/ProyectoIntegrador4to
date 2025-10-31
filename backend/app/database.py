"""
Configuración de conexión a Supabase
"""
from supabase import create_client, Client
from app.config import get_settings

settings = get_settings()


def get_supabase_client() -> Client:
    """
    Retorna un cliente de Supabase configurado
    """
    supabase: Client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_KEY
    )
    return supabase
