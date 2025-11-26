"""
Punto de entrada de la aplicación FastAPI
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import get_settings
from app.routes import usuarios, empleados, propietarios, clientes, direcciones, propiedades, imagenes_propiedad, documentos_propiedad, citas_visita, contratos_operacion, pagos, roles, desempeno_asesor, ganancias_empleado, detalle_propiedad
import os

settings = get_settings()

# Crear instancia de FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="API REST para Sistema de Gestión Inmobiliaria",
    debug=settings.DEBUG
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar los orígenes permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 📂 Crear carpeta uploads si no existe
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(uploads_dir, exist_ok=True)

# 🖼️ Servir archivos estáticos (imágenes subidas)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


# Incluir routers
app.include_router(usuarios.router, prefix="/api", tags=["Usuarios"])
app.include_router(empleados.router, prefix="/api", tags=["Empleados"])
app.include_router(propietarios.router, prefix="/api", tags=["Propietarios"])
app.include_router(clientes.router, prefix="/api", tags=["Clientes"])
app.include_router(direcciones.router, prefix="/api", tags=["Direcciones"])
app.include_router(propiedades.router, prefix="/api", tags=["Propiedades"])
app.include_router(imagenes_propiedad.router, prefix="/api", tags=["Imágenes de Propiedades"])
app.include_router(documentos_propiedad.router, prefix="/api", tags=["Documentos de Propiedades"])
app.include_router(citas_visita.router, prefix="/api", tags=["Citas de Visita"])
app.include_router(contratos_operacion.router, prefix="/api", tags=["Contratos de Operación"])
app.include_router(pagos.router, prefix="/api", tags=["Pagos"])
app.include_router(roles.router, prefix="/api", tags=["Roles"])
app.include_router(desempeno_asesor.router, prefix="/api", tags=["Desempeño de Asesores"])
app.include_router(ganancias_empleado.router, prefix="/api", tags=["Ganancias de Empleados"])
app.include_router(detalle_propiedad.router, prefix="/api", tags=["Detalle de Propiedades"])


@app.get("/")
async def root():
    """Endpoint raíz"""
    return {
        "message": f"Bienvenido a {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "status": "online"
    }


@app.get("/health")
async def health_check():
    """Endpoint de health check"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
