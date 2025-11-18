# 🚀 Guía Rápida - Inicialización del Sistema

## 📋 Pasos para iniciar el sistema desde cero

### 1️⃣ Crear las tablas en Supabase

1. Ve a tu proyecto de Supabase: https://supabase.com/dashboard/project/aauxfutunkzenltnvggf
2. Entra al **SQL Editor**
3. Copia todo el contenido de `Backend/Database.md`
4. Pégalo y ejecuta (**Run**)
5. ✅ Verás 14 tablas creadas

---

### 2️⃣ Insertar datos iniciales

**Ejecuta en SQL Editor:**

```sql
-- Script: Backend/init_primer_usuario.sql
```

Este script inserta:
- ✅ 3 Roles (si no los tienes)
- ✅ 1 Empleado (Broker/Admin)
- ✅ 1 Usuario (broker_admin)

**Credenciales:**
- **Usuario:** `broker_admin`
- **Contraseña:** `password123`
- **Rol:** Bróker (Administrador)

---

### 3️⃣ (Opcional) Insertar más usuarios de prueba

Si quieres más usuarios para probar:

```sql
-- Script: Backend/datos_prueba_adicionales.sql
```

Esto agregará:
- ✅ 4 empleados más
- ✅ 4 usuarios más (1 secretaria + 3 asesores)

**Todos con contraseña:** `password123`

---

### 4️⃣ Probar la API

#### A) Hacer Login

1. Ve a http://localhost:8000/docs
2. Busca `POST /api/usuarios/login`
3. Click en **"Try it out"**
4. Completa:
   - **username:** `broker_admin`
   - **password:** `password123`
5. Click en **"Execute"**
6. 📋 **Copia el `access_token`**

#### B) Autorizar en Swagger

1. Click en el botón **"Authorize" 🔓** (arriba a la derecha)
2. Pega tu token en el campo
3. Click en **"Authorize"**
4. ✅ ¡Ahora puedes usar todos los endpoints!

---

### 5️⃣ Crear más usuarios desde la API

Ahora que estás autenticado, puedes usar:

**`POST /api/usuarios/`** para crear nuevos usuarios

**Ejemplo:**
```json
{
  "ci_empleado": "99887766",
  "id_rol": 3,
  "nombre_usuario": "nuevo_asesor",
  "contrasenia_usuario": "MiPassword123!"
}
```

**Nota:** Primero debes crear el empleado con ese CI en la tabla `Empleado`.

---

## 📊 Resumen de Usuarios de Prueba

| Usuario | Contraseña | Rol | CI |
|---------|-----------|-----|-----|
| `broker_admin` | `password123` | Bróker | 12345678 |
| `secretaria_maria` | `password123` | Secretaria | 87654321 |
| `asesor_juan` | `password123` | Asesor | 11223344 |
| `asesor_ana` | `password123` | Asesor | 44332211 |
| `asesor_luis` | `password123` | Asesor | 55667788 |

---

## ⚠️ Importante

- **Cambia las contraseñas** después del primer login en producción
- Las contraseñas están hasheadas con bcrypt
- El hash `$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqNGkrJ7CO` = `password123`

---

## 🎯 Próximos Pasos

Una vez que tengas usuarios funcionando:

1. ✅ Crear CRUD de Empleados
2. ✅ Crear CRUD de Roles
3. ✅ Crear CRUD de Clientes
4. ✅ Crear CRUD de Propietarios
5. ✅ Crear CRUD de Propiedades
6. ✅ Sistema de visitas
7. ✅ Reportes y estadísticas

---

## 🔧 Comandos útiles

```powershell
# Activar entorno virtual
.\.venv\Scripts\activate

# Ejecutar servidor
cd Backend
uvicorn app.main:app --reload

# Acceder a la documentación
# http://localhost:8000/docs
```
