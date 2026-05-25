from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.ventas.venta_model import Venta
from app.models.clientes.cliente_model import Cliente
from app.models.empleados.empleado_model import Empleado
from app.models.catalogos.tipo_pago_model import TipoPago
from app.schemas.ventas.venta_schema import (
    VentaCreate,
    VentaUpdate,
    VentaResponse,
)


router = APIRouter(
    prefix="/ventas",
    tags=["Ventas"]
)


@router.get("/", response_model=list[VentaResponse])
def listar_ventas(db: Session = Depends(get_db)):
    return db.query(Venta).all()


@router.get("/{id_venta}", response_model=VentaResponse)
def obtener_venta(id_venta: int, db: Session = Depends(get_db)):
    venta = db.query(Venta).filter(
        Venta.ID_Venta == id_venta
    ).first()

    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")

    return venta


@router.post("/", response_model=VentaResponse)
def crear_venta(venta: VentaCreate, db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(
        Cliente.ID_Cliente == venta.ID_Cliente
    ).first()

    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    empleado = db.query(Empleado).filter(
        Empleado.ID_Empleado == venta.ID_Empleado
    ).first()

    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    tipo_pago = db.query(TipoPago).filter(
        TipoPago.Tipo_pago == venta.Tipo_pago
    ).first()

    if not tipo_pago:
        raise HTTPException(status_code=404, detail="Tipo de pago no encontrado")

    nueva_venta = Venta(**venta.model_dump())

    db.add(nueva_venta)
    db.commit()
    db.refresh(nueva_venta)

    return nueva_venta


@router.put("/{id_venta}", response_model=VentaResponse)
def actualizar_venta(
    id_venta: int,
    venta_actualizada: VentaUpdate,
    db: Session = Depends(get_db)
):
    venta = db.query(Venta).filter(
        Venta.ID_Venta == id_venta
    ).first()

    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")

    datos_actualizados = venta_actualizada.model_dump(exclude_unset=True)

    if "ID_Cliente" in datos_actualizados:
        cliente = db.query(Cliente).filter(
            Cliente.ID_Cliente == datos_actualizados["ID_Cliente"]
        ).first()

        if not cliente:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")

    if "ID_Empleado" in datos_actualizados:
        empleado = db.query(Empleado).filter(
            Empleado.ID_Empleado == datos_actualizados["ID_Empleado"]
        ).first()

        if not empleado:
            raise HTTPException(status_code=404, detail="Empleado no encontrado")

    if "Tipo_pago" in datos_actualizados:
        tipo_pago = db.query(TipoPago).filter(
            TipoPago.Tipo_pago == datos_actualizados["Tipo_pago"]
        ).first()

        if not tipo_pago:
            raise HTTPException(status_code=404, detail="Tipo de pago no encontrado")

    for campo, valor in datos_actualizados.items():
        setattr(venta, campo, valor)

    db.commit()
    db.refresh(venta)

    return venta