from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.catalogos.municipio_model import Municipio
from app.models.catalogos.departamento_model import Departamento
from app.schemas.catalogos.municipio_schema import (
    MunicipioCreate,
    MunicipioUpdate,
    MunicipioResponse,
)


router = APIRouter(
    prefix="/municipios",
    tags=["Municipios"]
)


@router.get("/", response_model=list[MunicipioResponse])
def listar_municipios(db: Session = Depends(get_db)):
    return db.query(Municipio).all()


@router.get("/{id_municipio}", response_model=MunicipioResponse)
def obtener_municipio(id_municipio: int, db: Session = Depends(get_db)):
    municipio = db.query(Municipio).filter(
        Municipio.ID_Municipio == id_municipio
    ).first()

    if not municipio:
        raise HTTPException(status_code=404, detail="Municipio no encontrado")

    return municipio


@router.post("/", response_model=MunicipioResponse)
def crear_municipio(municipio: MunicipioCreate, db: Session = Depends(get_db)):
    departamento = db.query(Departamento).filter(
        Departamento.ID_Departamento == municipio.ID_Departamento
    ).first()

    if not departamento:
        raise HTTPException(status_code=404, detail="Departamento no encontrado")

    nuevo_municipio = Municipio(**municipio.model_dump())

    db.add(nuevo_municipio)
    db.commit()
    db.refresh(nuevo_municipio)

    return nuevo_municipio


@router.put("/{id_municipio}", response_model=MunicipioResponse)
def actualizar_municipio(
    id_municipio: int,
    municipio_actualizado: MunicipioUpdate,
    db: Session = Depends(get_db)
):
    municipio = db.query(Municipio).filter(
        Municipio.ID_Municipio == id_municipio
    ).first()

    if not municipio:
        raise HTTPException(status_code=404, detail="Municipio no encontrado")

    datos_actualizados = municipio_actualizado.model_dump(exclude_unset=True)

    if "ID_Departamento" in datos_actualizados:
        departamento = db.query(Departamento).filter(
            Departamento.ID_Departamento == datos_actualizados["ID_Departamento"]
        ).first()

        if not departamento:
            raise HTTPException(status_code=404, detail="Departamento no encontrado")

    for campo, valor in datos_actualizados.items():
        setattr(municipio, campo, valor)

    db.commit()
    db.refresh(municipio)

    return municipio