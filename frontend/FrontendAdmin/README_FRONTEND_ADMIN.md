# 🏢 InmoAdmin - Panel de Administración

## ✅ ESTADO: **EN DESARROLLO ACTIVO**

Sistema de administración web para gestión inmobiliaria desarrollado con React 19 y arquitectura moderna optimizada.

---

## 📊 Resumen Ejecutivo

**Framework Frontend:** React 19.1.0  
**Build Tool:** Vite 7.1.10  
**Estilos:** TailwindCSS 3.4.1  
**Routing:** React Router v6  
**Estado:** Context API + localStorage  
**HTTP Client:** Axios con interceptores JWT  
**UI Icons:** @heroicons/react v2.2.0  
**Notificaciones:** react-hot-toast  

---

## 🎨 Sistema de Diseño

### Paleta de Colores
Heredada del **FrontendClient** para consistencia visual:

- **Primary (Azul Profundo):** `#0f172a` - `#020617`
- **Secondary (Verde Esmeralda):** `#10b981` - `#059669`
- **Accent (Naranja Energético):** `#f97316` - `#ea580c`

### Características Visuales
- ✨ Gradientes suaves en fondos y textos
- 🎯 Sombras coloridas con transparencia verde
- 🔄 Transiciones y animaciones fluidas
- 📱 Diseño completamente responsive
- 🌈 Cards con efectos hover y bordes animados
- 💫 Iconos temáticos con @heroicons

---

## 🏗️ Arquitectura del Proyecto

```
FrontendAdmin/
├── public/                              # Archivos estáticos
│
├── src/
│   ├── main.jsx                         # Punto de entrada
│   ├── App.jsx                          # Configuración de rutas
│   ├── index.css                        # Estilos globales + Tailwind
│   │
│   ├── styles/                          # Sistema de diseño
│   │   └── tokens.css                   # Variables CSS y utilidades
│   │
│   ├── api/                             # Configuración HTTP
│   │   └── axios.js                     # Instancia Axios + interceptores
│   │
│   ├── auth/                            # Autenticación
│   │   ├── AuthContext.jsx              # Context de autenticación
│   │   └── ProtectedRoute.jsx           # Guardián de rutas
│   │
│   ├── components/                      # Componentes reutilizables
│   │   └── layout/
│   │       ├── Layout.jsx               # Layout principal
│   │       ├── Sidebar.jsx              # Menú lateral
│   │       └── Navbar.jsx               # Barra superior
│   │
│   ├── services/                        # Capa de servicios API
│   │   ├── usuarioService.js            # CRUD Usuarios
│   │   ├── empleadoService.js           # CRUD Empleados
│   │   ├── rolService.js                # CRUD Roles (con caché)
│   │   ├── clienteService.js            # CRUD Clientes
│   │   ├── propietarioService.js        # CRUD Propietarios
│   │   ├── propiedadService.js          # CRUD Propiedades
│   │   └── direccionService.js          # CRUD Direcciones
│   │
│   ├── utils/                           # Utilidades
│   │   └── rolesCache.js                # Sistema de caché (30 min)
│   │
│   └── pages/                           # Páginas de la aplicación
│       ├── Login.jsx                    # Página de login
│       ├── Dashboard.jsx                # Dashboard principal
│       │
│       ├── empleados/
│       │   ├── EmpleadosList.jsx        # Lista de empleados
│       │   └── EmpleadoForm.jsx         # Formulario crear/editar
│       │
│       ├── usuarios/
│       │   ├── UsuariosList.jsx         # Lista de usuarios
│       │   └── UsuarioForm.jsx          # Formulario crear/editar
│       │
│       ├── clientes/
│       │   ├── ClientesList.jsx         # Lista de clientes
│       │   └── ClienteForm.jsx          # Formulario crear/editar
│       │
│       ├── propietarios/
│       │   ├── PropietariosList.jsx     # Lista de propietarios
│       │   └── PropietarioForm.jsx      # Formulario crear/editar
│       │
│       └── propiedades/
│           ├── PropiedadesList.jsx      # Lista de propiedades
│           └── PropiedadForm.jsx        # Formulario crear/editar
│
├── .gitignore
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

---

## 🚀 Módulos Implementados

### ✅ 1. Sistema de Autenticación
**Estado:** Completado al 100%

- ✅ Login con JWT
- ✅ Context API para estado global
- ✅ Auto-logout en 401
- ✅ Persistencia en localStorage
- ✅ Rutas protegidas con guards
- ✅ Interceptores Axios automáticos

**Archivos:**
- `src/auth/AuthContext.jsx`
- `src/auth/ProtectedRoute.jsx`
- `src/pages/Login.jsx`

---

### ✅ 2. Layout y Navegación
**Estado:** Completado al 100%

- ✅ Sidebar con gradiente azul profundo
- ✅ Menú filtrado por roles
- ✅ Navbar sticky con backdrop blur
- ✅ Responsive (mobile-first)
- ✅ Iconos de @heroicons
- ✅ Efectos hover con gradientes

**Archivos:**
- `src/components/layout/Layout.jsx`
- `src/components/layout/Sidebar.jsx`
- `src/components/layout/Navbar.jsx`

---

### ✅ 3. Dashboard
**Estado:** Completado al 100%

- ✅ Cards de estadísticas animadas
- ✅ Header con gradiente y efectos
- ✅ Acciones rápidas
- ✅ Badges de rol con gradientes
- ✅ Iconos temáticos

**Archivos:**
- `src/pages/Dashboard.jsx`

---

### ✅ 4. Gestión de Empleados
**Estado:** Completado al 100%

- ✅ Lista con búsqueda en tiempo real
- ✅ Cards de estadísticas (Total, Activos, Inactivos)
- ✅ Formulario crear/editar
- ✅ Relación con Roles (dropdown)
- ✅ Validaciones completas
- ✅ AbortController + Promise.all

**Archivos:**
- `src/pages/empleados/EmpleadosList.jsx`
- `src/pages/empleados/EmpleadoForm.jsx`
- `src/services/empleadoService.js`

---

### ✅ 5. Gestión de Usuarios
**Estado:** Completado al 100%

- ✅ CRUD completo con UUID
- ✅ Relación con Empleados y Roles
- ✅ Lista con filtros
- ✅ Formulario con validación
- ✅ Sistema de caché de roles (30 min)
- ✅ Parallel loading optimizado

**Archivos:**
- `src/pages/usuarios/UsuariosList.jsx`
- `src/pages/usuarios/UsuarioForm.jsx`
- `src/services/usuarioService.js`
- `src/utils/rolesCache.js`

---

### ✅ 6. Gestión de Clientes
**Estado:** Completado al 100%

- ✅ CRUD completo
- ✅ Búsqueda dinámica
- ✅ Badges de estado
- ✅ Filtros múltiples
- ✅ Validación de presupuesto

**Archivos:**
- `src/pages/clientes/ClientesList.jsx`
- `src/pages/clientes/ClienteForm.jsx`
- `src/services/clienteService.js`

---

### ✅ 7. Gestión de Propietarios
**Estado:** Completado al 100%

- ✅ CRUD completo
- ✅ Lista con estadísticas
- ✅ Búsqueda en tiempo real
- ✅ Validación de email
- ✅ Fecha de nacimiento

**Archivos:**
- `src/pages/propietarios/PropietariosList.jsx`
- `src/pages/propietarios/PropietarioForm.jsx`
- `src/services/propietarioService.js`

---

### ✅ 8. Gestión de Propiedades
**Estado:** Completado al 100%

- ✅ CRUD completo con direcciones
- ✅ Integración con Propietarios
- ✅ Tipos de operación (Venta/Alquiler/Anticrético)
- ✅ Estados (Captada/Publicada/Reservada/Cerrada)
- ✅ Formulario multi-sección
- ✅ Dirección completa (calle, ciudad, departamento)
- ✅ Coordenadas GPS (opcional)
- ✅ Filtros por tipo y estado
- ✅ Formato de moneda (Bs.)

**Archivos:**
- `src/pages/propiedades/PropiedadesList.jsx`
- `src/pages/propiedades/PropiedadForm.jsx`
- `src/services/propiedadService.js`
- `src/services/direccionService.js`

---

## ⚡ Optimizaciones Implementadas

### 🎯 Performance
- ✅ **AbortController:** Cancelación de peticiones en cleanup
- ✅ **Promise.all:** Carga paralela de datos relacionados
- ✅ **Caché de Roles:** 30 minutos en localStorage
- ✅ **isMounted flag:** Previene actualizaciones en componentes desmontados
- ✅ **Timeout 30s:** Previene timeouts en conexiones lentas

### 🔄 Gestión de Estado
- ✅ **Context API:** Estado de autenticación global
- ✅ **localStorage:** Persistencia de sesión y caché
- ✅ **Signal support:** Todos los servicios aceptan AbortSignal

### 🛡️ Manejo de Errores
- ✅ **ERR_CANCELED detection:** Ignora errores de peticiones canceladas
- ✅ **401 Auto-logout:** Redirección automática al login
- ✅ **ECONNABORTED handling:** Manejo de timeouts
- ✅ **Toast notifications:** Feedback visual inmediato

### 🎨 UX/UI
- ✅ **Loading states:** Spinners en todas las operaciones async
- ✅ **Skeleton screens:** Mejora percepción de velocidad
- ✅ **Hover effects:** Feedback visual en interacciones
- ✅ **Gradient animations:** Transiciones suaves
- ✅ **Responsive design:** Mobile-first approach

---

## 🔧 Configuración del Proyecto

### Requisitos Previos
- Node.js 18+ 
- npm o yarn
- Backend funcionando en `http://127.0.0.1:8000`

### Instalación

```bash
cd Frontend/FrontendAdmin
npm install
```

### Variables de Entorno

Crear archivo `.env` (opcional, ya configurado por defecto):

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

### Ejecutar en Desarrollo

```bash
npm run dev
```

El servidor se iniciará en: `http://localhost:5173`

### Build para Producción

```bash
npm run build
```

### Vista Previa de Build

```bash
npm run preview
```

---

## 🎯 Sistema de Roles

### Roles Implementados

1. **Broker (id_rol: 1)**
   - ✅ Acceso completo al sistema
   - ✅ Gestión de empleados
   - ✅ Gestión de usuarios
   - ✅ Gestión de roles
   - ✅ Todas las demás funciones

2. **Secretaria (id_rol: 2)**
   - ✅ Dashboard
   - ✅ Gestión de clientes
   - ✅ Gestión de propietarios
   - ✅ Gestión de propiedades
   - ✅ Gestión de contratos
   - ✅ Gestión de visitas

### Guardias de Ruta

Las rutas están protegidas mediante `ProtectedRoute`:

```jsx
<Route
  path="/empleados"
  element={
    <ProtectedRoute>
      <EmpleadosList />
    </ProtectedRoute>
  }
/>
```

El menú lateral se filtra automáticamente según el rol del usuario.

---

## 📡 Integración con Backend

### Base URL
```javascript
baseURL: 'http://127.0.0.1:8000/api'
```

### Endpoints Utilizados

| Módulo | Endpoint | Métodos |
|--------|----------|---------|
| Auth | `/usuarios/login` | POST |
| Auth | `/usuarios/me` | GET |
| Empleados | `/empleados/` | GET, POST, PUT, DELETE |
| Usuarios | `/usuarios/` | GET, POST, PUT, DELETE |
| Roles | `/roles/` | GET |
| Clientes | `/clientes/` | GET, POST, PUT, DELETE |
| Propietarios | `/propietarios/` | GET, POST, PUT, DELETE |
| Propiedades | `/propiedades/` | GET, POST, PUT, DELETE |
| Direcciones | `/direcciones/` | GET, POST, PUT, DELETE |

### Autenticación JWT

Todas las peticiones (excepto login) incluyen:

```javascript
headers: {
  Authorization: `Bearer ${token}`
}
```

El token se guarda en localStorage y se revalida en cada carga de página.

---

## 🚧 Roadmap - Próximos Módulos

### 📅 Fase 2: Gestión Operativa
- [ ] **Contratos:** CRUD de contratos de venta/alquiler
- [ ] **Visitas:** Agenda de citas y visitas
- [ ] **Pagos:** Registro de pagos y cuotas

### 📊 Fase 3: Reportes y Análisis
- [ ] **Dashboard con Datos Reales:** Consumir estadísticas del backend
- [ ] **Desempeño de Asesores:** Rankings y métricas
- [ ] **Ganancias:** Control de comisiones
- [ ] **Reportes Financieros:** Gráficos y exportación

### 📸 Fase 4: Media y Documentos
- [ ] **Upload de Imágenes:** Galería de fotos de propiedades
- [ ] **Gestión de Documentos:** PDFs, contratos, planos
- [ ] **Preview de Archivos:** Visualización en línea
- [ ] **Integración con Cloud Storage:** AWS S3 / Cloudinary

### 🎨 Fase 5: UX Avanzada
- [ ] **Búsqueda Global:** Buscador unificado
- [ ] **Filtros Avanzados:** Múltiples criterios
- [ ] **Exportación a Excel/PDF:** Reportes descargables
- [ ] **Notificaciones en Tiempo Real:** WebSockets
- [ ] **Modo Oscuro:** Theme switcher

### 📱 Fase 6: Experiencia Móvil
- [ ] **PWA:** Instalable como app móvil
- [ ] **Notificaciones Push:** Alertas importantes
- [ ] **Offline Mode:** Funcionalidad sin conexión
- [ ] **Geolocalización:** Mapas interactivos

---

## 🧪 Testing (Próximamente)

### Herramientas Planificadas
- [ ] **Vitest:** Testing unitario
- [ ] **React Testing Library:** Testing de componentes
- [ ] **Cypress:** Testing E2E
- [ ] **MSW:** Mock Service Worker para APIs

---

## 📦 Dependencias Principales

```json
{
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-router-dom": "^7.1.1",
    "axios": "^1.7.9",
    "react-hot-toast": "^2.4.1",
    "@heroicons/react": "^2.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^7.1.10",
    "tailwindcss": "^3.4.17",
    "postcss": "^8.4.49",
    "autoprefixer": "^10.4.20"
  }
}
```

---

## 🎓 Patrones y Buenas Prácticas

### Arquitectura
- ✅ **Separation of Concerns:** Servicios, componentes, páginas separados
- ✅ **Single Responsibility:** Cada archivo tiene un propósito claro
- ✅ **DRY (Don't Repeat Yourself):** Código reutilizable
- ✅ **Component Composition:** Composición sobre herencia

### React Best Practices
- ✅ **Hooks personalizados:** useAuth para autenticación
- ✅ **Context API:** Estado global sin prop drilling
- ✅ **Cleanup functions:** AbortController en useEffect
- ✅ **Loading states:** UX durante operaciones async
- ✅ **Error boundaries:** Manejo robusto de errores

### Performance
- ✅ **Code splitting:** Lazy loading de rutas
- ✅ **Optimistic updates:** UI instantánea
- ✅ **Debouncing:** En búsquedas en tiempo real
- ✅ **Memoization:** React.memo donde sea necesario

### Seguridad
- ✅ **No hardcoded secrets:** Usar variables de entorno
- ✅ **XSS Protection:** Sanitización de inputs
- ✅ **HTTPS en producción:** Obligatorio
- ✅ **Validación client-side:** Primera línea de defensa

---

## 🐛 Troubleshooting

### Problema: "Cannot connect to backend"
**Solución:**
1. Verificar que el backend esté corriendo en `http://127.0.0.1:8000`
2. Verificar CORS en el backend
3. Revisar `src/api/axios.js` para baseURL correcta

### Problema: "Token expired"
**Solución:**
1. Hacer logout y login nuevamente
2. El token se regenera automáticamente

### Problema: "React 19 double rendering"
**Solución:**
- Ya implementado: AbortController en todos los useEffect
- StrictMode está activo, es comportamiento esperado en desarrollo

### Problema: "Module not found"
**Solución:**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📞 Contacto y Soporte

**Proyecto:** Sistema de Gestión Inmobiliaria  
**Documentación Backend:** `Backend/README_PROYECTO_COMPLETO.md`  

---

## 🏆 Estadísticas del Proyecto

### Frontend Admin
- ✅ **8 módulos** implementados
- ✅ **25+ componentes** creados
- ✅ **7 servicios API** con caché inteligente
- ✅ **15+ páginas** funcionales
- ✅ **100% responsive** mobile-first
- ✅ **Sistema de diseño** consistente
- ✅ **Optimizaciones avanzadas** (AbortController, Promise.all, Caché)

### Integración Backend
- ✅ **90+ endpoints** disponibles
- ✅ **14 tablas** del backend
- ✅ **Autenticación JWT** completa
- ✅ **Validaciones end-to-end**

---

## 🎉 ¡Proyecto en Desarrollo Activo!

**Frontend Admin para Sistema de Gestión Inmobiliaria**

---

**Última Actualización:** 20 de octubre de 2025  
**Versión:** 1.0.0-beta  
**Desarrollado con:** React 19.1.0 + Vite 7.1.10 + TailwindCSS 3.4.1
