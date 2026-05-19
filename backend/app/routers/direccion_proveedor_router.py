from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.departamento_model import Departamento
from app.models.direccion_proveedor_model import DireccionProveedor
from app.schemas.direccion_proveedor_schema import (
    DireccionProveedorCreate,
    DireccionProveedorUpdate,
    DireccionProveedorResponse,
)


router = APIRouter(
    prefix="/direcciones-proveedores",
    tags=["Direcciones de proveedores"]
)


@router.get("/", response_model=list[DireccionProveedorResponse])
def listar_direcciones_proveedores(db: Session = Depends(get_db)):
    return db.query(DireccionProveedor).all()


@router.get("/{id_direccion_proveedores}", response_model=DireccionProveedorResponse)
def obtener_direccion_proveedor(
    id_direccion_proveedores: int,
    db: Session = Depends(get_db)
):
    direccion = db.query(DireccionProveedor).filter(
        DireccionProveedor.ID_Direccion_proveedores == id_direccion_proveedores
    ).first()

    if not direccion:
        raise HTTPException(status_code=404, detail="Dirección de proveedor no encontrada")

    return direccion


@router.post("/", response_model=DireccionProveedorResponse)
def crear_direccion_proveedor(
    direccion: DireccionProveedorCreate,
    db: Session = Depends(get_db)
):
    departamento = db.query(Departamento).filter(
        Departamento.ID_Departamento == direccion.Departamento
    ).first()

    if not departamento:
        raise HTTPException(status_code=404, detail="Departamento no encontrado")

    nueva_direccion = DireccionProveedor(**direccion.model_dump())

    db.add(nueva_direccion)
    db.commit()
    db.refresh(nueva_direccion)

    return nueva_direccion


@router.put("/{id_direccion_proveedores}", response_model=DireccionProveedorResponse)
def actualizar_direccion_proveedor(
    id_direccion_proveedores: int,
    direccion_actualizada: DireccionProveedorUpdate,
    db: Session = Depends(get_db)
):
    direccion = db.query(DireccionProveedor).filter(
        DireccionProveedor.ID_Direccion_proveedores == id_direccion_proveedores
    ).first()

    if not direccion:
        raise HTTPException(status_code=404, detail="Dirección de proveedor no encontrada")

    datos_actualizados = direccion_actualizada.model_dump(exclude_unset=True)

    if "Departamento" in datos_actualizados:
        departamento = db.query(Departamento).filter(
            Departamento.ID_Departamento == datos_actualizados["Departamento"]
        ).first()

        if not departamento:
            raise HTTPException(status_code=404, detail="Departamento no encontrado")

    for campo, valor in datos_actualizados.items():
        setattr(direccion, campo, valor)

    db.commit()
    db.refresh(direccion)

    return direccion