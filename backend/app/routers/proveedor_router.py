from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.proveedor_model import Proveedor
from app.models.direccion_proveedor_model import DireccionProveedor
from app.schemas.proveedor_schema import (
    ProveedorCreate,
    ProveedorUpdate,
    ProveedorResponse,
)


router = APIRouter(
    prefix="/proveedores",
    tags=["Proveedores"]
)


@router.get("/", response_model=list[ProveedorResponse])
def listar_proveedores(db: Session = Depends(get_db)):
    return db.query(Proveedor).all()


@router.get("/{id_proveedor}", response_model=ProveedorResponse)
def obtener_proveedor(id_proveedor: int, db: Session = Depends(get_db)):
    proveedor = db.query(Proveedor).filter(
        Proveedor.ID_Proveedor == id_proveedor
    ).first()

    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")

    return proveedor


@router.post("/", response_model=ProveedorResponse)
def crear_proveedor(proveedor: ProveedorCreate, db: Session = Depends(get_db)):
    direccion = db.query(DireccionProveedor).filter(
        DireccionProveedor.ID_Direccion_proveedores == proveedor.ID_Direccion_proveedores
    ).first()

    if not direccion:
        raise HTTPException(status_code=404, detail="Dirección de proveedor no encontrada")

    nuevo_proveedor = Proveedor(**proveedor.model_dump())

    db.add(nuevo_proveedor)
    db.commit()
    db.refresh(nuevo_proveedor)

    return nuevo_proveedor


@router.put("/{id_proveedor}", response_model=ProveedorResponse)
def actualizar_proveedor(
    id_proveedor: int,
    proveedor_actualizado: ProveedorUpdate,
    db: Session = Depends(get_db)
):
    proveedor = db.query(Proveedor).filter(
        Proveedor.ID_Proveedor == id_proveedor
    ).first()

    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")

    datos_actualizados = proveedor_actualizado.model_dump(exclude_unset=True)

    if "ID_Direccion_proveedores" in datos_actualizados:
        direccion = db.query(DireccionProveedor).filter(
            DireccionProveedor.ID_Direccion_proveedores == datos_actualizados["ID_Direccion_proveedores"]
        ).first()

        if not direccion:
            raise HTTPException(status_code=404, detail="Dirección de proveedor no encontrada")

    for campo, valor in datos_actualizados.items():
        setattr(proveedor, campo, valor)

    db.commit()
    db.refresh(proveedor)

    return proveedor