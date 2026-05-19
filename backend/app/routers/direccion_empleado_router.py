from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.departamento_model import Departamento
from app.models.direccion_empleado_model import DireccionEmpleado
from app.schemas.direccion_empleado_schema import (
    DireccionEmpleadoCreate,
    DireccionEmpleadoUpdate,
    DireccionEmpleadoResponse,
)


router = APIRouter(
    prefix="/direcciones-empleados",
    tags=["Direcciones de empleados"]
)


@router.get("/", response_model=list[DireccionEmpleadoResponse])
def listar_direcciones_empleados(db: Session = Depends(get_db)):
    return db.query(DireccionEmpleado).all()


@router.get("/{id_direccion_empleado}", response_model=DireccionEmpleadoResponse)
def obtener_direccion_empleado(
    id_direccion_empleado: int,
    db: Session = Depends(get_db)
):
    direccion = db.query(DireccionEmpleado).filter(
        DireccionEmpleado.ID_Direccion_empleado == id_direccion_empleado
    ).first()

    if not direccion:
        raise HTTPException(status_code=404, detail="Dirección de empleado no encontrada")

    return direccion


@router.post("/", response_model=DireccionEmpleadoResponse)
def crear_direccion_empleado(
    direccion: DireccionEmpleadoCreate,
    db: Session = Depends(get_db)
):
    departamento = db.query(Departamento).filter(
        Departamento.ID_Departamento == direccion.Departamento
    ).first()

    if not departamento:
        raise HTTPException(status_code=404, detail="Departamento no encontrado")

    nueva_direccion = DireccionEmpleado(**direccion.model_dump())

    db.add(nueva_direccion)
    db.commit()
    db.refresh(nueva_direccion)

    return nueva_direccion


@router.put("/{id_direccion_empleado}", response_model=DireccionEmpleadoResponse)
def actualizar_direccion_empleado(
    id_direccion_empleado: int,
    direccion_actualizada: DireccionEmpleadoUpdate,
    db: Session = Depends(get_db)
):
    direccion = db.query(DireccionEmpleado).filter(
        DireccionEmpleado.ID_Direccion_empleado == id_direccion_empleado
    ).first()

    if not direccion:
        raise HTTPException(status_code=404, detail="Dirección de empleado no encontrada")

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