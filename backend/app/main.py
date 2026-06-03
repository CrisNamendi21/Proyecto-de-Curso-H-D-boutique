from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import get_db

#importacion de routers
from app.routers.auth.auth_router import router as auth_router
from app.routers.catalogos.categoria_router import router as categoria_router
from app.routers.catalogos.departamento_router import router as departamento_router
from app.routers.catalogos.talla_router import router as talla_router
from app.routers.catalogos.tipo_pago_router import router as tipo_pago_router
from app.routers.catalogos.municipio_router import router as municipio_router
from app.routers.clientes.direccion_cliente_router import router as direccion_cliente_router
from app.routers.empleados.direccion_empleado_router import router as direccion_empleado_router
from app.routers.proveedores.direccion_proveedor_router import router as direccion_proveedor_router
from app.routers.clientes.cliente_router import router as cliente_router
from app.routers.empleados.empleado_router import router as empleado_router
from app.routers.proveedores.proveedor_router import router as proveedor_router
from app.routers.productos.producto_router import router as producto_router
from app.routers.productos.producto_proveedor_router import router as producto_proveedor_router
from app.routers.compras.compra_router import router as compra_router
from app.routers.ventas.venta_router import router as venta_router
from app.routers.compras.detalle_compra_router import router as detalle_compra_router
from app.routers.ventas.detalle_venta_router import router as detalle_venta_router
from app.routers.ventas.recibo_router import router as recibo_router
from app.routers.ventas.pago_venta_router import router as pago_venta_router
from app.routers.devoluciones.devolucion_router import router as devolucion_router
from app.routers.devoluciones.detalle_devolucion_router import router as detalle_devolucion_router
from app.routers.dashboard.dashboard_router import router as dashboard_router
from app.routers.colaborador.colaborador_router import router as colaborador_router


app = FastAPI(
    title="H&D Boutique API",
    description="Backend del sistema web interno para H&D Boutique",
    version="1.0.0"
)

# Origenes usados por Vite en desarrollo local.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

##llamada a routers
app.include_router(auth_router)
app.include_router(categoria_router)
app.include_router(departamento_router)
app.include_router(talla_router)
app.include_router(tipo_pago_router)
app.include_router(municipio_router)

app.include_router(direccion_cliente_router)
app.include_router(direccion_empleado_router)
app.include_router(direccion_proveedor_router)
app.include_router(cliente_router)
app.include_router(empleado_router)
app.include_router(proveedor_router)

app.include_router(producto_router)
app.include_router(producto_proveedor_router)

app.include_router(compra_router)
app.include_router(venta_router)
app.include_router(detalle_compra_router)
app.include_router(detalle_venta_router)
app.include_router(recibo_router)
app.include_router(pago_venta_router)

app.include_router(devolucion_router)
app.include_router(detalle_devolucion_router)
app.include_router(dashboard_router)
app.include_router(colaborador_router)

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
