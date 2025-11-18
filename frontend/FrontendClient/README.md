# InmobiliariaApp - Prototipo Frontend

Prototipo estático de una aplicación inmobiliaria construido con Astro. Este proyecto muestra un sitio web completo para gestión de propiedades inmobiliarias con navegación, catálogo, fichas de propiedad y vista de mapa.

## 🚀 Características

- ✅ **Página de inicio** con hero, propiedades destacadas y exploración por zonas
- ✅ **Catálogo de propiedades** con filtros avanzados y paginación
- ✅ **Fichas de propiedad** con galería de imágenes, características detalladas y CTA de contacto
- ✅ **Vista de mapa** con panel lateral de filtros y lista de propiedades
- ✅ **Sistema de diseño** con tokens CSS y componentes reutilizables
- ✅ **SEO optimizado** con meta tags, Open Graph y Twitter Cards
- ✅ **Responsive design** optimizado para móvil, tablet y desktop
- ✅ **Navegación intuitiva** con header sticky y footer completo
- ✅ **Página 404** personalizada

## 📁 Estructura del Proyecto

```
Frontend_Cliente/
├── src/
│   ├── components/           # Componentes reutilizables
│   │   ├── Header.astro      # Cabecera con navegación
│   │   ├── Footer.astro      # Pie de página
│   │   ├── PropiedadCard.astro  # Tarjeta de propiedad
│   │   └── Filtros.astro     # Componente de filtros
│   ├── data/
│   │   └── propiedades.ts    # Datos ficticios y funciones helper
│   ├── layouts/
│   │   └── Layout.astro      # Layout base con SEO
│   ├── pages/                # Páginas del sitio (enrutado automático)
│   │   ├── index.astro       # Página de inicio
│   │   ├── propiedades.astro # Catálogo con filtros
│   │   ├── mapa.astro        # Vista de mapa
│   │   ├── 404.astro         # Página de error
│   │   └── propiedad/
│   │       └── [slug].astro  # Ficha de propiedad (ruta dinámica)
│   └── styles/
│       ├── tokens.css        # Variables de diseño
│       └── global.css        # Estilos globales
├── public/                   # Archivos estáticos
└── astro.config.mjs
```

## 🧞 Comandos

Todos los comandos se ejecutan desde la raíz del proyecto en la terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
