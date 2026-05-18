from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.config import settings
from app.database import get_db

#IMPORTACION de los routers
from app.routers.categoria_router import router as categoria_router
from app.routers.departamento_router import router as departamento_router
from app.routers.talla_router import router as talla_router
from app.routers.tipo_pago_router import router as tipo_pago_router
from app.routers.municipio_router import router as municipio_router


app = FastAPI(
    title="H&D Boutique API",
    description="Backend del sistema web interno para H&D Boutique",
    version="1.0.0"
)


#Registros de los routers
app.include_router(categoria_router)
app.include_router(departamento_router)
app.include_router(talla_router)
app.include_router(tipo_pago_router)
app.include_router(municipio_router)



@app.get("/")
def inicio():
    return {
        "mensaje": "Backend H&D Boutique funcionando",
        "base_datos": settings.DB_NAME
    }


@app.get("/db-test")
def probar_base_datos(db: Session = Depends(get_db)):
    resultado = db.execute(text("SELECT 1 AS conexion")).fetchone()

    return {
        "mensaje": "Conexión a SQL Server correcta",
        "resultado": resultado.conexion
    }