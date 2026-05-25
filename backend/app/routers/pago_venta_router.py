from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.pago_venta_model import PagoVenta
from app.models.venta_model import Venta
from app.models.tipo_pago_model import TipoPago
from app.schemas.pago_venta_schema import (
    PagoVentaCreate,
    PagoVentaUpdate,
    PagoVentaResponse
)


router = APIRouter(
    prefix="/pagos-venta",
    tags=["Pagos Venta"]
)


@router.get("/", response_model=list[PagoVentaResponse])
def listar_pagos_venta(db: Session = Depends(get_db)):
    return db.query(PagoVenta).all()


@router.get("/{id_pago_venta}", response_model=PagoVentaResponse)
def obtener_pago_venta(id_pago_venta: int, db: Session = Depends(get_db)):
    pago_venta = db.query(PagoVenta).filter(
        PagoVenta.ID_PagoVenta == id_pago_venta
    ).first()

    if not pago_venta:
        raise HTTPException(status_code=404, detail="Pago de venta no encontrado")

    return pago_venta


@router.post("/", response_model=PagoVentaResponse)
def crear_pago_venta(pago_venta: PagoVentaCreate, db: Session = Depends(get_db)):
    venta = db.query(Venta).filter(
        Venta.ID_Venta == pago_venta.ID_Venta
    ).first()

    if not venta:
        raise HTTPException(
            status_code=404,
            detail="La venta indicada no existe"
        )

    tipo_pago = db.query(TipoPago).filter(
        TipoPago.Tipo_pago == pago_venta.Tipo_pago
    ).first()

    if not tipo_pago:
        raise HTTPException(
            status_code=404,
            detail="El tipo de pago indicado no existe"
        )

    nuevo_pago_venta = PagoVenta(
        ID_Venta=pago_venta.ID_Venta,
        Tipo_pago=pago_venta.Tipo_pago,
        Monto=pago_venta.Monto,
        Referencia=pago_venta.Referencia
    )

    db.add(nuevo_pago_venta)
    db.commit()
    db.refresh(nuevo_pago_venta)

    return nuevo_pago_venta


@router.put("/{id_pago_venta}", response_model=PagoVentaResponse)
def actualizar_pago_venta(
    id_pago_venta: int,
    pago_venta_actualizado: PagoVentaUpdate,
    db: Session = Depends(get_db)
):
    pago_venta = db.query(PagoVenta).filter(
        PagoVenta.ID_PagoVenta == id_pago_venta
    ).first()

    if not pago_venta:
        raise HTTPException(status_code=404, detail="Pago de venta no encontrado")

    datos_actualizados = pago_venta_actualizado.model_dump(exclude_unset=True)

    if "Tipo_pago" in datos_actualizados:
        tipo_pago = db.query(TipoPago).filter(
            TipoPago.Tipo_pago == datos_actualizados["Tipo_pago"]
        ).first()

        if not tipo_pago:
            raise HTTPException(
                status_code=404,
                detail="El tipo de pago indicado no existe"
            )

    for campo, valor in datos_actualizados.items():
        setattr(pago_venta, campo, valor)

    db.commit()
    db.refresh(pago_venta)

    return pago_venta