from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.clientes.cliente_model import Cliente
from app.models.clientes.direccion_cliente_model import DireccionCliente
from app.schemas.clientes.cliente_schema import (
    ClienteCreate,
    ClienteUpdate,
    ClienteResponse,
)


router = APIRouter(
    prefix="/clientes",
    tags=["Clientes"]
)


@router.get("/", response_model=list[ClienteResponse])
def listar_clientes(db: Session = Depends(get_db)):
    return db.query(Cliente).all()


@router.get("/{id_cliente}", response_model=ClienteResponse)
def obtener_cliente(id_cliente: int, db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(
        Cliente.ID_Cliente == id_cliente
    ).first()

    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    return cliente


@router.post("/", response_model=ClienteResponse)
def crear_cliente(cliente: ClienteCreate, db: Session = Depends(get_db)):
    direccion = db.query(DireccionCliente).filter(
        DireccionCliente.ID_Direccion == cliente.ID_Direccion
    ).first()

    if not direccion:
        raise HTTPException(status_code=404, detail="Dirección de cliente no encontrada")

    nuevo_cliente = Cliente(**cliente.model_dump())

    db.add(nuevo_cliente)
    db.commit()
    db.refresh(nuevo_cliente)

    return nuevo_cliente


@router.put("/{id_cliente}", response_model=ClienteResponse)
def actualizar_cliente(
    id_cliente: int,
    cliente_actualizado: ClienteUpdate,
    db: Session = Depends(get_db)
):
    cliente = db.query(Cliente).filter(
        Cliente.ID_Cliente == id_cliente
    ).first()

    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    datos_actualizados = cliente_actualizado.model_dump(exclude_unset=True)

    if "ID_Direccion" in datos_actualizados:
        direccion = db.query(DireccionCliente).filter(
            DireccionCliente.ID_Direccion == datos_actualizados["ID_Direccion"]
        ).first()

        if not direccion:
            raise HTTPException(status_code=404, detail="Dirección de cliente no encontrada")

    for campo, valor in datos_actualizados.items():
        setattr(cliente, campo, valor)

    db.commit()
    db.refresh(cliente)

    return cliente