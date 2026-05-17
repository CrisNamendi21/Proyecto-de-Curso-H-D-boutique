from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.config import settings
from app.database import get_db
from app.routers.categoria_router import router as categoria_router

app = FastAPI(
    title="H&D Boutique API",
    description="Backend del sistema web interno para H&D Boutique",
    version="1.0.0"
)

app.include_router(categoria_router)


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