# CRUD de Contratos de Operación y Pagos

## 📋 Tablas Implementadas

### 1. ContratoOperacion
Registra los contratos de venta/alquiler cuando se cierra un negocio inmobiliario.

### 2. Pago
Registra los pagos asociados a los contratos (especialmente para ventas a cuotas o alquileres mensuales).

---

## 🔐 Autenticación
Todos los endpoints requieren autenticación mediante Bearer Token en el header:
```
Authorization: Bearer <tu_token_jwt>
```

---

## 📌 CRUD: ContratoOperacion

### **Base URL**: `/api/contratos/`

---

### 1️⃣ **POST** `/api/contratos/` - Crear Contrato

Crea un nuevo contrato de operación (venta, alquiler, etc.)

**Body (JSON):**
```json
{
  "id_propiedad": "uuid-de-la-propiedad",
  "ci_cliente": "1234567",
  "id_usuario_colocador": "uuid-del-colocador",
  "tipo_operacion_contrato": "Venta",
  "fecha_inicio_contrato": "2025-01-15",
  "fecha_fin_contrato": null,
  "estado_contrato": "Activo",
  "modalidad_pago_contrato": "Cuotas",
  "precio_cierre_contrato": 150000.00,
  "fecha_cierre_contrato": "2025-01-15",
  "observaciones_contrato": "Cliente pagará en 12 cuotas mensuales"
}
```

**Valores válidos:**
- `tipo_operacion_contrato`: "Venta", "Alquiler", "Anticrético", "Traspaso"
- `estado_contrato`: "Borrador", "Activo", "Finalizado", "Cancelado"
- `modalidad_pago_contrato`: "Contado", "Cuotas", "Financiado", etc.

**Validaciones:**
✅ Verifica que la propiedad exista y no esté cerrada
✅ Verifica que el cliente exista
✅ Verifica que el colocador exista
✅ El tipo de operación debe coincidir con el de la propiedad
✅ Para alquileres, `fecha_fin_contrato` es obligatoria
✅ Si el estado es "Activo", actualiza la propiedad a "Cerrada"

**Response (201):**
```json
{
  "id_contrato_operacion": "uuid-generado",
  "id_propiedad": "uuid-de-la-propiedad",
  "ci_cliente": "1234567",
  "id_usuario_colocador": "uuid-del-colocador",
  "tipo_operacion_contrato": "Venta",
  "fecha_inicio_contrato": "2025-01-15",
  "fecha_fin_contrato": null,
  "estado_contrato": "Activo",
  "modalidad_pago_contrato": "Cuotas",
  "precio_cierre_contrato": 150000.00,
  "fecha_cierre_contrato": "2025-01-15",
  "observaciones_contrato": "Cliente pagará en 12 cuotas mensuales"
}
```

---

### 2️⃣ **GET** `/api/contratos/` - Listar Contratos

Lista todos los contratos con filtros opcionales.

**Query Parameters:**
- `skip` (int, default=0): Número de registros a saltar
- `limit` (int, default=100, max=1000): Número de registros a retornar
- `estado` (string, opcional): Filtrar por estado
- `tipo_operacion` (string, opcional): Filtrar por tipo de operación
- `ci_cliente` (string, opcional): Filtrar por cliente
- `id_usuario_colocador` (string, opcional): Filtrar por colocador

**Ejemplo:**
```
GET /api/contratos/?estado=Activo&tipo_operacion=Venta&limit=50
```

**Response (200):**
```json
[
  {
    "id_contrato_operacion": "uuid-1",
    "id_propiedad": "uuid-propiedad-1",
    "ci_cliente": "1234567",
    "tipo_operacion_contrato": "Venta",
    "estado_contrato": "Activo",
    "precio_cierre_contrato": 150000.00,
    ...
  },
  {
    "id_contrato_operacion": "uuid-2",
    ...
  }
]
```

---

### 3️⃣ **GET** `/api/contratos/{id_contrato}` - Obtener Contrato

Obtiene los detalles de un contrato específico.

**Response (200):**
```json
{
  "id_contrato_operacion": "uuid-del-contrato",
  "id_propiedad": "uuid-de-la-propiedad",
  "ci_cliente": "1234567",
  "id_usuario_colocador": "uuid-del-colocador",
  "tipo_operacion_contrato": "Venta",
  "fecha_inicio_contrato": "2025-01-15",
  "fecha_fin_contrato": null,
  "estado_contrato": "Activo",
  "modalidad_pago_contrato": "Cuotas",
  "precio_cierre_contrato": 150000.00,
  "fecha_cierre_contrato": "2025-01-15",
  "observaciones_contrato": "Cliente pagará en 12 cuotas mensuales"
}
```

---

### 4️⃣ **PUT** `/api/contratos/{id_contrato}` - Actualizar Contrato

Actualiza los datos de un contrato existente.

⚠️ **Restricción**: Solo se pueden actualizar contratos en estado "Borrador" o "Activo"

**Body (JSON)** - Todos los campos son opcionales:
```json
{
  "estado_contrato": "Finalizado",
  "observaciones_contrato": "Contrato finalizado exitosamente"
}
```

**Response (200):**
```json
{
  "id_contrato_operacion": "uuid-del-contrato",
  "estado_contrato": "Finalizado",
  ...
}
```

---

### 5️⃣ **DELETE** `/api/contratos/{id_contrato}` - Eliminar Contrato

Elimina un contrato.

⚠️ **Restricciones**: 
- Solo se pueden eliminar contratos en estado "Borrador" o "Cancelado"
- Esto también eliminará todos los pagos asociados (CASCADE)

**Response (204):** Sin contenido

---

### 6️⃣ **GET** `/api/contratos/{id_contrato}/resumen` - Resumen Completo

Obtiene un resumen detallado del contrato incluyendo información financiera.

**Response (200):**
```json
{
  "contrato": {
    "id_contrato_operacion": "uuid-del-contrato",
    "tipo_operacion_contrato": "Venta",
    "precio_cierre_contrato": 150000.00,
    ...
  },
  "propiedad": {
    "titulo_propiedad": "Casa en Zona Sur",
    "tipo_operacion_propiedad": "Venta",
    "precio_publicado_propiedad": 160000.00
  },
  "cliente": {
    "nombres_completo_cliente": "Juan",
    "apellidos_completo_cliente": "Pérez",
    "telefono_cliente": "77777777"
  },
  "pagos": [
    {
      "id_pago": "uuid-pago-1",
      "monto_pago": 15000.00,
      "fecha_pago": "2025-01-15",
      "estado_pago": "Pagado",
      "numero_cuota_pago": 1
    },
    {
      "id_pago": "uuid-pago-2",
      "monto_pago": 15000.00,
      "fecha_pago": "2025-02-15",
      "estado_pago": "Pendiente",
      "numero_cuota_pago": 2
    }
  ],
  "resumen_financiero": {
    "precio_contrato": 150000.00,
    "total_pagado": 15000.00,
    "saldo_pendiente": 135000.00,
    "porcentaje_pagado": 10.0,
    "numero_pagos": 2
  }
}
```

---

## 💰 CRUD: Pago

### **Base URL**: `/api/pagos/`

---

### 1️⃣ **POST** `/api/pagos/` - Registrar Pago

Registra un nuevo pago asociado a un contrato.

**Body (JSON):**
```json
{
  "id_contrato_operacion": "uuid-del-contrato",
  "monto_pago": 15000.00,
  "fecha_pago": "2025-01-15",
  "numero_cuota_pago": 1,
  "estado_pago": "Pagado"
}
```

**Valores válidos:**
- `estado_pago`: "Pendiente", "Pagado", "Atrasado", "Cancelado"

**Validaciones:**
✅ Verifica que el contrato exista y esté activo
✅ No permite que el total de pagos exceda el precio del contrato
✅ `monto_pago` debe ser mayor a 0

**Response (201):**
```json
{
  "id_pago": "uuid-generado",
  "id_contrato_operacion": "uuid-del-contrato",
  "monto_pago": 15000.00,
  "fecha_pago": "2025-01-15",
  "numero_cuota_pago": 1,
  "estado_pago": "Pagado"
}
```

---

### 2️⃣ **GET** `/api/pagos/` - Listar Pagos

Lista todos los pagos con filtros opcionales.

**Query Parameters:**
- `skip` (int, default=0): Número de registros a saltar
- `limit` (int, default=100, max=1000): Número de registros a retornar
- `id_contrato` (string, opcional): Filtrar por contrato
- `estado` (string, opcional): Filtrar por estado

**Ejemplo:**
```
GET /api/pagos/?id_contrato=uuid-del-contrato&estado=Pendiente
```

**Response (200):**
```json
[
  {
    "id_pago": "uuid-1",
    "id_contrato_operacion": "uuid-del-contrato",
    "monto_pago": 15000.00,
    "fecha_pago": "2025-01-15",
    "numero_cuota_pago": 1,
    "estado_pago": "Pagado"
  },
  {
    "id_pago": "uuid-2",
    ...
  }
]
```

---

### 3️⃣ **GET** `/api/pagos/{id_pago}` - Obtener Pago

Obtiene los detalles de un pago específico.

**Response (200):**
```json
{
  "id_pago": "uuid-del-pago",
  "id_contrato_operacion": "uuid-del-contrato",
  "monto_pago": 15000.00,
  "fecha_pago": "2025-01-15",
  "numero_cuota_pago": 1,
  "estado_pago": "Pagado"
}
```

---

### 4️⃣ **PUT** `/api/pagos/{id_pago}` - Actualizar Pago

Actualiza los datos de un pago existente (típicamente para cambiar el estado).

**Body (JSON)** - Todos los campos son opcionales:
```json
{
  "estado_pago": "Pagado",
  "fecha_pago": "2025-01-20"
}
```

**Response (200):**
```json
{
  "id_pago": "uuid-del-pago",
  "estado_pago": "Pagado",
  "fecha_pago": "2025-01-20",
  ...
}
```

---

### 5️⃣ **DELETE** `/api/pagos/{id_pago}` - Eliminar Pago

Elimina un pago.

⚠️ **Restricción**: No se permite eliminar pagos en estado "Pagado" (se sugiere cambiar a "Cancelado")

**Response (204):** Sin contenido

---

### 6️⃣ **GET** `/api/pagos/atrasados/lista` - Listar Pagos Atrasados

Obtiene automáticamente todos los pagos pendientes cuya fecha de pago ya pasó.

Útil para identificar pagos morosos.

**Response (200):**
```json
{
  "total_atrasados": 3,
  "pagos": [
    {
      "id_pago": "uuid-1",
      "id_contrato_operacion": "uuid-contrato-1",
      "monto_pago": 15000.00,
      "fecha_pago": "2025-01-15",
      "numero_cuota_pago": 2,
      "estado_pago": "Pendiente"
    },
    ...
  ]
}
```

---

## 🔄 Flujo de Negocio Típico

### Escenario: Venta de Propiedad a Cuotas

1. **Crear el contrato** cuando se cierra el negocio:
   ```
   POST /api/contratos/
   {
     "id_propiedad": "uuid-propiedad",
     "ci_cliente": "1234567",
     "tipo_operacion_contrato": "Venta",
     "estado_contrato": "Activo",
     "precio_cierre_contrato": 150000.00,
     "modalidad_pago_contrato": "12 Cuotas"
   }
   ```
   ✅ La propiedad se marca automáticamente como "Cerrada"

2. **Registrar el pago inicial (cuota 1)**:
   ```
   POST /api/pagos/
   {
     "id_contrato_operacion": "uuid-del-contrato",
     "monto_pago": 12500.00,
     "fecha_pago": "2025-01-15",
     "numero_cuota_pago": 1,
     "estado_pago": "Pagado"
   }
   ```

3. **Crear pagos programados para las siguientes cuotas**:
   ```
   POST /api/pagos/ (para cada cuota futura)
   {
     "monto_pago": 12500.00,
     "fecha_pago": "2025-02-15",
     "numero_cuota_pago": 2,
     "estado_pago": "Pendiente"
   }
   ```

4. **Consultar resumen del contrato**:
   ```
   GET /api/contratos/{id_contrato}/resumen
   ```
   Verás: total pagado, saldo pendiente, % de avance

5. **Cuando el cliente pague una cuota**:
   ```
   PUT /api/pagos/{id_pago}
   {
     "estado_pago": "Pagado"
   }
   ```

6. **Monitorear pagos atrasados**:
   ```
   GET /api/pagos/atrasados/lista
   ```

7. **Cuando se complete el contrato**:
   ```
   PUT /api/contratos/{id_contrato}
   {
     "estado_contrato": "Finalizado"
   }
   ```

---

## ⚠️ Consideraciones Importantes

### ContratoOperacion
- Un contrato **"Activo"** cierra automáticamente la propiedad
- Solo se pueden eliminar contratos en estado "Borrador" o "Cancelado"
- Para alquileres, la `fecha_fin_contrato` es obligatoria
- El tipo de operación del contrato debe coincidir con el de la propiedad

### Pago
- El total de pagos NO puede exceder el precio del contrato
- Solo se pueden registrar pagos en contratos "Activos"
- Los pagos tienen relación CASCADE con el contrato (si se borra el contrato, se borran los pagos)
- No se puede eliminar un pago en estado "Pagado" (usar "Cancelado" en su lugar)

---

## 🎯 Endpoints Útiles

| Endpoint | Descripción |
|----------|-------------|
| `GET /api/contratos/?estado=Activo` | Contratos activos |
| `GET /api/contratos/?tipo_operacion=Venta` | Solo ventas |
| `GET /api/contratos/{id}/resumen` | Resumen financiero completo |
| `GET /api/pagos/?id_contrato={id}` | Todos los pagos de un contrato |
| `GET /api/pagos/atrasados/lista` | Pagos morosos |
| `GET /api/pagos/?estado=Pendiente` | Pagos pendientes |

---

## 📊 Resumen de Endpoints

### ContratoOperacion: 6 endpoints
- ✅ POST - Crear contrato
- ✅ GET - Listar contratos (con filtros)
- ✅ GET - Obtener un contrato
- ✅ PUT - Actualizar contrato
- ✅ DELETE - Eliminar contrato
- ✅ GET - Resumen completo del contrato

### Pago: 6 endpoints
- ✅ POST - Registrar pago
- ✅ GET - Listar pagos (con filtros)
- ✅ GET - Obtener un pago
- ✅ PUT - Actualizar pago
- ✅ DELETE - Eliminar pago
- ✅ GET - Lista de pagos atrasados

**Total: 12 endpoints implementados** 🎉
