from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.recibo_model import Recibo
from app.models.venta_model import Venta
from app.schemas.recibo_schema import ReciboCreate, ReciboUpdate, ReciboResponse


router = APIRouter(
    prefix="/recibos",
    tags=["Recibos"]
)


@router.get("/", response_model=list[ReciboResponse])
def listar_recibos(db: Session = Depends(get_db)):
    return db.query(Recibo).all()


@router.get("/{id_recibo}", response_model=ReciboResponse)
def obtener_recibo(id_recibo: int, db: Session = Depends(get_db)):
    recibo = db.query(Recibo).filter(Recibo.ID_Recibo == id_recibo).first()

    if not recibo:
        raise HTTPException(status_code=404, detail="Recibo no encontrado")

    return recibo


@router.post("/", response_model=ReciboResponse)
def crear_recibo(recibo: ReciboCreate, db: Session = Depends(get_db)):
    venta = db.query(Venta).filter(Venta.ID_Venta == recibo.ID_Venta).first()

    if not venta:
        raise HTTPException(
            status_code=404,
            detail="La venta indicada no existe"
        )

    recibo_existente = db.query(Recibo).filter(
        Recibo.ID_Venta == recibo.ID_Venta
    ).first()

    if recibo_existente:
        raise HTTPException(
            status_code=400,
            detail="Esta venta ya tiene un recibo registrado"
        )

    nuevo_recibo = Recibo(
        ID_Venta=recibo.ID_Venta,
        FechaEmision=recibo.FechaEmision,
        Estado=recibo.Estado,
        Observacion=recibo.Observacion
    )

    db.add(nuevo_recibo)
    db.commit()
    db.refresh(nuevo_recibo)

    return nuevo_recibo


@router.put("/{id_recibo}", response_model=ReciboResponse)
def actualizar_recibo(
    id_recibo: int,
    recibo_actualizado: ReciboUpdate,
    db: Session = Depends(get_db)
):
    recibo = db.query(Recibo).filter(Recibo.ID_Recibo == id_recibo).first()

    if not recibo:
        raise HTTPException(status_code=404, detail="Recibo no encontrado")

    datos_actualizados = recibo_actualizado.model_dump(exclude_unset=True)

    for campo, valor in datos_actualizados.items():
        setattr(recibo, campo, valor)

    db.commit()
    db.refresh(recibo)

    return recibo