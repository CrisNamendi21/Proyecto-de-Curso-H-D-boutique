from fastapi import APIRouter, Depends, HTTPException
from datetime import date, datetime
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

from app.models.ventas.detalle_venta_model import DetalleVenta
from app.models.ventas.pago_venta_model import PagoVenta
from app.models.ventas.recibo_model import Recibo

from app.schemas.ventas.venta_completa_schema import VentaCompletaCreate
from app.models.clientes.direccion_cliente_model import DireccionCliente
from app.models.productos.producto_model import Producto

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

@router.post("/registrar-completa")
def registrar_venta_completa(
    venta_data: VentaCompletaCreate,
    db: Session = Depends(get_db)
):

    try:
        cliente = db.query(Cliente).filter(
            Cliente.ID_Cliente == venta_data.ID_Cliente
        ).first()

        if not cliente:
            raise HTTPException(
                status_code=404,
                detail="Cliente no encontrado"
            )

        empleado = db.query(Empleado).filter(
            Empleado.ID_Empleado == venta_data.ID_Empleado
        ).first()

        if not empleado:
            raise HTTPException(
                status_code=404,
                detail="Empleado no encontrado"
            )

        es_delivery = venta_data.CostoDelivery is not None

        if es_delivery:
            if not cliente.Nombres or not cliente.Apellidos or not cliente.NumeroTelefono:
                raise HTTPException(
                    status_code=400,
                    detail="Para ventas con delivery, el cliente debe tener nombres, apellidos y número de teléfono."
                )

            direccion_cliente = db.query(DireccionCliente).filter(
                DireccionCliente.ID_Direccion == cliente.ID_Direccion
            ).first()

            if not direccion_cliente:
                raise HTTPException(
                    status_code=400,
                    detail="Para ventas con delivery, el cliente debe tener una dirección registrada."
                )

            if not direccion_cliente.Direccion:
                raise HTTPException(
                    status_code=400,
                    detail="Para ventas con delivery, el cliente debe tener una dirección exacta."
                )

            if not direccion_cliente.ID_Departamento:
                raise HTTPException(
                    status_code=400,
                    detail="Para ventas con delivery, el cliente debe tener un departamento registrado."
                )

        productos_validados = []

        for item in venta_data.productos:
            producto = db.query(Producto).filter(
                Producto.ID_Producto == item.ID_Producto
            ).first()

            if not producto:
                raise HTTPException(
                    status_code=404,
                    detail=f"Producto con ID {item.ID_Producto} no encontrado"
                )

            if producto.Stock < item.Cantidad:
                raise HTTPException(
                    status_code=400,
                    detail=f"No hay stock suficiente para el producto con ID {item.ID_Producto}"
                )

            subtotal_producto = item.Cantidad * item.PrecioUnitario

            productos_validados.append({
                "ID_Producto": producto.ID_Producto,
                "Cantidad": item.Cantidad,
                "PrecioUnitario": item.PrecioUnitario,
                "Subtotal": subtotal_producto
            })

        total_productos = sum(
            item["Subtotal"] for item in productos_validados
        )

        costo_delivery = venta_data.CostoDelivery or 0

        total_venta = total_productos + costo_delivery

        total_pagado = sum(
            pago.Monto for pago in venta_data.pagos
        )

        for pago in venta_data.pagos:
            tipo_pago = db.query(TipoPago).filter(
                TipoPago.Tipo_pago == pago.Tipo_pago
            ).first()

            if not tipo_pago:
                raise HTTPException(
                    status_code=404,
                    detail=f"Tipo de pago con ID {pago.Tipo_pago} no encontrado"
                )

        if total_pagado != total_venta:
            raise HTTPException(
                status_code=400,
                detail=f"La suma de los pagos ({total_pagado}) no coincide con el total de la venta ({total_venta})."
            )

        nueva_venta = Venta(
            FechaVenta=date.today(),
            Tipo_pago=venta_data.pagos[0].Tipo_pago,
            ID_Cliente=venta_data.ID_Cliente,
            ID_Empleado=venta_data.ID_Empleado,
            Total=total_venta,
            CostoDelivery=venta_data.CostoDelivery
        )

        db.add(nueva_venta)
        db.flush()

        for item in productos_validados:
            nuevo_detalle = DetalleVenta(
                ID_Venta=nueva_venta.ID_Venta,
                ID_Producto=item["ID_Producto"],
                Cantidad=item["Cantidad"],
                PrecioUnitario=item["PrecioUnitario"],
                subtotal=item["Subtotal"]
            )

            db.add(nuevo_detalle)

            producto = db.query(Producto).filter(
                Producto.ID_Producto == item["ID_Producto"]
            ).first()

            producto.Stock = producto.Stock - item["Cantidad"]

        for pago in venta_data.pagos:
            nuevo_pago = PagoVenta(
                ID_Venta=nueva_venta.ID_Venta,
                Tipo_pago=pago.Tipo_pago,
                Monto=pago.Monto,
                Referencia=pago.Referencia
            )

            db.add(nuevo_pago)

        nuevo_recibo = Recibo(
            ID_Venta=nueva_venta.ID_Venta,
            FechaEmision=datetime.now(),
            Estado="EMITIDO",
            Observacion=venta_data.ObservacionRecibo
        )

        db.add(nuevo_recibo)

        db.commit()
        db.refresh(nueva_venta)

        return {
            "mensaje": "Venta completa registrada correctamente.",
            "ID_Venta": nueva_venta.ID_Venta,
            "ID_Cliente": nueva_venta.ID_Cliente,
            "ID_Empleado": nueva_venta.ID_Empleado,
            "CostoDelivery": nueva_venta.CostoDelivery,
            "TotalProductos": total_productos,
            "TotalVenta": nueva_venta.Total,
            "TotalPagado": total_pagado,
            "ReciboGenerado": True
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as error:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error interno al registrar la venta completa: {str(error)}"
        )