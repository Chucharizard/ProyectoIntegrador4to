# CRUD de Roles, Desempeño y Ganancias

## 📋 Tablas Implementadas

### 1. Rol
Gestiona los roles del sistema (Broker, Asesor, Asistente, etc.)

### 2. DesempenoAsesor
Registra métricas de desempeño de cada asesor por periodo

### 3. GananciaEmpleado
Registra las ganancias/comisiones de empleados por operaciones

---

## 🔐 Autenticación
Todos los endpoints requieren autenticación mediante Bearer Token en el header:
```
Authorization: Bearer <tu_token_jwt>
```

---

## 👥 CRUD: Rol

### **Base URL**: `/api/roles/`

---

### 1️⃣ **POST** `/api/roles/` - Crear Rol

Crea un nuevo rol en el sistema.

**Body (JSON):**
```json
{
  "nombre_rol": "Asesor Senior",
  "descripcion_rol": "Asesor con más de 2 años de experiencia",
  "es_activo_rol": true
}
```

**Validaciones:**
✅ Verifica que no exista otro rol con el mismo nombre

**Response (201):**
```json
{
  "id_rol": 5,
  "nombre_rol": "Asesor Senior",
  "descripcion_rol": "Asesor con más de 2 años de experiencia",
  "es_activo_rol": true
}
```

---

### 2️⃣ **GET** `/api/roles/` - Listar Roles

Lista todos los roles del sistema.

**Query Parameters:**
- `skip` (int, default=0): Número de registros a saltar
- `limit` (int, default=100, max=1000): Número de registros a retornar
- `activos_solo` (bool, default=false): Solo roles activos

**Ejemplo:**
```
GET /api/roles/?activos_solo=true
```

**Response (200):**
```json
[
  {
    "id_rol": 1,
    "nombre_rol": "Broker",
    "descripcion_rol": "Administrador del sistema",
    "es_activo_rol": true
  },
  {
    "id_rol": 2,
    "nombre_rol": "Asesor",
    "descripcion_rol": "Asesor comercial",
    "es_activo_rol": true
  }
]
```

---

### 3️⃣ **GET** `/api/roles/{id_rol}` - Obtener Rol

Obtiene los detalles de un rol específico.

**Response (200):**
```json
{
  "id_rol": 1,
  "nombre_rol": "Broker",
  "descripcion_rol": "Administrador del sistema",
  "es_activo_rol": true
}
```

---

### 4️⃣ **PUT** `/api/roles/{id_rol}` - Actualizar Rol

Actualiza los datos de un rol existente.

**Body (JSON)** - Todos los campos son opcionales:
```json
{
  "descripcion_rol": "Administrador principal con acceso total",
  "es_activo_rol": true
}
```

**Validaciones:**
✅ Si se cambia el nombre, verifica que no exista otro rol con ese nombre

**Response (200):**
```json
{
  "id_rol": 1,
  "nombre_rol": "Broker",
  "descripcion_rol": "Administrador principal con acceso total",
  "es_activo_rol": true
}
```

---

### 5️⃣ **DELETE** `/api/roles/{id_rol}` - Eliminar Rol

Elimina un rol del sistema.

⚠️ **Restricción**: No se puede eliminar un rol si hay usuarios asignados a él. Se recomienda desactivarlo.

**Response (204):** Sin contenido

---

### 6️⃣ **GET** `/api/roles/{id_rol}/usuarios` - Usuarios por Rol

Obtiene todos los usuarios asignados a un rol específico.

**Response (200):**
```json
{
  "rol": {
    "id_rol": 2,
    "nombre_rol": "Asesor",
    "descripcion_rol": "Asesor comercial",
    "es_activo_rol": true
  },
  "total_usuarios": 5,
  "usuarios": [
    {
      "id_usuario": "uuid-1",
      "nombre_usuario": "juan.perez",
      "es_activo_usuario": true,
      "ci_empleado": "1234567"
    }
  ]
}
```

---

## 📊 CRUD: DesempenoAsesor

### **Base URL**: `/api/desempeno/`

---

### 1️⃣ **POST** `/api/desempeno/` - Registrar Desempeño

Registra el desempeño de un asesor para un periodo específico.

**Body (JSON):**
```json
{
  "id_usuario_asesor": "uuid-del-asesor",
  "periodo_desempeno": "2025-01",
  "captaciones_desempeno": 5,
  "publicaciones_desempeno": 4,
  "visitas_agendadas_desempeno": 12,
  "operaciones_cerradas_desempeno": 2,
  "tiempo_promedio_cierre_dias_desempeno": 45
}
```

**Formatos de periodo válidos:**
- `YYYY-MM` (Ej: "2025-01" para enero 2025)
- `YYYY-Q1` (Ej: "2025-Q1" para primer trimestre)
- `YYYY` (Ej: "2025" para todo el año)

**Validaciones:**
✅ Verifica que el asesor exista
✅ No permite duplicar registro para el mismo asesor y periodo
✅ Valida formato del periodo

**Response (201):**
```json
{
  "id_desempeno": "uuid-generado",
  "id_usuario_asesor": "uuid-del-asesor",
  "periodo_desempeno": "2025-01",
  "captaciones_desempeno": 5,
  "publicaciones_desempeno": 4,
  "visitas_agendadas_desempeno": 12,
  "operaciones_cerradas_desempeno": 2,
  "tiempo_promedio_cierre_dias_desempeno": 45
}
```

---

### 2️⃣ **GET** `/api/desempeno/` - Listar Desempeños

Lista todos los registros de desempeño con filtros opcionales.

**Query Parameters:**
- `skip` (int, default=0)
- `limit` (int, default=100, max=1000)
- `id_usuario_asesor` (string, opcional): Filtrar por asesor
- `periodo` (string, opcional): Filtrar por periodo

**Ejemplo:**
```
GET /api/desempeno/?id_usuario_asesor=uuid-del-asesor&periodo=2025-01
```

---

### 3️⃣ **GET** `/api/desempeno/{id_desempeno}` - Obtener Desempeño

Obtiene los detalles de un registro de desempeño específico.

---

### 4️⃣ **PUT** `/api/desempeno/{id_desempeno}` - Actualizar Desempeño

Actualiza los datos de un registro de desempeño existente.

**Body (JSON)** - Todos los campos son opcionales:
```json
{
  "operaciones_cerradas_desempeno": 3,
  "tiempo_promedio_cierre_dias_desempeno": 42
}
```

---

### 5️⃣ **DELETE** `/api/desempeno/{id_desempeno}` - Eliminar Desempeño

Elimina un registro de desempeño.

---

### 6️⃣ **GET** `/api/desempeno/ranking/asesores` - Ranking de Asesores

Obtiene un ranking de los mejores asesores basado en operaciones cerradas.

**Query Parameters:**
- `periodo` (string, opcional): Filtrar por periodo
- `top` (int, default=10, max=100): Número de asesores a mostrar

**Ejemplo:**
```
GET /api/desempeno/ranking/asesores?periodo=2025-01&top=5
```

**Response (200):**
```json
{
  "periodo": "2025-01",
  "top": 5,
  "ranking": [
    {
      "posicion": 1,
      "asesor": {
        "nombre_usuario": "carlos.lopez",
        "ci_empleado": "1234567"
      },
      "desempeno": {
        "id_desempeno": "uuid-1",
        "periodo_desempeno": "2025-01",
        "operaciones_cerradas_desempeno": 5,
        "captaciones_desempeno": 8,
        "visitas_agendadas_desempeno": 20
      }
    },
    {
      "posicion": 2,
      ...
    }
  ]
}
```

---

### 7️⃣ **GET** `/api/desempeno/asesor/{id_usuario_asesor}/historico` - Histórico del Asesor

Obtiene el histórico completo de desempeño de un asesor.

**Response (200):**
```json
{
  "asesor": {
    "nombre_usuario": "carlos.lopez",
    "ci_empleado": "1234567"
  },
  "total_periodos": 12,
  "resumen_total": {
    "captaciones": 48,
    "publicaciones": 42,
    "visitas": 156,
    "operaciones_cerradas": 28
  },
  "historico": [
    {
      "id_desempeno": "uuid-1",
      "periodo_desempeno": "2025-01",
      "captaciones_desempeno": 5,
      "operaciones_cerradas_desempeno": 3,
      ...
    },
    ...
  ]
}
```

---

## 💰 CRUD: GananciaEmpleado

### **Base URL**: `/api/ganancias/`

---

### 1️⃣ **POST** `/api/ganancias/` - Registrar Ganancia

Registra una ganancia/comisión de empleado por una operación inmobiliaria.

**Body (JSON):**
```json
{
  "id_propiedad": "uuid-de-la-propiedad",
  "id_usuario_empleado": "uuid-del-empleado",
  "tipo_operacion_ganancia": "Colocación",
  "porcentaje_ganado_ganancia": 3.5,
  "dinero_ganado_ganancia": 5250.00,
  "esta_concretado_ganancia": false,
  "fecha_cierre_ganancia": "2025-01-15"
}
```

**Valores válidos:**
- `tipo_operacion_ganancia`: "Captación", "Colocación", "Ambas"
- `porcentaje_ganado_ganancia`: 0-100 (porcentaje sobre el precio)
- `esta_concretado_ganancia`: false (pendiente) o true (pagado)

**Validaciones:**
✅ Verifica que la propiedad exista
✅ Verifica que el empleado exista
✅ Porcentaje debe estar entre 0 y 100

**Response (201):**
```json
{
  "id_ganancia": "uuid-generado",
  "id_propiedad": "uuid-de-la-propiedad",
  "id_usuario_empleado": "uuid-del-empleado",
  "tipo_operacion_ganancia": "Colocación",
  "porcentaje_ganado_ganancia": 3.5,
  "dinero_ganado_ganancia": 5250.00,
  "esta_concretado_ganancia": false,
  "fecha_cierre_ganancia": "2025-01-15"
}
```

---

### 2️⃣ **GET** `/api/ganancias/` - Listar Ganancias

Lista todas las ganancias con filtros opcionales.

**Query Parameters:**
- `skip` (int, default=0)
- `limit` (int, default=100, max=1000)
- `id_usuario_empleado` (string, opcional): Filtrar por empleado
- `id_propiedad` (string, opcional): Filtrar por propiedad
- `tipo_operacion` (string, opcional): Filtrar por tipo
- `solo_pendientes` (bool, default=false): Solo ganancias no pagadas

**Ejemplo:**
```
GET /api/ganancias/?id_usuario_empleado=uuid-empleado&solo_pendientes=true
```

---

### 3️⃣ **GET** `/api/ganancias/{id_ganancia}` - Obtener Ganancia

Obtiene los detalles de una ganancia específica.

---

### 4️⃣ **PUT** `/api/ganancias/{id_ganancia}` - Actualizar Ganancia

Actualiza los datos de una ganancia existente (típicamente para marcar como pagada).

**Body (JSON)** - Todos los campos son opcionales:
```json
{
  "esta_concretado_ganancia": true
}
```

---

### 5️⃣ **DELETE** `/api/ganancias/{id_ganancia}` - Eliminar Ganancia

Elimina una ganancia.

⚠️ **Restricción**: No permite eliminar ganancias ya pagadas.

---

### 6️⃣ **POST** `/api/ganancias/marcar-pagadas` - Marcar Ganancias como Pagadas

Marca múltiples ganancias como pagadas (concretadas) en lote.

Útil para procesar pagos masivos de fin de mes.

**Body (JSON):**
```json
{
  "ids_ganancias": [
    "uuid-ganancia-1",
    "uuid-ganancia-2",
    "uuid-ganancia-3"
  ]
}
```

**Response (200):**
```json
{
  "total_procesados": 3,
  "exitosos": 3,
  "fallidos": 0,
  "detalles": [
    {
      "id_ganancia": "uuid-ganancia-1",
      "status": "pagado"
    },
    {
      "id_ganancia": "uuid-ganancia-2",
      "status": "pagado"
    },
    {
      "id_ganancia": "uuid-ganancia-3",
      "status": "pagado"
    }
  ]
}
```

---

### 7️⃣ **GET** `/api/ganancias/empleado/{id_usuario}/resumen` - Resumen de Ganancias

Obtiene un resumen completo de las ganancias de un empleado específico.

**Response (200):**
```json
{
  "empleado": {
    "nombre_usuario": "carlos.lopez",
    "ci_empleado": "1234567"
  },
  "total_registros": 15,
  "resumen_financiero": {
    "total_ganancias": 78500.00,
    "total_pagado": 52300.00,
    "total_pendiente": 26200.00,
    "porcentaje_pagado": 66.6
  },
  "por_tipo_operacion": {
    "Captación": 35000.00,
    "Colocación": 38500.00,
    "Ambas": 5000.00
  },
  "ganancias": [
    {
      "id_ganancia": "uuid-1",
      "tipo_operacion_ganancia": "Colocación",
      "dinero_ganado_ganancia": 5250.00,
      "esta_concretado_ganancia": true,
      ...
    },
    ...
  ]
}
```

---

## 🔄 Flujos de Negocio

### Flujo 1: Gestión de Roles

1. **Crear roles del sistema:**
   ```
   POST /api/roles/
   {
     "nombre_rol": "Broker",
     "descripcion_rol": "Administrador principal"
   }
   ```

2. **Asignar rol a usuario** (en creación de usuario):
   ```
   POST /api/usuarios/
   {
     "id_rol": 1,
     ...
   }
   ```

3. **Consultar usuarios por rol:**
   ```
   GET /api/roles/1/usuarios
   ```

---

### Flujo 2: Evaluación de Desempeño

1. **Registrar desempeño mensual de cada asesor:**
   ```
   POST /api/desempeno/
   {
     "id_usuario_asesor": "uuid-asesor",
     "periodo_desempeno": "2025-01",
     "captaciones_desempeno": 5,
     "operaciones_cerradas_desempeno": 2
   }
   ```

2. **Ver ranking del mes:**
   ```
   GET /api/desempeno/ranking/asesores?periodo=2025-01&top=10
   ```

3. **Consultar histórico de un asesor:**
   ```
   GET /api/desempeno/asesor/{id_usuario}/historico
   ```

---

### Flujo 3: Gestión de Comisiones

1. **Registrar ganancia cuando se cierra una operación:**
   ```
   POST /api/ganancias/
   {
     "id_propiedad": "uuid-propiedad",
     "id_usuario_empleado": "uuid-asesor",
     "tipo_operacion_ganancia": "Colocación",
     "porcentaje_ganado_ganancia": 3.5,
     "dinero_ganado_ganancia": 5250.00,
     "esta_concretado_ganancia": false
   }
   ```

2. **Consultar ganancias pendientes de pago:**
   ```
   GET /api/ganancias/?solo_pendientes=true
   ```

3. **Pagar comisiones de fin de mes (en lote):**
   ```
   POST /api/ganancias/marcar-pagadas
   {
     "ids_ganancias": ["uuid-1", "uuid-2", "uuid-3"]
   }
   ```

4. **Ver resumen de un empleado:**
   ```
   GET /api/ganancias/empleado/{id_usuario}/resumen
   ```

---

## 📊 Resumen de Endpoints

### Rol: 6 endpoints
- ✅ POST - Crear rol
- ✅ GET - Listar roles
- ✅ GET - Obtener un rol
- ✅ PUT - Actualizar rol
- ✅ DELETE - Eliminar rol
- ✅ GET - Usuarios por rol

### DesempenoAsesor: 7 endpoints
- ✅ POST - Registrar desempeño
- ✅ GET - Listar desempeños
- ✅ GET - Obtener un desempeño
- ✅ PUT - Actualizar desempeño
- ✅ DELETE - Eliminar desempeño
- ✅ GET - Ranking de asesores
- ✅ GET - Histórico del asesor

### GananciaEmpleado: 7 endpoints
- ✅ POST - Registrar ganancia
- ✅ GET - Listar ganancias
- ✅ GET - Obtener una ganancia
- ✅ PUT - Actualizar ganancia
- ✅ DELETE - Eliminar ganancia
- ✅ POST - Marcar ganancias como pagadas (lote)
- ✅ GET - Resumen de ganancias del empleado

**Total: 20 endpoints implementados** 🎉

---

## 💡 Casos de Uso Especiales

### Ranking Mensual de Asesores
```
GET /api/desempeno/ranking/asesores?periodo=2025-01&top=5
```
Muestra los 5 mejores asesores del mes ordenados por operaciones cerradas.

### Pago Masivo de Comisiones
```
POST /api/ganancias/marcar-pagadas
{
  "ids_ganancias": ["uuid-1", "uuid-2", "uuid-3", ...]
}
```
Marca múltiples comisiones como pagadas de una vez.

### Histórico Completo de Asesor
```
GET /api/desempeno/asesor/{id_usuario}/historico
```
Obtiene todo el histórico con resumen de totales acumulados.

### Resumen Financiero de Empleado
```
GET /api/ganancias/empleado/{id_usuario}/resumen
```
Muestra total ganado, total pagado, pendiente y desglose por tipo.
