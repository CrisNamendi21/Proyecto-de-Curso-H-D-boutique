from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.empleados.empleado_model import Empleado
from app.models.empleados.direccion_empleado_model import DireccionEmpleado
from app.schemas.empleados.empleado_schema import (
    EmpleadoCreate,
    EmpleadoUpdate,
    EmpleadoResponse,
)


router = APIRouter(
    prefix="/empleados",
    tags=["Empleados"]
)


@router.get("/", response_model=list[EmpleadoResponse])
def listar_empleados(db: Session = Depends(get_db)):
    return db.query(Empleado).all()


@router.get("/{id_empleado}", response_model=EmpleadoResponse)
def obtener_empleado(id_empleado: int, db: Session = Depends(get_db)):
    empleado = db.query(Empleado).filter(
        Empleado.ID_Empleado == id_empleado
    ).first()

    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    return empleado


@router.post("/", response_model=EmpleadoResponse)
def crear_empleado(empleado: EmpleadoCreate, db: Session = Depends(get_db)):
    direccion = db.query(DireccionEmpleado).filter(
        DireccionEmpleado.ID_Direccion_empleado == empleado.ID_Direccion_empleado
    ).first()

    if not direccion:
        raise HTTPException(status_code=404, detail="Dirección de empleado no encontrada")

    nuevo_empleado = Empleado(**empleado.model_dump())

    db.add(nuevo_empleado)
    db.commit()
    db.refresh(nuevo_empleado)

    return nuevo_empleado


@router.put("/{id_empleado}", response_model=EmpleadoResponse)
def actualizar_empleado(
    id_empleado: int,
    empleado_actualizado: EmpleadoUpdate,
    db: Session = Depends(get_db)
):
    empleado = db.query(Empleado).filter(
        Empleado.ID_Empleado == id_empleado
    ).first()

    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    datos_actualizados = empleado_actualizado.model_dump(exclude_unset=True)

    if "ID_Direccion_empleado" in datos_actualizados:
        direccion = db.query(DireccionEmpleado).filter(
            DireccionEmpleado.ID_Direccion_empleado == datos_actualizados["ID_Direccion_empleado"]
        ).first()

        if not direccion:
            raise HTTPException(status_code=404, detail="Dirección de empleado no encontrada")

    for campo, valor in datos_actualizados.items():
        setattr(empleado, campo, valor)

    db.commit()
    db.refresh(empleado)

    return empleado