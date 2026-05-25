from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.devoluciones.devolucion_model import Devolucion
from app.models.ventas.venta_model import Venta
from app.schemas.devoluciones.devolucion_schema import (
    DevolucionCreate,
    DevolucionUpdate,
    DevolucionResponse,
)


router = APIRouter(
    prefix="/devoluciones",
    tags=["Devoluciones"]
)


@router.get("/", response_model=list[DevolucionResponse])
def listar_devoluciones(db: Session = Depends(get_db)):
    return db.query(Devolucion).all()


@router.get("/{id_devolucion}", response_model=DevolucionResponse)
def obtener_devolucion(id_devolucion: int, db: Session = Depends(get_db)):
    devolucion = db.query(Devolucion).filter(
        Devolucion.ID_Devolucion == id_devolucion
    ).first()

    if not devolucion:
        raise HTTPException(status_code=404, detail="Devolución no encontrada")

    return devolucion


@router.post("/", response_model=DevolucionResponse)
def crear_devolucion(
    devolucion: DevolucionCreate,
    db: Session = Depends(get_db)
):
    venta = db.query(Venta).filter(
        Venta.ID_Venta == devolucion.ID_Venta
    ).first()

    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")

    nueva_devolucion = Devolucion(**devolucion.model_dump())

    db.add(nueva_devolucion)
    db.commit()
    db.refresh(nueva_devolucion)

    return nueva_devolucion


@router.put("/{id_devolucion}", response_model=DevolucionResponse)
def actualizar_devolucion(
    id_devolucion: int,
    devolucion_actualizada: DevolucionUpdate,
    db: Session = Depends(get_db)
):
    devolucion = db.query(Devolucion).filter(
        Devolucion.ID_Devolucion == id_devolucion
    ).first()

    if not devolucion:
        raise HTTPException(status_code=404, detail="Devolución no encontrada")

    datos_actualizados = devolucion_actualizada.model_dump(exclude_unset=True)

    if "ID_Venta" in datos_actualizados:
        venta = db.query(Venta).filter(
            Venta.ID_Venta == datos_actualizados["ID_Venta"]
        ).first()

        if not venta:
            raise HTTPException(status_code=404, detail="Venta no encontrada")

    for campo, valor in datos_actualizados.items():
        setattr(devolucion, campo, valor)

    db.commit()
    db.refresh(devolucion)

    return devolucion