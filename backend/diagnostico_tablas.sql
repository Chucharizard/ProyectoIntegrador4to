-- ============================================
-- DIAGNÓSTICO COMPLETO DE TABLAS
-- ============================================
-- Ejecuta este script en Supabase para diagnosticar el problema

-- 1. Ver TODAS las tablas del esquema public
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Ver específicamente las tablas que necesitamos
SELECT 
    CASE 
        WHEN table_name = 'rol' OR table_name = 'Rol' THEN '✅ Rol encontrada'
        ELSE 'Nombre: ' || table_name
    END as estado_rol
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (LOWER(table_name) = 'rol');

SELECT 
    CASE 
        WHEN table_name = 'empleado' OR table_name = 'Empleado' THEN '✅ Empleado encontrada'
        ELSE 'Nombre: ' || table_name
    END as estado_empleado
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (LOWER(table_name) = 'empleado');

SELECT 
    CASE 
        WHEN table_name = 'usuario' OR table_name = 'Usuario' THEN '✅ Usuario encontrada'
        ELSE 'Nombre: ' || table_name
    END as estado_usuario
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (LOWER(table_name) = 'usuario');

-- 3. Contar cuántas tablas hay en total
SELECT COUNT(*) as total_tablas
FROM information_schema.tables 
WHERE table_schema = 'public';

-- ============================================
-- RESPONDE ESTAS PREGUNTAS:
-- ============================================
-- ¿Cuántas tablas aparecen en el resultado?
-- ¿Ves las tablas rol, empleado, usuario?
-- ¿En qué caso están los nombres (mayúsculas/minúsculas)?
-- ============================================
