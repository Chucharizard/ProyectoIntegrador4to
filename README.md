# 🏢 Sistema de Gestión Inmobiliaria

Sistema completo de gestión inmobiliaria con frontend administrativo, aplicación móvil para asesores y sitio web público para clientes.

## 📁 Estructura del Proyecto

```
ProyectoInt/
├── backend/                    # API FastAPI + PostgreSQL
├── frontend/
│   ├── FrontendAdmin/         # Panel administrativo (Vue.js)
│   ├── FrontendClient/        # Sitio web público (Astro SSR)
│   └── FrontendAsesor/        # App móvil asesores (React Native)
├── INICIO.md                  # Comandos para iniciar servicios
├── SOLUCION_PAGINAS_PROPIEDADES.md
└── SOLUCION_PROBLEMAS_GITHUB.md
```

## 🚀 Inicio Rápido

### 1. Clonar el Repositorio

```bash
git clone https://github.com/Chucharizard/ProyectoIntegrador4to.git
cd ProyectoIntegrador4to
```

### 2. Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Cliente (Sitio Público)

```bash
cd frontend/FrontendClient
npm install
npm run dev
```

**URL:** http://localhost:4321

### 4. Frontend Admin (Panel Administrativo)

```bash
cd frontend/FrontendAdmin
npm install
npm run dev
```

**URL:** http://localhost:5173

### 5. Frontend Asesor (App Móvil)

```bash
cd frontend/FrontendAsesor
npm install
npm start
```

## ⚠️ Problemas Comunes

### Estilos no cargan / Errores después de clonar

Si después de clonar el proyecto los estilos no cargan o aparecen errores con dependencias:

```bash
cd frontend/FrontendClient
rm -rf node_modules .astro dist
npm cache clean --force
npm install
npm run dev
```

**Ver:** `SOLUCION_PROBLEMAS_GITHUB.md` para más detalles.

### Páginas de propiedades no se generan

El sistema usa SSR (Server-Side Rendering) para generar páginas dinámicamente.

**Ver:** `SOLUCION_PAGINAS_PROPIEDADES.md` para detalles técnicos.

## 📚 Documentación

- **INICIO.md** - Comandos de inicio de todos los servicios
- **SOLUCION_PROBLEMAS_GITHUB.md** - Problemas después de clonar
- **SOLUCION_PAGINAS_PROPIEDADES.md** - Sistema de páginas dinámicas
- **backend/Database.md** - Esquema de base de datos

## 🛠️ Tecnologías

### Backend
- **FastAPI** - Framework web Python
- **PostgreSQL** - Base de datos
- **Supabase** - Backend as a Service

### Frontend Cliente (Público)
- **Astro 5** - Framework SSR
- **Leaflet** - Mapas interactivos

### Frontend Admin
- **Vue 3** - Framework progresivo
- **Tailwind CSS** - Estilos utility-first

### Frontend Asesor
- **React Native** - App móvil multiplataforma
- **Expo** - Toolchain para React Native

## 🔧 Requisitos

- **Node.js** 18.x o superior
- **Python** 3.11 o superior
- **PostgreSQL** 14 o superior
- **npm** 9.x o superior

## 📝 Licencia

Este proyecto es para uso académico.

---

**Universidad:** Univalle  
**Semestre:** 4to  
**Año:** 2025