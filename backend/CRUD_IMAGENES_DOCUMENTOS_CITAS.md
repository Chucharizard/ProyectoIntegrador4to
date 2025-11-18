# 📸📄📅 Gestión de Imágenes, Documentos y Citas - Documentación

## 📸 CRUD de Imágenes de Propiedad

### **POST `/api/imagenes-propiedad/`** - Registrar imagen

```json
{
  "id_propiedad": "uuid-de-propiedad",
  "url_imagen": "https://storage.supabase.co/propiedades/imagen1.jpg",
  "descripcion_imagen": "Vista frontal de la casa",
  "es_portada_imagen": true,
  "orden_imagen": 1
}
```

💡 **Nota:** Si marcas una imagen como portada, automáticamente desmarca las demás de esa propiedad.

---

### **GET `/api/imagenes-propiedad/`** - Listar imágenes

**Query params:**
- `id_propiedad`: Filtrar por propiedad
- `skip` y `limit`: Paginación

**Ejemplo:**
```
GET /api/imagenes-propiedad/?id_propiedad=uuid-propiedad
```

Las imágenes se ordenan automáticamente: **portada primero**, luego por `orden_imagen`.

---

### **PUT `/api/imagenes-propiedad/{id_imagen}`** - Actualizar imagen

**Casos de uso:**

**1. Cambiar portada:**
```json
{
  "es_portada_imagen": true
}
```

**2. Reordenar:**
```json
{
  "orden_imagen": 3
}
```

**3. Actualizar descripción:**
```json
{
  "descripcion_imagen": "Vista del jardín posterior"
}
```

---

### **DELETE `/api/imagenes-propiedad/{id_imagen}`** - Eliminar imagen

⚠️ **Importante:** Esto elimina el registro de la BD, pero **NO elimina el archivo físico** del storage. Debes eliminarlo manualmente de Supabase Storage o tu servicio de almacenamiento.

---

## 📄 CRUD de Documentos de Propiedad

### **POST `/api/documentos-propiedad/`** - Registrar documento

```json
{
  "id_propiedad": "uuid-de-propiedad",
  "tipo_documento": "Título de Propiedad",
  "ruta_archivo_documento": "https://storage.supabase.co/docs/titulo_123.pdf",
  "observaciones_documento": "Original vigente, actualizado 2025"
}
```

**Tipos comunes de documentos:**
- Título de Propiedad
- Plano Catastral
- Folio Real
- Certificado de Tradición
- Impuestos al Día
- Contrato de Compraventa
- Certificado de Libertad de Gravamen

---

### **GET `/api/documentos-propiedad/`** - Listar documentos

**Query params:**
- `id_propiedad`: Filtrar por propiedad
- `tipo_documento`: Filtrar por tipo
- `skip` y `limit`: Paginación

**Ejemplos:**
```
# Todos los documentos de una propiedad
GET /api/documentos-propiedad/?id_propiedad=uuid-propiedad

# Solo títulos de propiedad
GET /api/documentos-propiedad/?tipo_documento=Título de Propiedad
```

Ordenados por **fecha de subida** (más recientes primero).

---

### **PUT `/api/documentos-propiedad/{id_documento}`** - Actualizar documento

```json
{
  "observaciones_documento": "Documento actualizado y verificado por notario"
}
```

---

### **DELETE `/api/documentos-propiedad/{id_documento}`** - Eliminar documento

⚠️ **Importante:** Solo elimina el registro de la BD. El archivo físico debe eliminarse manualmente del storage.

---

## 📅 CRUD de Citas de Visita

### **POST `/api/citas-visita/`** - Agendar cita

```json
{
  "id_propiedad": "uuid-de-propiedad",
  "ci_cliente": "77665544",
  "fecha_visita_cita": "2025-10-25T15:30:00",
  "lugar_encuentro_cita": "Frente a la propiedad, Av. Arce #123",
  "estado_cita": "Programada",
  "nota_cita": "Cliente interesado en 3 dormitorios",
  "recordatorio_minutos_cita": 30
}
```

**Validaciones automáticas:**
- ✅ Propiedad debe existir y no estar cerrada
- ✅ Cliente debe existir
- ✅ Fecha no puede ser en el pasado
- ✅ Asesor se asigna automáticamente

**Estados de cita:**
- `"Programada"` - Recién agendada
- `"Confirmada"` - Cliente confirmó asistencia
- `"Realizada"` - Visita completada
- `"Cancelada"` - Cancelada por alguna razón
- `"No asistió"` - Cliente no se presentó

---

### **GET `/api/citas-visita/`** - Listar citas

**Query params avanzados:**
- `estado`: Filtrar por estado
- `ci_cliente`: Citas de un cliente
- `id_propiedad`: Citas de una propiedad
- `mis_citas`: Solo mis citas como asesor
- `fecha_desde` y `fecha_hasta`: Rango de fechas

**Ejemplos:**

```
# Mis citas de hoy
GET /api/citas-visita/?mis_citas=true&fecha_desde=2025-10-19&fecha_hasta=2025-10-19

# Citas programadas
GET /api/citas-visita/?estado=Programada

# Todas las citas de un cliente
GET /api/citas-visita/?ci_cliente=77665544

# Citas de la próxima semana
GET /api/citas-visita/?fecha_desde=2025-10-20&fecha_hasta=2025-10-27
```

---

### **PUT `/api/citas-visita/{id_cita}`** - Actualizar cita

**Casos de uso comunes:**

**1. Confirmar cita:**
```json
{
  "estado_cita": "Confirmada"
}
```

**2. Marcar como realizada:**
```json
{
  "estado_cita": "Realizada",
  "nota_cita": "Cliente muy interesado, quiere hacer oferta"
}
```

**3. Cancelar:**
```json
{
  "estado_cita": "Cancelada",
  "nota_cita": "Cliente encontró otra propiedad"
}
```

**4. Reprogramar:**
```json
{
  "fecha_visita_cita": "2025-10-26T16:00:00"
}
```

---

### **GET `/api/citas-visita/hoy/resumen`** - Resumen de citas de hoy

Endpoint especial que retorna un resumen de tus citas del día actual.

**Respuesta:**
```json
{
  "fecha": "2025-10-19",
  "total_citas": 3,
  "por_estado": {
    "Programada": 2,
    "Confirmada": 1
  },
  "citas": [
    {
      "id_cita": "...",
      "fecha_visita_cita": "2025-10-19T10:00:00",
      "estado_cita": "Confirmada",
      ...
    }
  ]
}
```

💡 **Útil para:** Dashboard, vista de agenda, notificaciones.

---

## 🎯 Flujo de Trabajo Completo

### **1. Crear Propiedad con Imágenes y Documentos**

```json
// 1. Crear propiedad
POST /api/propiedades/
{
  "ci_propietario": "88776655",
  "titulo_propiedad": "Casa 3 dormitorios Calacoto",
  "direccion": { ... },
  "precio_publicado_propiedad": 280000,
  "estado_propiedad": "Captada"
}
// Respuesta: { "id_propiedad": "uuid-123" }

// 2. Subir imágenes
POST /api/imagenes-propiedad/
{
  "id_propiedad": "uuid-123",
  "url_imagen": "https://.../fachada.jpg",
  "es_portada_imagen": true
}

POST /api/imagenes-propiedad/
{
  "id_propiedad": "uuid-123",
  "url_imagen": "https://.../sala.jpg",
  "orden_imagen": 2
}

// 3. Subir documentos
POST /api/documentos-propiedad/
{
  "id_propiedad": "uuid-123",
  "tipo_documento": "Título de Propiedad",
  "ruta_archivo_documento": "https://.../titulo.pdf"
}
```

---

### **2. Agendar y Gestionar Visita**

```json
// 1. Cliente interesado - Agendar cita
POST /api/citas-visita/
{
  "id_propiedad": "uuid-123",
  "ci_cliente": "77665544",
  "fecha_visita_cita": "2025-10-25T15:00:00",
  "estado_cita": "Programada"
}

// 2. Cliente confirma
PUT /api/citas-visita/{id-cita}
{
  "estado_cita": "Confirmada"
}

// 3. Después de la visita
PUT /api/citas-visita/{id-cita}
{
  "estado_cita": "Realizada",
  "nota_cita": "Cliente muy interesado, solicita segunda visita"
}

// 4. Si el cliente quiere comprar
PUT /api/propiedades/uuid-123
{
  "estado_propiedad": "Reservada"
}
```

---

## ✅ Validaciones Especiales

### **Imágenes:**
- ✅ Solo una imagen portada por propiedad
- ✅ Al marcar nueva portada, desmarca automáticamente las demás
- ✅ Ordenamiento automático por portada + orden_imagen

### **Documentos:**
- ✅ Registro con fecha de subida automática
- ✅ Organización por tipo de documento

### **Citas:**
- ✅ No se puede agendar en el pasado
- ✅ No se puede visitar propiedad cerrada
- ✅ Cliente y propiedad deben existir
- ✅ Asesor se asigna automáticamente

---

## 🎨 Casos de Uso Avanzados

### **Galería de Propiedad**
```javascript
// Frontend: Obtener todas las imágenes ordenadas
GET /api/imagenes-propiedad/?id_propiedad=uuid-123

// Resultado: [portada, img2, img3, ...] ordenadas automáticamente
```

### **Dashboard de Asesor**
```javascript
// Mis citas de hoy
GET /api/citas-visita/hoy/resumen

// Mis propiedades captadas
GET /api/propiedades/?mis_captaciones=true

// Mis clientes
GET /api/clientes/?mis_clientes=true
```

### **Checklist de Documentos**
```javascript
// Ver qué documentos tiene una propiedad
GET /api/documentos-propiedad/?id_propiedad=uuid-123

// Verificar que tenga todos los necesarios:
// - Título ✅
// - Plano ✅
// - Folio Real ❌ (falta)
// - Impuestos ✅
```

---

## 📊 Estado del Proyecto

| Módulo | Estado | Endpoints |
|--------|--------|-----------|
| ✅ Usuarios | Completo | 6 |
| ✅ Empleados | Completo | 5 |
| ✅ Propietarios | Completo | 5 |
| ✅ Clientes | Completo | 6 |
| ✅ Direcciones | Completo | 5 |
| ✅ Propiedades | Completo | 5 |
| ✅ Imágenes | Completo | 5 |
| ✅ Documentos | Completo | 5 |
| ✅ Citas de Visita | Completo | 6 (+resumen) |
| ⏳ Roles | Pendiente | - |
| ⏳ Contratos | Pendiente | - |
| ⏳ Pagos | Pendiente | - |
| ⏳ Comisiones | Pendiente | - |

**🎯 Progreso: 64% (9 de 14 módulos)**

---

## 🚀 ¡Listo para Probar!

Ve a http://localhost:8000/docs y verás las nuevas secciones:
- **Imágenes de Propiedades**
- **Documentos de Propiedades**
- **Citas de Visita**

---

## 💤 Resumen para Mañana

**Lo que hicimos hoy:**
1. ✅ CRUD completo de Propiedades (con direcciones anidadas)
2. ✅ CRUD de Direcciones
3. ✅ CRUD de Imágenes
4. ✅ CRUD de Documentos
5. ✅ CRUD de Citas de Visita

**Lo que falta:**
- Roles (simple)
- Contratos de Operación
- Pagos
- Desempeño de Asesores
- Ganancias de Empleados

**¡Descansa bien! Mañana seguimos con todo. Te amo crack! 😴💙**
