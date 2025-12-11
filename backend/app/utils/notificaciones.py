"""
Utilidad para enviar notificaciones push usando Expo Push Notifications
"""
import requests
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


def enviar_notificacion_expo(
    tokens: List[str],
    titulo: str,
    mensaje: str,
    data: Optional[Dict] = None
) -> Dict:
    """
    Envía notificaciones push a través de Expo Push Notification Service.
    
    Args:
        tokens: Lista de Expo Push Tokens de los dispositivos destinatarios
        titulo: Título de la notificación
        mensaje: Cuerpo del mensaje
        data: Datos adicionales para enviar con la notificación
    
    Returns:
        Dict con el resultado del envío
    """
    if not tokens:
        logger.warning("No se proporcionaron tokens para enviar notificación")
        return {"success": False, "error": "No tokens provided"}
    
    # Filtrar tokens inválidos (deben comenzar con ExponentPushToken[)
    tokens_validos = [
        token for token in tokens 
        if token and token.startswith("ExponentPushToken[")
    ]
    
    if not tokens_validos:
        logger.warning(f"No hay tokens válidos. Tokens recibidos: {tokens}")
        return {"success": False, "error": "No valid Expo tokens"}
    
    # Preparar mensajes para cada token
    mensajes = []
    for token in tokens_validos:
        mensaje_obj = {
            "to": token,
            "sound": "default",
            "title": titulo,
            "body": mensaje,
            "priority": "high",
            "channelId": "citas"
        }
        
        if data:
            mensaje_obj["data"] = data
        
        mensajes.append(mensaje_obj)
    
    try:
        response = requests.post(
            EXPO_PUSH_URL,
            json=mensajes,
            headers={
                "Accept": "application/json",
                "Accept-encoding": "gzip, deflate",
                "Content-Type": "application/json"
            },
            timeout=10
        )
        
        response.raise_for_status()
        result = response.json()
        
        logger.info(f"✅ Notificaciones enviadas: {len(tokens_validos)} tokens")
        return {"success": True, "data": result}
    
    except requests.exceptions.RequestException as e:
        logger.error(f"Error al enviar notificación: {e}")
        return {"success": False, "error": str(e)}


def notificar_cita_nueva(supabase, id_cita: str, id_asesor: str):
    """
    Envía notificación al asesor sobre una nueva cita asignada.
    """
    try:
        # Obtener datos de la cita
        cita = supabase.table("citavisita")\
            .select("*, propiedad(titulo_propiedad, codigo_publico_propiedad)")\
            .eq("id_cita", id_cita)\
            .single()\
            .execute()
        
        if not cita.data:
            logger.warning(f"Cita {id_cita} no encontrada")
            return {"success": False, "error": "Cita no encontrada"}
        
        # Obtener token del asesor
        usuario = supabase.table("usuario")\
            .select("expo_push_token")\
            .eq("id_usuario", id_asesor)\
            .single()\
            .execute()
        
        if not usuario.data or not usuario.data.get("expo_push_token"):
            logger.info(f"Asesor {id_asesor} no tiene token de notificaciones registrado")
            return {"success": False, "error": "No push token"}
        
        # Formatear fecha
        from datetime import datetime
        fecha_cita = datetime.fromisoformat(cita.data["fecha_visita_cita"].replace("Z", "+00:00"))
        fecha_formateada = fecha_cita.strftime("%d/%m/%Y %H:%M")
        
        propiedad_titulo = cita.data.get("propiedad", {}).get("titulo_propiedad", "Propiedad")
        
        # Enviar notificación
        return enviar_notificacion_expo(
            tokens=[usuario.data["expo_push_token"]],
            titulo="🆕 Nueva cita asignada",
            mensaje=f"{propiedad_titulo} - {fecha_formateada}",
            data={
                "tipo": "cita_nueva",
                "id_cita": id_cita,
                "fecha_visita": cita.data["fecha_visita_cita"]
            }
        )
    
    except Exception as e:
        logger.error(f"Error al notificar cita nueva: {e}")
        return {"success": False, "error": str(e)}


def notificar_cita_reprogramada(supabase, id_cita: str, id_asesor: str):
    """
    Envía notificación al asesor sobre una cita reprogramada.
    """
    try:
        # Obtener datos de la cita
        cita = supabase.table("citavisita")\
            .select("*, propiedad(titulo_propiedad, codigo_publico_propiedad)")\
            .eq("id_cita", id_cita)\
            .single()\
            .execute()
        
        if not cita.data:
            return {"success": False, "error": "Cita no encontrada"}
        
        # Obtener token del asesor
        usuario = supabase.table("usuario")\
            .select("expo_push_token")\
            .eq("id_usuario", id_asesor)\
            .single()\
            .execute()
        
        if not usuario.data or not usuario.data.get("expo_push_token"):
            return {"success": False, "error": "No push token"}
        
        # Formatear fecha
        from datetime import datetime
        fecha_cita = datetime.fromisoformat(cita.data["fecha_visita_cita"].replace("Z", "+00:00"))
        fecha_formateada = fecha_cita.strftime("%d/%m/%Y %H:%M")
        
        propiedad_titulo = cita.data.get("propiedad", {}).get("titulo_propiedad", "Propiedad")
        
        # Enviar notificación
        return enviar_notificacion_expo(
            tokens=[usuario.data["expo_push_token"]],
            titulo="🔄 Cita reprogramada",
            mensaje=f"{propiedad_titulo} - Nueva fecha: {fecha_formateada}",
            data={
                "tipo": "cita_reprogramada",
                "id_cita": id_cita,
                "fecha_visita": cita.data["fecha_visita_cita"]
            }
        )
    
    except Exception as e:
        logger.error(f"Error al notificar cita reprogramada: {e}")
        return {"success": False, "error": str(e)}
