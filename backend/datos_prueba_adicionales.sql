-- ============================================
-- DATOS DE PRUEBA ADICIONALES (OPCIONAL)
-- Sistema Inmobiliario
-- ============================================
-- Ejecutar DESPUÉS de init_primer_usuario.sql
-- Este script agrega más empleados y usuarios para pruebas

-- ============================================
-- INSERTAR MÁS EMPLEADOS
-- ============================================
INSERT INTO Empleado (ci_empleado, nombres_completo_empleado, apellidos_completo_empleado, correo_electronico_empleado, fecha_nacimiento_empleado, telefono_empleado, es_activo_empleado) VALUES
('87654321', 'María Elena', 'García López', 'maria.garcia@inmobiliaria.com', '1990-07-22', '72345678', true),
('11223344', 'Juan Pablo', 'Martínez Silva', 'juan.martinez@inmobiliaria.com', '1988-11-10', '73456789', true),
('44332211', 'Ana Sofía', 'Fernández Torres', 'ana.fernandez@inmobiliaria.com', '1992-05-18', '74567890', true),
('55667788', 'Luis Fernando', 'Sánchez Rojas', 'luis.sanchez@inmobiliaria.com', '1987-09-25', '75678901', true);

-- ============================================
-- INSERTAR USUARIOS DE PRUEBA
-- ============================================
-- NOTA: Todas las contraseñas son "password123"
INSERT INTO Usuario (ci_empleado, id_rol, nombre_usuario, contrasenia_usuario, es_activo_usuario) VALUES
('87654321', 2, 'secretaria_maria', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqNGkrJ7CO', true),
('11223344', 3, 'asesor_juan', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqNGkrJ7CO', true),
('44332211', 3, 'asesor_ana', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqNGkrJ7CO', true),
('55667788', 3, 'asesor_luis', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqNGkrJ7CO', true);

-- ============================================
-- VERIFICAR TODOS LOS USUARIOS
-- ============================================
SELECT 
    u.id_usuario,
    u.nombre_usuario,
    e.nombres_completo_empleado || ' ' || e.apellidos_completo_empleado as nombre_completo,
    r.nombre_rol,
    u.es_activo_usuario
FROM Usuario u
JOIN Empleado e ON u.ci_empleado = e.ci_empleado
JOIN Rol r ON u.id_rol = r.id_rol
ORDER BY r.id_rol, u.nombre_usuario;

-- ============================================
-- ✅ CREDENCIALES DE TODOS LOS USUARIOS
-- ============================================
-- 1. broker_admin      | password123 | Bróker
-- 2. secretaria_maria  | password123 | Secretaria
-- 3. asesor_juan       | password123 | Asesor Inmobiliario
-- 4. asesor_ana        | password123 | Asesor Inmobiliario
-- 5. asesor_luis       | password123 | Asesor Inmobiliario
-- ============================================
