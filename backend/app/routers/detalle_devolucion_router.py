from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.detalle_devolucion_model import DetalleDevolucion
from app.models.devolucion_model import Devolucion
from app.models.detalle_venta_model import DetalleVenta
from app.schemas.detalle_devolucion_schema import (
    DetalleDevolucionCreate,
    DetalleDevolucionUpdate,
    DetalleDevolucionResponse,
)


router = APIRouter(
    prefix="/detalles-devoluciones",
    tags=["Detalles de devoluciones"]
)


@router.get("/", response_model=list[DetalleDevolucionResponse])
def listar_detalles_devoluciones(db: Session = Depends(get_db)):
    return db.query(DetalleDevolucion).all()


@router.get("/{id_detalle_devolucion}", response_model=DetalleDevolucionResponse)
def obtener_detalle_devolucion(
    id_detalle_devolucion: int,
    db: Session = Depends(get_db)
):
    detalle = db.query(DetalleDevolucion).filter(
        DetalleDevolucion.ID_DetalleDevolucion == id_detalle_devolucion
    ).first()

    if not detalle:
        raise HTTPException(
            status_code=404,
            detail="Detalle de devolución no encontrado"
        )

    return detalle


@router.post("/", response_model=DetalleDevolucionResponse)
def crear_detalle_devolucion(
    detalle: DetalleDevolucionCreate,
    db: Session = Depends(get_db)
):
    devolucion = db.query(Devolucion).filter(
        Devolucion.ID_Devolucion == detalle.ID_Devolucion
    ).first()

    if not devolucion:
        raise HTTPException(status_code=404, detail="Devolución no encontrada")

    detalle_venta = db.query(DetalleVenta).filter(
        DetalleVenta.ID_DetalleVenta == detalle.ID_DetalleVenta
    ).first()

    if not detalle_venta:
        raise HTTPException(status_code=404, detail="Detalle de venta no encontrado")

    nuevo_detalle = DetalleDevolucion(**detalle.model_dump())

    db.add(nuevo_detalle)
    db.commit()
    db.refresh(nuevo_detalle)

    return nuevo_detalle


@router.put("/{id_detalle_devolucion}", response_model=DetalleDevolucionResponse)
def actualizar_detalle_devolucion(
    id_detalle_devolucion: int,
    detalle_actualizado: DetalleDevolucionUpdate,
    db: Session = Depends(get_db)
):
    detalle = db.query(DetalleDevolucion).filter(
        DetalleDevolucion.ID_DetalleDevolucion == id_detalle_devolucion
    ).first()

    if not detalle:
        raise HTTPException(
            status_code=404,
            detail="Detalle de devolución no encontrado"
        )

    datos_actualizados = detalle_actualizado.model_dump(exclude_unset=True)

    if "ID_Devolucion" in datos_actualizados:
        devolucion = db.query(Devolucion).filter(
            Devolucion.ID_Devolucion == datos_actualizados["ID_Devolucion"]
        ).first()

        if not devolucion:
            raise HTTPException(status_code=404, detail="Devolución no encontrada")

    if "ID_DetalleVenta" in datos_actualizados:
        detalle_venta = db.query(DetalleVenta).filter(
            DetalleVenta.ID_DetalleVenta == datos_actualizados["ID_DetalleVenta"]
        ).first()

        if not detalle_venta:
            raise HTTPException(status_code=404, detail="Detalle de venta no encontrado")

    for campo, valor in datos_actualizados.items():
        setattr(detalle, campo, valor)

    db.commit()
    db.refresh(detalle)

    return detalle