from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.compras.compra_model import Compra
from app.models.empleados.empleado_model import Empleado
from app.models.proveedores.proveedor_model import Proveedor
from app.schemas.compras.compra_schema import (
    CompraCreate,
    CompraUpdate,
    CompraResponse,
)


router = APIRouter(
    prefix="/compras",
    tags=["Compras"]
)


@router.get("/", response_model=list[CompraResponse])
def listar_compras(db: Session = Depends(get_db)):
    return db.query(Compra).all()


@router.get("/{id_compra}", response_model=CompraResponse)
def obtener_compra(id_compra: int, db: Session = Depends(get_db)):
    compra = db.query(Compra).filter(
        Compra.ID_Compra == id_compra
    ).first()

    if not compra:
        raise HTTPException(status_code=404, detail="Compra no encontrada")

    return compra


@router.post("/", response_model=CompraResponse)
def crear_compra(compra: CompraCreate, db: Session = Depends(get_db)):
    proveedor = db.query(Proveedor).filter(
        Proveedor.ID_Proveedor == compra.ID_Proveedor
    ).first()

    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")

    empleado = db.query(Empleado).filter(
        Empleado.ID_Empleado == compra.ID_Empleado
    ).first()

    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    nueva_compra = Compra(**compra.model_dump())

    db.add(nueva_compra)
    db.commit()
    db.refresh(nueva_compra)

    return nueva_compra


@router.put("/{id_compra}", response_model=CompraResponse)
def actualizar_compra(
    id_compra: int,
    compra_actualizada: CompraUpdate,
    db: Session = Depends(get_db)
):
    compra = db.query(Compra).filter(
        Compra.ID_Compra == id_compra
    ).first()

    if not compra:
        raise HTTPException(status_code=404, detail="Compra no encontrada")

    datos_actualizados = compra_actualizada.model_dump(exclude_unset=True)

    if "ID_Proveedor" in datos_actualizados:
        proveedor = db.query(Proveedor).filter(
            Proveedor.ID_Proveedor == datos_actualizados["ID_Proveedor"]
        ).first()

        if not proveedor:
            raise HTTPException(status_code=404, detail="Proveedor no encontrado")

    if "ID_Empleado" in datos_actualizados:
        empleado = db.query(Empleado).filter(
            Empleado.ID_Empleado == datos_actualizados["ID_Empleado"]
        ).first()

        if not empleado:
            raise HTTPException(status_code=404, detail="Empleado no encontrado")

    for campo, valor in datos_actualizados.items():
        setattr(compra, campo, valor)

    db.commit()
    db.refresh(compra)

    return compra