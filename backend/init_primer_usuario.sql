-- ============================================
-- SCRIPT DE INICIALIZACIÓN COMPLETO
-- Sistema Inmobiliario - Datos Iniciales
-- ============================================
-- Ejecutar este script en el SQL Editor de Supabase
-- después de haber creado las tablas con Database.md

-- ============================================
-- 1. VERIFICAR ROLES (ya deberías tenerlos)
-- ============================================
INSERT INTO rol (nombre_rol, descripcion_rol, es_activo_rol) VALUES
('Bróker', 'Administrador del sistema con acceso total. Gestiona empleados, roles y supervisa todas las operaciones.', true),
('Secretaria', 'Gestiona clientes, propietarios, propiedades, visitas, operaciones, documentos y reportes.', true),
('Asesor Inmobiliario', 'Realiza captaciones, atiende visitas, registra resultados y consulta su rendimiento.', true);
SELECT * FROM rol;

-- Si no tienes los roles, descomenta y ejecuta esto:
/*
INSERT INTO Rol (nombre_rol, descripcion_rol, es_activo_rol) VALUES
('Bróker', 'Administrador del sistema con acceso total. Gestiona empleados, roles y supervisa todas las operaciones.', true),
('Secretaria', 'Gestiona clientes, propietarios, propiedades, visitas, operaciones, documentos y reportes.', true),
('Asesor Inmobiliario', 'Realiza captaciones, atiende visitas, registra resultados y consulta su rendimiento.', true);
*/

-- ============================================
-- 2. INSERTAR EMPLEADO ADMINISTRADOR (BROKER)
-- ============================================

-- Insertar el primer empleado (Broker)
INSERT INTO empleado (
    ci_empleado, 
    nombres_completo_empleado, 
    apellidos_completo_empleado, 
    correo_electronico_empleado, 
    fecha_nacimiento_empleado, 
    telefono_empleado, 
    es_activo_empleado
) VALUES (
    '12345678',
    'Pan',
    'Arancibia',
    'admin@inmobiliaria.com',
    '1985-03-15',
    '71234567',
    true
);

-- Verificar empleado insertado
SELECT * FROM empleado WHERE ci_empleado = '12345678';

-- ============================================
-- 3. INSERTAR USUARIO ADMINISTRADOR (BROKER)
-- ============================================
-- IMPORTANTE: La contraseña es "password123" (ya hasheada con bcrypt)
-- Puedes cambiarla después desde la API

INSERT INTO usuario (
    ci_empleado, 
    id_rol, 
    nombre_usuario, 
    contrasenia_usuario, 
    es_activo_usuario
) VALUES (
    '12345678',
    1,  -- ID del rol Bróker
    'broker_admin',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqNGkrJ7CO',  -- password123 hasheado
    true
);

-- ============================================
-- 4. VERIFICAR TODO
-- ============================================
SELECT 
    u.id_usuario,
    u.nombre_usuario,
    e.nombres_completo_empleado || ' ' || e.apellidos_completo_empleado as nombre_completo,
    e.correo_electronico_empleado,
    r.nombre_rol,
    u.es_activo_usuario,
    u.fecha_creacion_usuario
FROM usuario u
JOIN empleado e ON u.ci_empleado = e.ci_empleado
JOIN rol r ON u.id_rol = r.id_rol
WHERE u.nombre_usuario = 'broker_admin';

-- ============================================
-- ✅ CREDENCIALES DEL PRIMER USUARIO
-- ============================================
-- Usuario:     broker_admin
-- Contraseña:  password123
-- Rol:         Bróker (Administrador)
-- 
-- IMPORTANTE: Cambia esta contraseña después del primer login
-- ============================================
