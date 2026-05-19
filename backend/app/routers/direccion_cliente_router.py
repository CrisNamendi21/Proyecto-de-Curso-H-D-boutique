from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.departamento_model import Departamento
from app.models.direccion_cliente_model import DireccionCliente
from app.schemas.direccion_cliente_schema import (
    DireccionClienteCreate,
    DireccionClienteUpdate,
    DireccionClienteResponse,
)


router = APIRouter(
    prefix="/direcciones-clientes",
    tags=["Direcciones de clientes"]
)


@router.get("/", response_model=list[DireccionClienteResponse])
def listar_direcciones_clientes(db: Session = Depends(get_db)):
    return db.query(DireccionCliente).all()


@router.get("/{id_direccion}", response_model=DireccionClienteResponse)
def obtener_direccion_cliente(id_direccion: int, db: Session = Depends(get_db)):
    direccion = db.query(DireccionCliente).filter(
        DireccionCliente.ID_Direccion == id_direccion
    ).first()

    if not direccion:
        raise HTTPException(status_code=404, detail="Dirección de cliente no encontrada")

    return direccion


@router.post("/", response_model=DireccionClienteResponse)
def crear_direccion_cliente(
    direccion: DireccionClienteCreate,
    db: Session = Depends(get_db)
):
    departamento = db.query(Departamento).filter(
        Departamento.ID_Departamento == direccion.ID_Departamento
    ).first()

    if not departamento:
        raise HTTPException(status_code=404, detail="Departamento no encontrado")

    nueva_direccion = DireccionCliente(**direccion.model_dump())

    db.add(nueva_direccion)
    db.commit()
    db.refresh(nueva_direccion)

    return nueva_direccion


@router.put("/{id_direccion}", response_model=DireccionClienteResponse)
def actualizar_direccion_cliente(
    id_direccion: int,
    direccion_actualizada: DireccionClienteUpdate,
    db: Session = Depends(get_db)
):
    direccion = db.query(DireccionCliente).filter(
        DireccionCliente.ID_Direccion == id_direccion
    ).first()

    if not direccion:
        raise HTTPException(status_code=404, detail="Dirección de cliente no encontrada")

    datos_actualizados = direccion_actualizada.model_dump(exclude_unset=True)

    if "ID_Departamento" in datos_actualizados:
        departamento = db.query(Departamento).filter(
            Departamento.ID_Departamento == datos_actualizados["ID_Departamento"]
        ).first()

        if not departamento:
            raise HTTPException(status_code=404, detail="Departamento no encontrado")

    for campo, valor in datos_actualizados.items():
        setattr(direccion, campo, valor)

    db.commit()
    db.refresh(direccion)

    return direccion