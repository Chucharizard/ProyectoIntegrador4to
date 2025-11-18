# Backend - Sistema Inmobiliario

API REST desarrollada con FastAPI para el sistema de gestión inmobiliaria.

## 🚀 Tecnologías

- **FastAPI 0.115.0+** - Framework web moderno y rápido
- **Python 3.11.9** - Lenguaje de programación
- **Supabase** - Base de datos PostgreSQL gestionada
- **JWT** - Autenticación con tokens
- **Bcrypt** - Hash de contraseñas

## 📁 Estructura del Proyecto

```
Backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # Punto de entrada de FastAPI
│   ├── config.py            # Configuración de la aplicación
│   ├── database.py          # Conexión a Supabase
│   ├── models/              # Modelos de datos
│   ├── schemas/             # Schemas Pydantic (validación)
│   │   └── usuario.py
│   ├── routes/              # Endpoints/Routers
│   │   └── usuarios.py
│   └── utils/               # Utilidades
│       ├── security.py      # Hash, JWT, etc.
│       └── dependencies.py  # Dependencias reutilizables
├── .env                     # Variables de entorno (NO subir a git)
├── .env.example             # Ejemplo de variables de entorno
├── .gitignore
├── requirements.txt         # Dependencias del proyecto
└── README.md
```

## ⚙️ Configuración Inicial

### 1. Crear entorno virtual

```powershell
python -m venv venv
.\venv\Scripts\activate
```

### 2. Instalar dependencias

```powershell
pip install -r requirements.txt
```

### 3. Configurar variables de entorno

Crear un archivo `.env` en la raíz del proyecto Backend:

```env
# Supabase Configuration
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-supabase-anon-key

# JWT Configuration
SECRET_KEY=tu-clave-secreta-aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# App Configuration
APP_NAME=Sistema Inmobiliario
APP_VERSION=1.0.0
DEBUG=True
```

**Para generar una SECRET_KEY segura:**

```powershell
python -c "import secrets; print(secrets.token_hex(32))"
```

### 4. Configurar Supabase

1. Crear cuenta en [Supabase](https://supabase.com)
2. Crear un nuevo proyecto
3. En SQL Editor, ejecutar el script de `Database.md` para crear las tablas
4. Copiar la URL y la API Key (anon, public) del proyecto
5. Agregar las credenciales al archivo `.env`

## 🏃 Ejecutar la Aplicación

### Modo desarrollo (con hot reload)

```powershell
uvicorn app.main:app --reload
```

### Modo producción

```powershell
python -m app.main
```

La API estará disponible en: `http://localhost:8000`

## 📚 Documentación de la API

Una vez que la aplicación esté corriendo, puedes acceder a:

- **Swagger UI (interactiva)**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔐 Endpoints de Usuarios

### Autenticación

#### POST `/api/usuarios/login`
Login de usuario (retorna token JWT)

**Body:**
```json
{
  "username": "nombre_usuario",
  "password": "contraseña"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### CRUD de Usuarios (requieren autenticación)

Para usar estos endpoints, incluir el token en el header:
```
Authorization: Bearer <token>
```

#### POST `/api/usuarios/`
Crear un nuevo usuario

**Body:**
```json
{
  "ci_empleado": "12345678",
  "id_rol": 1,
  "nombre_usuario": "usuario123",
  "contrasenia_usuario": "password123"
}
```

#### GET `/api/usuarios/`
Listar todos los usuarios

**Query params:**
- `skip`: número de registros a omitir (default: 0)
- `limit`: número máximo de registros (default: 100)

#### GET `/api/usuarios/{id_usuario}`
Obtener un usuario específico por ID

#### PUT `/api/usuarios/{id_usuario}`
Actualizar un usuario existente

**Body (todos los campos son opcionales):**
```json
{
  "ci_empleado": "12345678",
  "id_rol": 2,
  "nombre_usuario": "nuevo_nombre",
  "contrasenia_usuario": "nueva_password",
  "es_activo_usuario": true
}
```

#### DELETE `/api/usuarios/{id_usuario}`
Desactivar un usuario (soft delete)

#### GET `/api/usuarios/me/`
Obtener información del usuario autenticado

## 🧪 Probar la API

### Con cURL (PowerShell)

**Login:**
```powershell
$body = @{
    username = "nombre_usuario"
    password = "contraseña"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/usuarios/login" -Method Post -Body $body -ContentType "application/json"
```

**Crear usuario (con token):**
```powershell
$token = "tu_token_aqui"
$headers = @{
    "Authorization" = "Bearer $token"
}
$body = @{
    ci_empleado = "12345678"
    id_rol = 1
    nombre_usuario = "usuario123"
    contrasenia_usuario = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/usuarios/" -Method Post -Headers $headers -Body $body -ContentType "application/json"
```

## 🔧 Próximos Pasos

- [ ] Implementar CRUD de Empleados
- [ ] Implementar CRUD de Roles
- [ ] Implementar CRUD de Clientes
- [ ] Implementar CRUD de Propiedades
- [ ] Implementar sistema de visitas
- [ ] Implementar cálculo de comisiones
- [ ] Implementar reportes

## 📝 Notas

- Los errores de importación en el editor son normales antes de instalar las dependencias
- Asegúrate de activar el entorno virtual antes de trabajar
- NO subir el archivo `.env` a git (ya está en `.gitignore`)
- Las contraseñas se almacenan hasheadas con bcrypt
