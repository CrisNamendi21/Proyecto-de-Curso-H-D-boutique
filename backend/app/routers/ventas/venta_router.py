from fastapi import APIRouter, Depends, HTTPException
from datetime import date, datetime
from typing import Optional
from sqlalchemy import func
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
from app.schemas.ventas.venta_resumen_dia_schema import VentasResumenDiaResponse

from app.models.ventas.detalle_venta_model import DetalleVenta
from app.models.ventas.pago_venta_model import PagoVenta
from app.models.ventas.recibo_model import Recibo

from app.schemas.ventas.venta_completa_schema import VentaCompletaCreate
from app.models.clientes.direccion_cliente_model import DireccionCliente
from app.models.productos.producto_model import Producto
from app.models.catalogos.talla_model import Talla
from app.models.catalogos.departamento_model import Departamento
from app.models.catalogos.municipio_model import Municipio

router = APIRouter(
    prefix="/ventas",
    tags=["Ventas"]
)


def _texto_presente(valor):
    return valor is not None and str(valor).strip() != ""


def _obtener_departamento_default(db: Session):
    departamento = db.query(Departamento).filter(
        Departamento.ID_Departamento == 1
    ).first()

    if not departamento:
        departamento = db.query(Departamento).first()

    if not departamento:
        raise HTTPException(
            status_code=400,
            detail="No hay departamentos registrados para crear clientes."
        )

    return departamento.ID_Departamento


def _crear_cliente_generico(db: Session):
    cliente_generico = db.query(Cliente).filter(
        Cliente.Nombres == "Cliente",
        Cliente.Apellidos == "General",
        Cliente.Estado == "ACTIVO"
    ).first()

    if cliente_generico:
        return cliente_generico

    direccion_generica = DireccionCliente(
        ID_Departamento=_obtener_departamento_default(db),
        ID_Municipio=None,
        Direccion=None
    )
    db.add(direccion_generica)
    db.flush()

    cliente_generico = Cliente(
        ID_Direccion=direccion_generica.ID_Direccion,
        Nombres="Cliente",
        Apellidos="General",
        Estado="ACTIVO",
        NumeroTelefono=None
    )
    db.add(cliente_generico)
    db.flush()

    return cliente_generico


def _crear_cliente_desde_venta(venta_data: VentaCompletaCreate, db: Session):
    datos_cliente = venta_data.cliente
    es_delivery = venta_data.CostoDelivery is not None

    if not datos_cliente:
        if es_delivery:
            raise HTTPException(
                status_code=400,
                detail="Para ventas con delivery debes enviar los datos del cliente."
            )
        return _crear_cliente_generico(db)

    if not _texto_presente(datos_cliente.Nombres) or not _texto_presente(datos_cliente.Apellidos):
        raise HTTPException(
            status_code=400,
            detail="Debes enviar nombres y apellidos del cliente."
        )

    if es_delivery:
        if not _texto_presente(datos_cliente.NumeroTelefono):
            raise HTTPException(
                status_code=400,
                detail="Para ventas con delivery debes enviar el número de teléfono del cliente."
            )

        if not _texto_presente(datos_cliente.Direccion):
            raise HTTPException(
                status_code=400,
                detail="Para ventas con delivery debes enviar la dirección exacta del cliente."
            )

        if datos_cliente.ID_Departamento is None:
            raise HTTPException(
                status_code=400,
                detail="Para ventas con delivery debes enviar el departamento del cliente."
            )

        if datos_cliente.ID_Municipio is None:
            raise HTTPException(
                status_code=400,
                detail="Para ventas con delivery debes enviar el municipio del cliente."
            )

        departamento = db.query(Departamento).filter(
            Departamento.ID_Departamento == datos_cliente.ID_Departamento
        ).first()

        if not departamento:
            raise HTTPException(
                status_code=404,
                detail="Departamento no encontrado"
            )

        municipio = db.query(Municipio).filter(
            Municipio.ID_Municipio == datos_cliente.ID_Municipio
        ).first()

        if not municipio:
            raise HTTPException(
                status_code=404,
                detail="Municipio no encontrado"
            )

        if municipio.ID_Departamento != datos_cliente.ID_Departamento:
            raise HTTPException(
                status_code=400,
                detail="El municipio seleccionado no pertenece al departamento indicado."
            )

        id_departamento = datos_cliente.ID_Departamento
        id_municipio = datos_cliente.ID_Municipio
        direccion = datos_cliente.Direccion.strip()
    else:
        id_departamento = datos_cliente.ID_Departamento or _obtener_departamento_default(db)
        id_municipio = datos_cliente.ID_Municipio
        direccion = datos_cliente.Direccion.strip() if _texto_presente(datos_cliente.Direccion) else None

    nueva_direccion = DireccionCliente(
        ID_Departamento=id_departamento,
        ID_Municipio=id_municipio,
        Direccion=direccion
    )
    db.add(nueva_direccion)
    db.flush()

    nuevo_cliente = Cliente(
        ID_Direccion=nueva_direccion.ID_Direccion,
        Nombres=datos_cliente.Nombres.strip(),
        Apellidos=datos_cliente.Apellidos.strip(),
        Estado="ACTIVO",
        NumeroTelefono=datos_cliente.NumeroTelefono.strip()
        if _texto_presente(datos_cliente.NumeroTelefono)
        else None
    )
    db.add(nuevo_cliente)
    db.flush()

    return nuevo_cliente


def _a_float(valor):
    return float(valor or 0)


def _nombre_cliente(cliente: Cliente):
    nombre = f"{cliente.Nombres or ''} {cliente.Apellidos or ''}".strip()
    return nombre or "Cliente sin nombre"


def _formatear_hora(fecha_emision):
    if not fecha_emision:
        return "--:--"

    return fecha_emision.strftime("%I:%M %p")


def _clasificar_metodo_pago(pagos):
    tipos_pago = {
        pago.Tipo_pago: nombre_pago
        for pago, nombre_pago in pagos
    }

    if len(tipos_pago) > 1:
        return "Mixto"

    if not tipos_pago:
        return "Sin pago"

    return next(iter(tipos_pago.values()))


def _normalizar_metodo_pago(metodo_pago: Optional[str]):
    if not metodo_pago:
        return None

    metodo = metodo_pago.strip().lower()

    if metodo in ("todos", "todo", "all"):
        return None

    return metodo


def _productos_detalle_venta(db: Session, id_venta: int):
    detalles = db.query(DetalleVenta, Producto, Talla).join(
        Producto,
        DetalleVenta.ID_Producto == Producto.ID_Producto
    ).outerjoin(
        Talla,
        Producto.ID_Talla == Talla.ID_Talla
    ).filter(
        DetalleVenta.ID_Venta == id_venta
    ).order_by(
        DetalleVenta.ID_DetalleVenta.asc()
    ).all()

    return [
        {
            "producto": producto.Nombre,
            "talla": talla.Talla if talla else "Sin talla",
            "cantidad": detalle.Cantidad,
            "precio": _a_float(detalle.PrecioUnitario),
            "subtotal": _a_float(detalle.subtotal)
        }
        for detalle, producto, talla in detalles
    ]


@router.get("/", response_model=list[VentaResponse])
def listar_ventas(db: Session = Depends(get_db)):
    return db.query(Venta).all()


@router.get("/resumen-dia", response_model=VentasResumenDiaResponse)
def obtener_resumen_ventas_dia(
    fecha: Optional[date] = None,
    cliente: Optional[str] = None,
    metodo_pago: Optional[str] = None,
    db: Session = Depends(get_db)
):
    fecha_consulta = fecha or date.today()
    metodo_filtrado = _normalizar_metodo_pago(metodo_pago)
    cliente_filtrado = cliente.strip().lower() if cliente and cliente.strip() else None

    ventas_query = db.query(Venta, Cliente, Recibo).join(
        Cliente,
        Venta.ID_Cliente == Cliente.ID_Cliente
    ).outerjoin(
        Recibo,
        Recibo.ID_Venta == Venta.ID_Venta
    ).filter(
        Venta.FechaVenta == fecha_consulta
    )

    if cliente_filtrado:
        patron_cliente = f"%{cliente_filtrado}%"
        ventas_query = ventas_query.filter(
            func.lower(
                func.concat(
                    func.coalesce(Cliente.Nombres, ""),
                    " ",
                    func.coalesce(Cliente.Apellidos, "")
                )
            ).like(patron_cliente)
        )

    ventas_data = ventas_query.order_by(
        Recibo.FechaEmision.desc(),
        Venta.ID_Venta.desc()
    ).all()

    ventas_filtradas = []
    totales_metodos = {
        "Efectivo": 0,
        "Transferencia": 0,
        "Mixto": 0,
    }

    for venta, cliente_venta, recibo in ventas_data:
        pagos = db.query(PagoVenta, TipoPago.NombrePago).join(
            TipoPago,
            PagoVenta.Tipo_pago == TipoPago.Tipo_pago
        ).filter(
            PagoVenta.ID_Venta == venta.ID_Venta
        ).all()

        metodo = _clasificar_metodo_pago(pagos)

        if metodo_filtrado and metodo.lower() != metodo_filtrado:
            continue

        productos_detalle = _productos_detalle_venta(db, venta.ID_Venta)
        total_productos = sum(
            producto["cantidad"] for producto in productos_detalle
        )

        venta_item = {
            "id_venta": venta.ID_Venta,
            "numero_venta": f"V-{venta.ID_Venta:05d}",
            "hora": _formatear_hora(recibo.FechaEmision if recibo else None),
            "fecha": venta.FechaVenta.isoformat(),
            "cliente": _nombre_cliente(cliente_venta),
            "metodo_pago": metodo,
            "total": _a_float(venta.Total),
            "productos": int(total_productos),
            "productos_detalle": productos_detalle
        }

        ventas_filtradas.append(venta_item)

        if metodo in totales_metodos:
            totales_metodos[metodo] += _a_float(venta.Total)

    ids_ventas = [venta["id_venta"] for venta in ventas_filtradas]
    productos_mas_vendidos = []

    if ids_ventas:
        productos_data = db.query(
            Producto.Nombre,
            func.coalesce(func.sum(DetalleVenta.Cantidad), 0),
            func.coalesce(func.sum(DetalleVenta.subtotal), 0)
        ).join(
            DetalleVenta,
            DetalleVenta.ID_Producto == Producto.ID_Producto
        ).filter(
            DetalleVenta.ID_Venta.in_(ids_ventas)
        ).group_by(
            Producto.Nombre
        ).order_by(
            func.sum(DetalleVenta.Cantidad).desc()
        ).limit(5).all()

        productos_mas_vendidos = [
            {
                "producto": producto,
                "cantidad": int(cantidad or 0),
                "total_vendido": _a_float(total_vendido)
            }
            for producto, cantidad, total_vendido in productos_data
        ]

    ventas_hoy = sum(venta["total"] for venta in ventas_filtradas)
    productos_vendidos = sum(venta["productos"] for venta in ventas_filtradas)

    return {
        "resumen": {
            "ventas_hoy": ventas_hoy,
            "transacciones": len(ventas_filtradas),
            "productos_vendidos": productos_vendidos,
            "total_neto": ventas_hoy
        },
        "ventas": ventas_filtradas,
        "productos_mas_vendidos": productos_mas_vendidos,
        "metodos_pago": [
            {"metodo": "Efectivo", "total": totales_metodos["Efectivo"]},
            {"metodo": "Transferencia", "total": totales_metodos["Transferencia"]},
            {"metodo": "Mixto", "total": totales_metodos["Mixto"]},
        ]
    }


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
        if venta_data.ID_Cliente is not None:
            cliente = db.query(Cliente).filter(
                Cliente.ID_Cliente == venta_data.ID_Cliente
            ).first()

            if not cliente:
                raise HTTPException(
                    status_code=404,
                    detail="Cliente no encontrado"
                )
        else:
            cliente = _crear_cliente_desde_venta(venta_data, db)

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

            if not direccion_cliente.ID_Municipio:
                raise HTTPException(
                    status_code=400,
                    detail="Para ventas con delivery, el cliente debe tener un municipio registrado."
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
            ID_Cliente=cliente.ID_Cliente,
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
