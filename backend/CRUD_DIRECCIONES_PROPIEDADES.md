# 📋 CRUD de Direcciones y Propiedades - Documentación

## 🗺️ CRUD de Direcciones

### **POST `/api/direcciones/`** - Crear dirección
Crea una nueva dirección en el sistema.

**Body:**
```json
{
  "calle_direccion": "Av. Arce #1234",
  "ciudad_direccion": "La Paz",
  "zona_direccion": "Zona Sur",
  "latitud_direccion": -16.5000,
  "longitud_direccion": -68.1500
}
```

---

### **GET `/api/direcciones/`** - Listar direcciones
Lista todas las direcciones con filtros.

**Query params:**
- `skip`: paginación (default: 0)
- `limit`: límite (default: 100)
- `ciudad`: filtrar por ciudad
- `zona`: buscar en zona (parcial)

---

### **GET `/api/direcciones/{id_direccion}`** - Obtener dirección

### **PUT `/api/direcciones/{id_direccion}`** - Actualizar dirección

### **DELETE `/api/direcciones/{id_direccion}`** - Eliminar dirección
⚠️ No se puede eliminar si tiene propiedades asociadas.

---

## 🏠 CRUD de Propiedades

### **POST `/api/propiedades/`** - Crear propiedad

**⭐ OPCIÓN 1: Con dirección existente**
```json
{
  "id_direccion": "uuid-de-direccion-existente",
  "ci_propietario": "12345678",
  "titulo_propiedad": "Departamento 301 - Edificio Torres del Sol",
  "descripcion_propiedad": "Hermoso departamento con vista panorámica",
  "precio_publicado_propiedad": 180000.00,
  "superficie_propiedad": 85.5,
  "tipo_operacion_propiedad": "Venta",
  "estado_propiedad": "Captada",
  "fecha_captacion_propiedad": "2025-10-18"
}
```

**⭐ OPCIÓN 2: Con dirección nueva (anidada)**
```json
{
  "ci_propietario": "12345678",
  "titulo_propiedad": "Casa en Zona Norte",
  "direccion": {
    "calle_direccion": "Av. Montenegro #789",
    "ciudad_direccion": "La Paz",
    "zona_direccion": "Calacoto",
    "latitud_direccion": -16.5234,
    "longitud_direccion": -68.0876
  },
  "descripcion_propiedad": "Casa moderna con jardín",
  "precio_publicado_propiedad": 250000.00,
  "superficie_propiedad": 180.0,
  "tipo_operacion_propiedad": "Venta",
  "estado_propiedad": "Captada"
}
```

**📝 Notas:**
- `id_usuario_captador` se asigna automáticamente del usuario autenticado
- `id_usuario_colocador` es NULL hasta que se cierre la operación
- No puedes proporcionar `id_direccion` Y `direccion` al mismo tiempo

---

### **GET `/api/propiedades/`** - Listar propiedades

**Query params:**
- `skip`: paginación (default: 0)
- `limit`: límite (default: 100)
- `tipo_operacion`: "Venta", "Alquiler", "Anticrético"
- `estado`: "Captada", "Publicada", "Reservada", "Cerrada"
- `precio_min`: precio mínimo
- `precio_max`: precio máximo
- `mis_captaciones`: solo mis propiedades (default: false)

**Ejemplos:**
```
# Propiedades en venta
GET /api/propiedades/?tipo_operacion=Venta&estado=Publicada

# Mis captaciones
GET /api/propiedades/?mis_captaciones=true

# Por rango de precio
GET /api/propiedades/?precio_min=100000&precio_max=200000
```

---

### **GET `/api/propiedades/{id_propiedad}`** - Obtener propiedad
Incluye los datos completos de la dirección.

---

### **PUT `/api/propiedades/{id_propiedad}`** - Actualizar propiedad

**Casos de uso comunes:**

**1. Publicar propiedad:**
```json
{
  "estado_propiedad": "Publicada",
  "fecha_publicacion_propiedad": "2025-10-18"
}
```

**2. Cerrar operación:**
```json
{
  "estado_propiedad": "Cerrada",
  "id_usuario_colocador": "uuid-del-asesor-que-vendió",
  "fecha_cierre_propiedad": "2025-11-15",
  "porcentaje_colocacion_propiedad": 3.5
}
```

**3. Actualizar precio:**
```json
{
  "precio_publicado_propiedad": 195000.00
}
```

---

### **DELETE `/api/propiedades/{id_propiedad}`** - Eliminar propiedad

⚠️ **No se puede eliminar si tiene:**
- Citas de visita registradas
- Contratos de operación

✅ **Se eliminan automáticamente en cascada:**
- Imágenes de la propiedad
- Documentos de la propiedad

---

## 🎯 Flujo de Trabajo Completo

### **Escenario 1: Casa individual (OPCIÓN B - Más simple)**

```json
// 1. Crear propiedad con dirección nueva
POST /api/propiedades/
{
  "ci_propietario": "88776655",
  "titulo_propiedad": "Casa 3 dormitorios Calacoto",
  "direccion": {
    "calle_direccion": "Calle 21 #456",
    "ciudad_direccion": "La Paz",
    "zona_direccion": "Calacoto"
  },
  "precio_publicado_propiedad": 280000.00,
  "tipo_operacion_propiedad": "Venta",
  "estado_propiedad": "Captada"
}

// 2. Publicar
PUT /api/propiedades/{id}
{
  "estado_propiedad": "Publicada",
  "fecha_publicacion_propiedad": "2025-10-20"
}

// 3. Cerrar operación
PUT /api/propiedades/{id}
{
  "estado_propiedad": "Cerrada",
  "id_usuario_colocador": "uuid-asesor",
  "fecha_cierre_propiedad": "2025-11-10"
}
```

---

### **Escenario 2: Edificio con varios departamentos (OPCIÓN A - Reutilizar)**

```json
// 1. Crear dirección del edificio (una sola vez)
POST /api/direcciones/
{
  "calle_direccion": "Av. Arce #1234 - Edificio Torres del Sol",
  "ciudad_direccion": "La Paz",
  "zona_direccion": "San Miguel"
}
// Respuesta: { "id_direccion": "uuid-edificio" }

// 2. Crear departamento 101
POST /api/propiedades/
{
  "id_direccion": "uuid-edificio",  ← Reutilizar
  "ci_propietario": "11111111",
  "titulo_propiedad": "Depto 101 - 2 dorm",
  "precio_publicado_propiedad": 120000.00,
  "tipo_operacion_propiedad": "Venta"
}

// 3. Crear departamento 102
POST /api/propiedades/
{
  "id_direccion": "uuid-edificio",  ← Reutilizar otra vez
  "ci_propietario": "22222222",
  "titulo_propiedad": "Depto 102 - 3 dorm",
  "precio_publicado_propiedad": 150000.00,
  "tipo_operacion_propiedad": "Venta"
}
```

---

## 📊 Validaciones

### **Direcciones:**
- ✅ Calle y ciudad son obligatorios
- ✅ No se puede eliminar si tiene propiedades

### **Propiedades:**
- ✅ Propietario debe existir
- ✅ Dirección debe existir (si usas id_direccion)
- ✅ Código público único (si se proporciona)
- ✅ Solo `id_direccion` O `direccion`, no ambos
- ✅ Usuario captador se asigna automáticamente
- ✅ No se puede eliminar si tiene citas o contratos

---

## 🔄 Estados de Propiedad

| Estado | Descripción | Siguiente paso |
|--------|-------------|----------------|
| **Captada** | Recién registrada | → Publicar |
| **Publicada** | Visible para clientes | → Agendar visitas |
| **Reservada** | Cliente interesado | → Cerrar contrato |
| **Cerrada** | Operación completada | - |

---

## 💰 Tipos de Operación

- **Venta**: Compra-venta
- **Alquiler**: Alquiler mensual
- **Anticrético**: Alquiler con garantía (típico en Bolivia)

---

## ✅ Estado del Proyecto

- ✅ CRUD de Usuarios
- ✅ CRUD de Empleados
- ✅ CRUD de Propietarios
- ✅ CRUD de Clientes
- ✅ CRUD de Direcciones
- ✅ CRUD de Propiedades (con direcciones anidadas)
- ⏳ CRUD de Roles
- ⏳ Gestión de Imágenes
- ⏳ Gestión de Documentos
- ⏳ Citas de Visita
- ⏳ Contratos

---

## 🎨 Ejemplo Visual del Response

```json
GET /api/propiedades/{id}

{
  "id_propiedad": "uuid-123",
  "id_direccion": "uuid-456",
  "ci_propietario": "88776655",
  "codigo_publico_propiedad": "PROP-2025-001",
  "titulo_propiedad": "Casa 3 dormitorios Calacoto",
  "descripcion_propiedad": "Casa moderna...",
  "precio_publicado_propiedad": 280000.00,
  "superficie_propiedad": 180.00,
  "tipo_operacion_propiedad": "Venta",
  "estado_propiedad": "Publicada",
  "id_usuario_captador": "uuid-asesor-1",
  "id_usuario_colocador": null,
  "fecha_captacion_propiedad": "2025-10-18",
  "fecha_publicacion_propiedad": "2025-10-20",
  "fecha_cierre_propiedad": null,
  "porcentaje_captacion_propiedad": 2.5,
  "porcentaje_colocacion_propiedad": null,
  "direccion": {              ← Incluida automáticamente
    "id_direccion": "uuid-456",
    "calle_direccion": "Calle 21 #456",
    "ciudad_direccion": "La Paz",
    "zona_direccion": "Calacoto",
    "latitud_direccion": -16.5234,
    "longitud_direccion": -68.0876
  }
}
```

---

## 🚀 ¡Listo para usar!

Ve a http://localhost:8000/docs y prueba:
1. Crear una dirección
2. Crear una propiedad con dirección existente
3. Crear una propiedad con dirección nueva (anidada)
4. Listar propiedades filtrando por estado
5. Actualizar estado de propiedad
