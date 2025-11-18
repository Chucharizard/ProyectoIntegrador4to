# ⚠️ IMPORTANTE: Nombres de Tablas en PostgreSQL/Supabase

## 🔍 Problema identificado:

PostgreSQL (Supabase) convierte automáticamente los nombres de tablas a **minúsculas** cuando se crean sin comillas dobles.

### Nombres en el código vs Base de datos:

| Script original | Base de datos real |
|----------------|-------------------|
| `Usuario` | `usuario` |
| `Empleado` | `empleado` |
| `Rol` | `rol` |
| `Cliente` | `cliente` |
| `Propietario` | `propietario` |
| etc... | etc... |

---

## ✅ Archivos corregidos:

- ✅ `app/routes/usuarios.py` - Todas las referencias a tablas
- ✅ `app/utils/dependencies.py` - Query de usuario
- ✅ `init_primer_usuario.sql` - Scripts de inserción

---

## 📝 Pasos para aplicar los cambios:

### 1️⃣ Ejecutar el script SQL corregido

Ve a Supabase SQL Editor y ejecuta el script corregido:
```
Backend/init_primer_usuario.sql
```

Ahora usa nombres en **minúsculas**: `rol`, `empleado`, `usuario`

### 2️⃣ Reiniciar el servidor FastAPI

El servidor debería recargarse automáticamente con `--reload`, pero si no:

```powershell
# Detener con Ctrl+C
# Volver a ejecutar:
cd Backend
C:/Users/USUARIO/Downloads/ProyectoInt/.venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000
```

### 3️⃣ Probar el login

Ve a http://localhost:8000/docs

Endpoint: `POST /api/usuarios/login`
- **username**: `broker_admin`
- **password**: `password123`

---

## 🎯 Para futuros scripts SQL:

**Siempre usar minúsculas** en los nombres de tablas:
```sql
INSERT INTO usuario ...
INSERT INTO empleado ...
INSERT INTO rol ...
```

O usar comillas dobles para preservar mayúsculas:
```sql
INSERT INTO "Usuario" ...  -- Así sí mantiene mayúsculas
```

Pero es mejor mantener todo en minúsculas para consistencia.

---

## 📚 Referencia rápida de tablas:

```
rol
empleado
usuario
cliente
propietario
direccion
propiedad
imagenpropiedad
documentopropiedad
citavisita
contratooperacion
pago
desempenoasesor
gananciaempleado
```
