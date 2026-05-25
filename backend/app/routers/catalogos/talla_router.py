from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.catalogos.talla_model import Talla
from app.schemas.catalogos.talla_schema import (
    TallaCreate,
    TallaUpdate,
    TallaResponse,
)


router = APIRouter(
    prefix="/tallas",
    tags=["Tallas"]
)


@router.get("/", response_model=list[TallaResponse])
def listar_tallas(db: Session = Depends(get_db)):
    return db.query(Talla).all()


@router.get("/{id_talla}", response_model=TallaResponse)
def obtener_talla(id_talla: int, db: Session = Depends(get_db)):
    talla = db.query(Talla).filter(Talla.ID_Talla == id_talla).first()

    if not talla:
        raise HTTPException(status_code=404, detail="Talla no encontrada")

    return talla


@router.post("/", response_model=TallaResponse)
def crear_talla(talla: TallaCreate, db: Session = Depends(get_db)):
    nueva_talla = Talla(**talla.model_dump())

    db.add(nueva_talla)
    db.commit()
    db.refresh(nueva_talla)

    return nueva_talla


@router.put("/{id_talla}", response_model=TallaResponse)
def actualizar_talla(
    id_talla: int,
    talla_actualizada: TallaUpdate,
    db: Session = Depends(get_db)
):
    talla = db.query(Talla).filter(Talla.ID_Talla == id_talla).first()

    if not talla:
        raise HTTPException(status_code=404, detail="Talla no encontrada")

    datos_actualizados = talla_actualizada.model_dump(exclude_unset=True)

    for campo, valor in datos_actualizados.items():
        setattr(talla, campo, valor)

    db.commit()
    db.refresh(talla)

    return talla