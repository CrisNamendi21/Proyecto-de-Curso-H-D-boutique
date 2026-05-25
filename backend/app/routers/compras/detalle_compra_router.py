from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.compras.detalle_compra_model import DetalleCompra
from app.models.compras.compra_model import Compra
from app.models.productos.producto_proveedor_model import ProductoProveedor
from app.schemas.compras.detalle_compra_schema import (
    DetalleCompraCreate,
    DetalleCompraUpdate,
    DetalleCompraResponse,
)


router = APIRouter(
    prefix="/detalles-compras",
    tags=["Detalles de compras"]
)


@router.get("/", response_model=list[DetalleCompraResponse])
def listar_detalles_compras(db: Session = Depends(get_db)):
    return db.query(DetalleCompra).all()


@router.get("/{id_detalle_compra}", response_model=DetalleCompraResponse)
def obtener_detalle_compra(
    id_detalle_compra: int,
    db: Session = Depends(get_db)
):
    detalle = db.query(DetalleCompra).filter(
        DetalleCompra.ID_DetalleCompra == id_detalle_compra
    ).first()

    if not detalle:
        raise HTTPException(status_code=404, detail="Detalle de compra no encontrado")

    return detalle


@router.post("/", response_model=DetalleCompraResponse)
def crear_detalle_compra(
    detalle: DetalleCompraCreate,
    db: Session = Depends(get_db)
):
    compra = db.query(Compra).filter(
        Compra.ID_Compra == detalle.ID_Compra
    ).first()

    if not compra:
        raise HTTPException(status_code=404, detail="Compra no encontrada")

    producto_proveedor = db.query(ProductoProveedor).filter(
        ProductoProveedor.ID_ProductoProveedor == detalle.ID_ProductoProveedor
    ).first()

    if not producto_proveedor:
        raise HTTPException(
            status_code=404,
            detail="Relación producto-proveedor no encontrada"
        )

    nuevo_detalle = DetalleCompra(**detalle.model_dump())

    db.add(nuevo_detalle)
    db.commit()
    db.refresh(nuevo_detalle)

    return nuevo_detalle


@router.put("/{id_detalle_compra}", response_model=DetalleCompraResponse)
def actualizar_detalle_compra(
    id_detalle_compra: int,
    detalle_actualizado: DetalleCompraUpdate,
    db: Session = Depends(get_db)
):
    detalle = db.query(DetalleCompra).filter(
        DetalleCompra.ID_DetalleCompra == id_detalle_compra
    ).first()

    if not detalle:
        raise HTTPException(status_code=404, detail="Detalle de compra no encontrado")

    datos_actualizados = detalle_actualizado.model_dump(exclude_unset=True)

    if "ID_Compra" in datos_actualizados:
        compra = db.query(Compra).filter(
            Compra.ID_Compra == datos_actualizados["ID_Compra"]
        ).first()

        if not compra:
            raise HTTPException(status_code=404, detail="Compra no encontrada")

    if "ID_ProductoProveedor" in datos_actualizados:
        producto_proveedor = db.query(ProductoProveedor).filter(
            ProductoProveedor.ID_ProductoProveedor == datos_actualizados["ID_ProductoProveedor"]
        ).first()

        if not producto_proveedor:
            raise HTTPException(
                status_code=404,
                detail="Relación producto-proveedor no encontrada"
            )

    for campo, valor in datos_actualizados.items():
        setattr(detalle, campo, valor)

    db.commit()
    db.refresh(detalle)

    return detalle