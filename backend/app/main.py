"""
Punto de entrada de la aplicación FastAPI
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routes import usuarios, empleados, propietarios, clientes

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


# Incluir routers
app.include_router(usuarios.router, prefix="/api", tags=["Usuarios"])
app.include_router(empleados.router, prefix="/api", tags=["Empleados"])
app.include_router(propietarios.router, prefix="/api", tags=["Propietarios"])
app.include_router(clientes.router, prefix="/api", tags=["Clientes"])


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
