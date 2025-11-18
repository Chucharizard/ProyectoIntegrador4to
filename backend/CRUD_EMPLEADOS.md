# 📋 CRUD de Empleados - Documentación

## ✅ Endpoints Creados

### **POST `/api/empleados/`** - Crear empleado
Crea un nuevo empleado en el sistema.

**Body:**
```json
{
  "ci_empleado": "99887766",
  "nombres_completo_empleado": "Luis Fernando",
  "apellidos_completo_empleado": "Sánchez Rojas",
  "correo_electronico_empleado": "luis.sanchez@inmobiliaria.com",
  "fecha_nacimiento_empleado": "1987-09-25",
  "telefono_empleado": "75678901"
}
```

---

### **GET `/api/empleados/`** - Listar empleados
Lista todos los empleados del sistema.

**Query params:**
- `skip`: número de registros a omitir (default: 0)
- `limit`: número máximo de registros (default: 100)
- `activos_solo`: solo empleados activos (default: false)

**Ejemplo:**
```
GET /api/empleados/?skip=0&limit=50&activos_solo=true
```

---

### **GET `/api/empleados/{ci_empleado}`** - Obtener empleado
Obtiene un empleado específico por su CI.

**Ejemplo:**
```
GET /api/empleados/12345678
```

---

### **PUT `/api/empleados/{ci_empleado}`** - Actualizar empleado
Actualiza los datos de un empleado existente.

**Body (todos los campos son opcionales):**
```json
{
  "nombres_completo_empleado": "Luis Fernando",
  "apellidos_completo_empleado": "Sánchez Rojas",
  "correo_electronico_empleado": "nuevo.email@inmobiliaria.com",
  "fecha_nacimiento_empleado": "1987-09-25",
  "telefono_empleado": "76543210",
  "es_activo_empleado": true
}
```

---

### **DELETE `/api/empleados/{ci_empleado}`** - Desactivar empleado
Desactiva un empleado (soft delete).

⚠️ **Nota:** No se puede desactivar si tiene usuarios activos asociados.

**Ejemplo:**
```
DELETE /api/empleados/99887766
```

---

## 🔐 Autenticación

Todos los endpoints requieren autenticación con JWT.

**Header requerido:**
```
Authorization: Bearer <tu_token_jwt>
```

O usa el botón **"Authorize"** en Swagger.

---

## 🧪 Pruebas en Swagger

1. Ve a http://localhost:8000/docs
2. Asegúrate de estar autenticado (botón "Authorize")
3. Busca la sección **"Empleados"**
4. Prueba los endpoints

---

## 📊 Validaciones

- ✅ **CI único** - No se pueden crear dos empleados con el mismo CI
- ✅ **Email válido** - Valida formato de correo electrónico
- ✅ **Nombres y apellidos** - Máximo 120 caracteres
- ✅ **Teléfono** - Máximo 20 caracteres
- ✅ **Protección de eliminación** - No se puede desactivar si tiene usuarios activos

---

## 🎯 Flujo típico

1. **Crear empleado** → POST `/api/empleados/`
2. **Crear usuario para ese empleado** → POST `/api/usuarios/`
3. **Listar empleados** → GET `/api/empleados/`
4. **Actualizar datos** → PUT `/api/empleados/{ci}`
5. **Desactivar empleado** → DELETE `/api/empleados/{ci}`

---

## 💡 Ejemplo completo

```json
// 1. Crear empleado
POST /api/empleados/
{
  "ci_empleado": "11223344",
  "nombres_completo_empleado": "Juan Pablo",
  "apellidos_completo_empleado": "Martínez Silva",
  "correo_electronico_empleado": "juan.martinez@inmobiliaria.com",
  "fecha_nacimiento_empleado": "1988-11-10",
  "telefono_empleado": "73456789"
}

// 2. Crear usuario para ese empleado
POST /api/usuarios/
{
  "ci_empleado": "11223344",
  "id_rol": 3,
  "nombre_usuario": "asesor_juan",
  "contrasenia_usuario": "MiPassword123!"
}
```

---

## ✅ Estado del proyecto

- ✅ CRUD de Usuarios completo
- ✅ CRUD de Empleados completo
- ⏳ CRUD de Roles (próximo)
- ⏳ CRUD de Clientes
- ⏳ CRUD de Propiedades
