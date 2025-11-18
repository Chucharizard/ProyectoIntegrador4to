-- ============================================
-- SCRIPT MAESTRO DE INICIALIZACIÓN
-- Sistema Inmobiliario - Seed Data
-- ============================================
-- Ejecutar este script completo en el SQL Editor de Supabase
-- después de haber creado todas las tablas con Database.md

-- ============================================
-- 1. INSERTAR ROLES
-- ============================================
INSERT INTO Rol (nombre_rol, descripcion_rol, es_activo_rol) VALUES
('Bróker', 'Administrador del sistema con acceso total. Gestiona empleados, roles y supervisa todas las operaciones.', true),
('Secretaria', 'Gestiona clientes, propietarios, propiedades, visitas, operaciones, documentos y reportes.', true),
('Asesor Inmobiliario', 'Realiza captaciones, atiende visitas, registra resultados y consulta su rendimiento.', true);

-- ============================================
-- 2. INSERTAR EMPLEADOS
-- ============================================
INSERT INTO Empleado (ci_empleado, nombres_completo_empleado, apellidos_completo_empleado, correo_electronico_empleado, fecha_nacimiento_empleado, telefono_empleado, es_activo_empleado) VALUES
('12345678', 'Carlos Alberto', 'Rodríguez Pérez', 'carlos.rodriguez@inmobiliaria.com', '1985-03-15', '71234567', true),
('87654321', 'María Elena', 'García López', 'maria.garcia@inmobiliaria.com', '1990-07-22', '72345678', true),
('11223344', 'Juan Pablo', 'Martínez Silva', 'juan.martinez@inmobiliaria.com', '1988-11-10', '73456789', true),
('44332211', 'Ana Sofía', 'Fernández Torres', 'ana.fernandez@inmobiliaria.com', '1992-05-18', '74567890', true);

-- ============================================
-- 3. INSERTAR USUARIOS
-- ============================================
-- NOTA: Todas las contraseñas son "password123" (hasheadas con bcrypt)
INSERT INTO Usuario (ci_empleado, id_rol, nombre_usuario, contrasenia_usuario, es_activo_usuario) VALUES
('12345678', 1, 'broker_admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqNGkrJ7CO', true),
('87654321', 2, 'secretaria_maria', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqNGkrJ7CO', true),
('11223344', 3, 'asesor_juan', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqNGkrJ7CO', true),
('44332211', 3, 'asesor_ana', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqNGkrJ7CO', true);

-- ============================================
-- 4. VERIFICACIÓN DE DATOS
-- ============================================

-- Verificar Roles
SELECT 'ROLES INSERTADOS:' as tabla;
SELECT * FROM Rol;

-- Verificar Empleados
SELECT 'EMPLEADOS INSERTADOS:' as tabla;
SELECT * FROM Empleado;

-- Verificar Usuarios con JOIN
SELECT 'USUARIOS INSERTADOS:' as tabla;
SELECT 
    u.id_usuario,
    u.nombre_usuario,
    e.nombres_completo_empleado || ' ' || e.apellidos_completo_empleado as nombre_completo,
    r.nombre_rol,
    u.es_activo_usuario,
    u.fecha_creacion_usuario
FROM Usuario u
JOIN Empleado e ON u.ci_empleado = e.ci_empleado
JOIN Rol r ON u.id_rol = r.id_rol
ORDER BY r.id_rol, u.nombre_usuario;

-- ============================================
-- CREDENCIALES DE PRUEBA
-- ============================================
-- Usuario: broker_admin     | Contraseña: password123 | Rol: Bróker
-- Usuario: secretaria_maria  | Contraseña: password123 | Rol: Secretaria
-- Usuario: asesor_juan       | Contraseña: password123 | Rol: Asesor Inmobiliario
-- Usuario: asesor_ana        | Contraseña: password123 | Rol: Asesor Inmobiliario
-- ============================================
