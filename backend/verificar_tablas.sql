-- ============================================
-- VERIFICACIÓN DE TABLAS
-- ============================================
-- Ejecuta este script PRIMERO para verificar que las tablas existen

-- Ver todas las tablas en el esquema public
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verificar tablas específicas necesarias
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Rol') 
        THEN '✅ Tabla Rol existe'
        ELSE '❌ Tabla Rol NO existe'
    END as estado_rol,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Empleado') 
        THEN '✅ Tabla Empleado existe'
        ELSE '❌ Tabla Empleado NO existe'
    END as estado_empleado,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Usuario') 
        THEN '✅ Tabla Usuario existe'
        ELSE '❌ Tabla Usuario NO existe'
    END as estado_usuario;

-- ============================================
-- SI LAS TABLAS NO EXISTEN:
-- ============================================
-- 1. Ve al archivo Database.md
-- 2. Copia TODO el contenido
-- 3. Pégalo en el SQL Editor de Supabase
-- 4. Ejecuta con RUN
-- 5. Vuelve a ejecutar este script para verificar
-- ============================================
