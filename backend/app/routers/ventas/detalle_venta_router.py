from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.ventas.detalle_venta_model import DetalleVenta
from app.models.ventas.venta_model import Venta
from app.models.productos.producto_model import Producto
from app.schemas.ventas.detalle_venta_schema import (
    DetalleVentaCreate,
    DetalleVentaUpdate,
    DetalleVentaResponse,
)


router = APIRouter(
    prefix="/detalles-ventas",
    tags=["Detalles de ventas"]
)


@router.get("/", response_model=list[DetalleVentaResponse])
def listar_detalles_ventas(db: Session = Depends(get_db)):
    return db.query(DetalleVenta).all()


@router.get("/{id_detalle_venta}", response_model=DetalleVentaResponse)
def obtener_detalle_venta(
    id_detalle_venta: int,
    db: Session = Depends(get_db)
):
    detalle = db.query(DetalleVenta).filter(
        DetalleVenta.ID_DetalleVenta == id_detalle_venta
    ).first()

    if not detalle:
        raise HTTPException(status_code=404, detail="Detalle de venta no encontrado")

    return detalle


@router.post("/", response_model=DetalleVentaResponse)
def crear_detalle_venta(
    detalle: DetalleVentaCreate,
    db: Session = Depends(get_db)
):
    venta = db.query(Venta).filter(
        Venta.ID_Venta == detalle.ID_Venta
    ).first()

    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")

    producto = db.query(Producto).filter(
        Producto.ID_Producto == detalle.ID_Producto
    ).first()

    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    nuevo_detalle = DetalleVenta(**detalle.model_dump())

    db.add(nuevo_detalle)
    db.commit()
    db.refresh(nuevo_detalle)

    return nuevo_detalle


@router.put("/{id_detalle_venta}", response_model=DetalleVentaResponse)
def actualizar_detalle_venta(
    id_detalle_venta: int,
    detalle_actualizado: DetalleVentaUpdate,
    db: Session = Depends(get_db)
):
    detalle = db.query(DetalleVenta).filter(
        DetalleVenta.ID_DetalleVenta == id_detalle_venta
    ).first()

    if not detalle:
        raise HTTPException(status_code=404, detail="Detalle de venta no encontrado")

    datos_actualizados = detalle_actualizado.model_dump(exclude_unset=True)

    if "ID_Venta" in datos_actualizados:
        venta = db.query(Venta).filter(
            Venta.ID_Venta == datos_actualizados["ID_Venta"]
        ).first()

        if not venta:
            raise HTTPException(status_code=404, detail="Venta no encontrada")

    if "ID_Producto" in datos_actualizados:
        producto = db.query(Producto).filter(
            Producto.ID_Producto == datos_actualizados["ID_Producto"]
        ).first()

        if not producto:
            raise HTTPException(status_code=404, detail="Producto no encontrado")

    for campo, valor in datos_actualizados.items():
        setattr(detalle, campo, valor)

    db.commit()
    db.refresh(detalle)

    return detalle