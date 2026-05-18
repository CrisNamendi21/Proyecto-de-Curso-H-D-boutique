from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.tipo_pago_model import TipoPago
from app.schemas.tipo_pago_schema import (
    TipoPagoCreate,
    TipoPagoUpdate,
    TipoPagoResponse,
)


router = APIRouter(
    prefix="/tipos-pago",
    tags=["Tipos de pago"]
)


@router.get("/", response_model=list[TipoPagoResponse])
def listar_tipos_pago(db: Session = Depends(get_db)):
    return db.query(TipoPago).all()


@router.get("/{tipo_pago}", response_model=TipoPagoResponse)
def obtener_tipo_pago(tipo_pago: int, db: Session = Depends(get_db)):
    tipo_pago_encontrado = db.query(TipoPago).filter(
        TipoPago.Tipo_pago == tipo_pago
    ).first()

    if not tipo_pago_encontrado:
        raise HTTPException(status_code=404, detail="Tipo de pago no encontrado")

    return tipo_pago_encontrado


@router.post("/", response_model=TipoPagoResponse)
def crear_tipo_pago(tipo_pago: TipoPagoCreate, db: Session = Depends(get_db)):
    nuevo_tipo_pago = TipoPago(**tipo_pago.model_dump())

    db.add(nuevo_tipo_pago)
    db.commit()
    db.refresh(nuevo_tipo_pago)

    return nuevo_tipo_pago


@router.put("/{tipo_pago}", response_model=TipoPagoResponse)
def actualizar_tipo_pago(
    tipo_pago: int,
    tipo_pago_actualizado: TipoPagoUpdate,
    db: Session = Depends(get_db)
):
    tipo_pago_encontrado = db.query(TipoPago).filter(
        TipoPago.Tipo_pago == tipo_pago
    ).first()

    if not tipo_pago_encontrado:
        raise HTTPException(status_code=404, detail="Tipo de pago no encontrado")

    datos_actualizados = tipo_pago_actualizado.model_dump(exclude_unset=True)

    for campo, valor in datos_actualizados.items():
        setattr(tipo_pago_encontrado, campo, valor)

    db.commit()
    db.refresh(tipo_pago_encontrado)

    return tipo_pago_encontrado