from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.departamento_model import Departamento
from app.schemas.departamento_schema import (
    DepartamentoCreate,
    DepartamentoUpdate,
    DepartamentoResponse,
)


router = APIRouter(
    prefix="/departamentos",
    tags=["Departamentos"]
)


@router.get("/", response_model=list[DepartamentoResponse])
def listar_departamentos(db: Session = Depends(get_db)):
    return db.query(Departamento).all()


@router.get("/{id_departamento}", response_model=DepartamentoResponse)
def obtener_departamento(id_departamento: int, db: Session = Depends(get_db)):
    departamento = db.query(Departamento).filter(
        Departamento.ID_Departamento == id_departamento
    ).first()

    if not departamento:
        raise HTTPException(status_code=404, detail="Departamento no encontrado")

    return departamento


@router.post("/", response_model=DepartamentoResponse)
def crear_departamento(departamento: DepartamentoCreate, db: Session = Depends(get_db)):
    nuevo_departamento = Departamento(**departamento.model_dump())

    db.add(nuevo_departamento)
    db.commit()
    db.refresh(nuevo_departamento)

    return nuevo_departamento


@router.put("/{id_departamento}", response_model=DepartamentoResponse)
def actualizar_departamento(
    id_departamento: int,
    departamento_actualizado: DepartamentoUpdate,
    db: Session = Depends(get_db)
):
    departamento = db.query(Departamento).filter(
        Departamento.ID_Departamento == id_departamento
    ).first()

    if not departamento:
        raise HTTPException(status_code=404, detail="Departamento no encontrado")

    datos_actualizados = departamento_actualizado.model_dump(exclude_unset=True)

    for campo, valor in datos_actualizados.items():
        setattr(departamento, campo, valor)

    db.commit()
    db.refresh(departamento)

    return departamento