# 📋 CRUD de Clientes - Documentación

## ✅ Endpoints Creados

### **POST `/api/clientes/`** - Crear cliente
Crea un nuevo cliente en el sistema.

**Body:**
```json
{
  "ci_cliente": "77665544",
  "nombres_completo_cliente": "Carlos Eduardo",
  "apellidos_completo_cliente": "Rojas Martínez",
  "telefono_cliente": "79876543",
  "correo_electronico_cliente": "carlos.rojas@email.com",
  "preferencia_zona_cliente": "Zona Sur, cerca de colegios",
  "presupuesto_max_cliente": 150000.00,
  "origen_cliente": "Redes sociales"
}
```

**Campos opcionales:**
- `telefono_cliente`
- `correo_electronico_cliente`
- `preferencia_zona_cliente`
- `presupuesto_max_cliente`
- `origen_cliente`

⚡ **Nota:** El `id_usuario_registrador` se asigna automáticamente del usuario autenticado.

---

### **GET `/api/clientes/`** - Listar clientes
Lista todos los clientes del sistema con filtros avanzados.

**Query params:**
- `skip`: número de registros a omitir (default: 0)
- `limit`: número máximo de registros (default: 100)
- `origen`: filtrar por origen del cliente (opcional)
- `zona_preferencia`: buscar por zona de preferencia (opcional)
- `mis_clientes`: solo mis clientes registrados (default: false)

**Ejemplos:**
```
# Todos los clientes
GET /api/clientes/

# Solo mis clientes
GET /api/clientes/?mis_clientes=true

# Clientes de redes sociales
GET /api/clientes/?origen=Redes sociales

# Clientes interesados en Zona Sur
GET /api/clientes/?zona_preferencia=Zona Sur
```

---

### **GET `/api/clientes/{ci_cliente}`** - Obtener cliente
Obtiene un cliente específico por su CI.

**Ejemplo:**
```
GET /api/clientes/77665544
```

---

### **PUT `/api/clientes/{ci_cliente}`** - Actualizar cliente
Actualiza los datos de un cliente existente.

**Body (todos los campos son opcionales):**
```json
{
  "nombres_completo_cliente": "Carlos Eduardo",
  "apellidos_completo_cliente": "Rojas Martínez",
  "telefono_cliente": "79123456",
  "correo_electronico_cliente": "nuevo.email@gmail.com",
  "preferencia_zona_cliente": "Zona Sur o Centro",
  "presupuesto_max_cliente": 180000.00,
  "origen_cliente": "Referido"
}
```

---

### **DELETE `/api/clientes/{ci_cliente}`** - Eliminar cliente
Elimina un cliente del sistema (hard delete).

⚠️ **Nota:** No se puede eliminar si tiene:
- Citas de visita registradas
- Contratos de operación

**Ejemplo:**
```
DELETE /api/clientes/77665544
```

---

### **GET `/api/clientes/estadisticas/resumen`** - Estadísticas de clientes
Obtiene estadísticas generales de clientes.

**Respuesta:**
```json
{
  "total_clientes": 45,
  "mis_clientes": 12,
  "distribucion_por_origen": {
    "Redes sociales": 18,
    "Referido": 15,
    "Walk-in": 8,
    "Sin especificar": 4
  }
}
```

---

## 🔐 Autenticación

Todos los endpoints requieren autenticación con JWT.

**Header requerido:**
```
Authorization: Bearer <tu_token_jwt>
```

---

## 🧪 Pruebas en Swagger

1. Ve a http://localhost:8000/docs
2. Asegúrate de estar autenticado (botón "Authorize")
3. Busca la sección **"Clientes"**
4. Prueba los endpoints

---

## 📊 Validaciones

- ✅ **CI único** - No se pueden crear dos clientes con el mismo CI
- ✅ **Email válido** - Valida formato de correo electrónico (si se proporciona)
- ✅ **Nombres y apellidos** - Máximo 120 caracteres
- ✅ **Teléfono** - Máximo 20 caracteres
- ✅ **Presupuesto** - Decimal con 2 decimales
- ✅ **Usuario registrador** - Se asigna automáticamente
- ✅ **Protección de eliminación** - No se puede eliminar si tiene citas o contratos

---

## 🎯 Flujo típico

1. **Crear cliente** → POST `/api/clientes/`
2. **Ver estadísticas** → GET `/api/clientes/estadisticas/resumen`
3. **Listar mis clientes** → GET `/api/clientes/?mis_clientes=true`
4. **Ver detalle** → GET `/api/clientes/{ci}`
5. **Actualizar presupuesto** → PUT `/api/clientes/{ci}`
6. **Agendar cita** → (próximo módulo)

---

## 💡 Ejemplo completo de uso

```json
// 1. Crear cliente (se registra automáticamente como "mi cliente")
POST /api/clientes/
{
  "ci_cliente": "11223344",
  "nombres_completo_cliente": "Laura Patricia",
  "apellidos_completo_cliente": "Morales Vega",
  "telefono_cliente": "78765432",
  "correo_electronico_cliente": "laura.morales@email.com",
  "preferencia_zona_cliente": "Zona Centro, cerca del trabajo",
  "presupuesto_max_cliente": 200000.00,
  "origen_cliente": "Referido"
}

// 2. Consultar solo mis clientes
GET /api/clientes/?mis_clientes=true

// 3. Actualizar presupuesto después de conversación
PUT /api/clientes/11223344
{
  "presupuesto_max_cliente": 220000.00,
  "preferencia_zona_cliente": "Zona Centro o Sur"
}

// 4. Ver estadísticas
GET /api/clientes/estadisticas/resumen
```

---

## 🔗 Relaciones

El cliente se relaciona con:
- **Usuario** (registrador) - Quién registró al cliente
- **CitaVisita** - Visitas agendadas del cliente
- **ContratoOperacion** - Contratos realizados

---

## 🎨 Campos especiales

### **origen_cliente**
Valores sugeridos:
- "Redes sociales"
- "Referido"
- "Walk-in"
- "Página web"
- "Llamada telefónica"
- "Evento"

### **preferencia_zona_cliente**
Ejemplos:
- "Zona Sur, cerca de colegios"
- "Centro, cerca del trabajo"
- "Zona Norte, tranquilo"
- "Cualquier zona bien comunicada"

### **presupuesto_max_cliente**
- Formato: Decimal(12,2)
- Ejemplo: 150000.00 (150 mil)

---

## 🔍 Filtros avanzados

### **Por origen**
```
GET /api/clientes/?origen=Referido
```

### **Por zona de preferencia**
```
GET /api/clientes/?zona_preferencia=Sur
```
> Búsqueda con ILIKE (case-insensitive, partial match)

### **Mis clientes + paginación**
```
GET /api/clientes/?mis_clientes=true&skip=0&limit=20
```

---

## ✅ Estado del proyecto

- ✅ CRUD de Usuarios completo
- ✅ CRUD de Empleados completo
- ✅ CRUD de Propietarios completo
- ✅ CRUD de Clientes completo
- ⏳ CRUD de Roles (próximo)
- ⏳ CRUD de Direcciones
- ⏳ CRUD de Propiedades
- ⏳ CRUD de Citas de Visita

---

## 🆚 Comparación con otros módulos

| Característica | Empleado | Propietario | Cliente |
|----------------|----------|-------------|---------|
| Soft delete | ✅ | ✅ | ❌ (hard delete) |
| Usuario registrador | ❌ | ❌ | ✅ |
| Filtro "mis registros" | ❌ | ❌ | ✅ |
| Estadísticas | ❌ | ❌ | ✅ |
| Relación principal | → Usuario | → Propiedad | → CitaVisita, Contrato |

---

## 🎯 Endpoint BONUS: Estadísticas

El endpoint de estadísticas te permite:
- Ver el total de clientes en el sistema
- Ver cuántos clientes registraste tú
- Ver la distribución por origen de clientes

Útil para dashboards y reportes. 📊
