# 📋 CRUD de Propietarios - Documentación

## ✅ Endpoints Creados

### **POST `/api/propietarios/`** - Crear propietario
Crea un nuevo propietario en el sistema.

**Body:**
```json
{
  "ci_propietario": "88776655",
  "nombres_completo_propietario": "Ana María",
  "apellidos_completo_propietario": "González Pérez",
  "fecha_nacimiento_propietario": "1975-03-15",
  "telefono_propietario": "70123456",
  "correo_electronico_propietario": "ana.gonzalez@email.com"
}
```

**Campos opcionales:**
- `fecha_nacimiento_propietario`
- `telefono_propietario`
- `correo_electronico_propietario`

---

### **GET `/api/propietarios/`** - Listar propietarios
Lista todos los propietarios del sistema.

**Query params:**
- `skip`: número de registros a omitir (default: 0)
- `limit`: número máximo de registros (default: 100)
- `activos_solo`: solo propietarios activos (default: false)

**Ejemplo:**
```
GET /api/propietarios/?skip=0&limit=50&activos_solo=true
```

---

### **GET `/api/propietarios/{ci_propietario}`** - Obtener propietario
Obtiene un propietario específico por su CI.

**Ejemplo:**
```
GET /api/propietarios/88776655
```

---

### **PUT `/api/propietarios/{ci_propietario}`** - Actualizar propietario
Actualiza los datos de un propietario existente.

**Body (todos los campos son opcionales):**
```json
{
  "nombres_completo_propietario": "Ana María",
  "apellidos_completo_propietario": "González Pérez",
  "fecha_nacimiento_propietario": "1975-03-15",
  "telefono_propietario": "71234567",
  "correo_electronico_propietario": "nuevo.email@gmail.com",
  "es_activo_propietario": true
}
```

---

### **DELETE `/api/propietarios/{ci_propietario}`** - Desactivar propietario
Desactiva un propietario (soft delete).

⚠️ **Nota:** No se puede desactivar si tiene propiedades activas asociadas.

**Ejemplo:**
```
DELETE /api/propietarios/88776655
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
3. Busca la sección **"Propietarios"**
4. Prueba los endpoints

---

## 📊 Validaciones

- ✅ **CI único** - No se pueden crear dos propietarios con el mismo CI
- ✅ **Email válido** - Valida formato de correo electrónico (si se proporciona)
- ✅ **Nombres y apellidos** - Máximo 120 caracteres
- ✅ **Teléfono** - Máximo 20 caracteres
- ✅ **Protección de eliminación** - No se puede desactivar si tiene propiedades activas

---

## 🎯 Flujo típico

1. **Crear propietario** → POST `/api/propietarios/`
2. **Listar propietarios** → GET `/api/propietarios/`
3. **Ver detalle** → GET `/api/propietarios/{ci}`
4. **Actualizar datos** → PUT `/api/propietarios/{ci}`
5. **Desactivar** → DELETE `/api/propietarios/{ci}`

---

## 💡 Ejemplo completo

```json
// 1. Crear propietario
POST /api/propietarios/
{
  "ci_propietario": "55443322",
  "nombres_completo_propietario": "Roberto Carlos",
  "apellidos_completo_propietario": "Mendoza Silva",
  "fecha_nacimiento_propietario": "1968-07-20",
  "telefono_propietario": "72345678",
  "correo_electronico_propietario": "roberto.mendoza@email.com"
}

// 2. Consultar propietario
GET /api/propietarios/55443322

// 3. Actualizar teléfono
PUT /api/propietarios/55443322
{
  "telefono_propietario": "73456789"
}

// 4. Listar solo activos
GET /api/propietarios/?activos_solo=true
```

---

## 🔗 Relaciones

El propietario se relaciona con:
- **Propiedad** - Un propietario puede tener múltiples propiedades
- La validación de eliminación verifica que no tenga propiedades activas

---

## ✅ Estado del proyecto

- ✅ CRUD de Usuarios completo
- ✅ CRUD de Empleados completo
- ✅ CRUD de Propietarios completo
- ⏳ CRUD de Roles (próximo)
- ⏳ CRUD de Clientes
- ⏳ CRUD de Propiedades
- ⏳ CRUD de Direcciones

---

## 🎨 Diferencias con Empleado

| Característica | Empleado | Propietario |
|----------------|----------|-------------|
| Puede tener usuarios | ✅ Sí | ❌ No |
| Validación al eliminar | Verifica usuarios activos | Verifica propiedades activas |
| Campos únicos | - | - |
| Relación principal | → Usuario | → Propiedad |
