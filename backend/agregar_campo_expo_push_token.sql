-- Agregar campo para almacenar tokens de notificaciones push de Expo
-- Ejecutar en la consola SQL de Supabase

ALTER TABLE usuario 
ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

-- Crear índice para búsquedas por token
CREATE INDEX IF NOT EXISTS idx_usuario_expo_push_token 
ON usuario(expo_push_token);

COMMENT ON COLUMN usuario.expo_push_token IS 'Token de Expo para notificaciones push en la app móvil';
