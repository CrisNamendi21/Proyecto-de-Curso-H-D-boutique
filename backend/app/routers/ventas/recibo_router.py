from datetime import date
from io import BytesIO
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.catalogos.tipo_pago_model import TipoPago
from app.models.clientes.cliente_model import Cliente
from app.models.empleados.empleado_model import Empleado
from app.models.productos.producto_model import Producto
from app.models.catalogos.talla_model import Talla
from app.models.ventas.detalle_venta_model import DetalleVenta
from app.models.ventas.pago_venta_model import PagoVenta
from app.models.ventas.recibo_model import Recibo
from app.models.ventas.venta_model import Venta
from app.schemas.ventas.recibo_detalle_schema import (
    ReciboDetalleResponse,
    ReciboListadoResponse,
    ReciboResumenResponse,
)
from app.schemas.ventas.recibo_schema import (
    ReciboCreate,
    ReciboResponse,
    ReciboUpdate,
)


router = APIRouter(
    prefix="/recibos",
    tags=["Recibos"]
)


def _a_float(valor):
    return float(valor or 0)


def _numero_recibo(id_recibo: int):
    return str(id_recibo)


def _nombre_persona(nombres, apellidos, fallback):
    nombre = f"{nombres or ''} {apellidos or ''}".strip()
    return nombre or fallback


def _estado_recibo(estado):
    if not estado:
        return "Emitido"

    return str(estado).capitalize()


def _formatear_fecha(fecha_emision):
    return fecha_emision.strftime("%Y-%m-%d %I:%M %p")


def _normalizar_medio_pago(medio_pago: Optional[str]):
    if not medio_pago:
        return None

    medio = medio_pago.strip().lower()

    if medio in ("todos", "todo", "all"):
        return None

    return medio


def _obtener_pagos_recibo(db: Session, id_venta: int):
    return db.query(PagoVenta, TipoPago.NombrePago).join(
        TipoPago,
        PagoVenta.Tipo_pago == TipoPago.Tipo_pago
    ).filter(
        PagoVenta.ID_Venta == id_venta
    ).all()


def _medio_pago_desde_pagos(pagos):
    tipos_pago = {
        pago.Tipo_pago: nombre_pago
        for pago, nombre_pago in pagos
    }

    if len(tipos_pago) > 1:
        return "Mixto"

    if not tipos_pago:
        return "Sin pago"

    return next(iter(tipos_pago.values()))


def _productos_recibo(db: Session, id_venta: int):
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


def _query_recibos_base(db: Session):
    return db.query(Recibo, Venta, Cliente, Empleado).join(
        Venta,
        Recibo.ID_Venta == Venta.ID_Venta
    ).join(
        Cliente,
        Venta.ID_Cliente == Cliente.ID_Cliente
    ).join(
        Empleado,
        Venta.ID_Empleado == Empleado.ID_Empleado
    )


def _recibo_a_detalle(recibo, venta, cliente, empleado, db: Session):
    pagos = _obtener_pagos_recibo(db, venta.ID_Venta)
    medio_pago = _medio_pago_desde_pagos(pagos)

    productos = _productos_recibo(db, venta.ID_Venta)
    delivery = _a_float(venta.CostoDelivery)
    total_productos = sum(producto["subtotal"] for producto in productos)

    return {
        "ID_Recibo": recibo.ID_Recibo,
        "numero_recibo": _numero_recibo(recibo.ID_Recibo),
        "fecha": _formatear_fecha(recibo.FechaEmision),
        "cliente": _nombre_persona(cliente.Nombres, cliente.Apellidos, "Cliente sin nombre"),
        "vendedor": _nombre_persona(empleado.Nombres, empleado.Apellidos, "Empleado sin nombre"),
        "medio_pago": medio_pago,
        "total": _a_float(venta.Total),
        "estado": _estado_recibo(recibo.Estado),
        "delivery": delivery,
        "total_productos": total_productos,
        "productos": productos
    }


def _recibo_a_listado(recibo, venta, cliente, empleado, db: Session):
    detalle = _recibo_a_detalle(recibo, venta, cliente, empleado, db)
    detalle.pop("productos")
    return detalle


def _obtener_recibo_detalle(id_recibo: int, db: Session):
    data = _query_recibos_base(db).filter(
        Recibo.ID_Recibo == id_recibo
    ).first()

    if not data:
        raise HTTPException(status_code=404, detail="Recibo no encontrado")

    recibo, venta, cliente, empleado = data
    return _recibo_a_detalle(recibo, venta, cliente, empleado, db)


def _texto_pdf(texto):
    return str(texto).replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _moneda_pdf(valor):
    return f"C$ {_a_float(valor):,.2f}"


def _numero_recibo_pdf(id_recibo: int):
    return str(id_recibo)


def _fecha_pdf(fecha_texto):
    try:
        return date.fromisoformat(fecha_texto[:10]).strftime("%d/%m/%Y") + fecha_texto[10:]
    except ValueError:
        return fecha_texto


def _recortar_pdf(texto, largo):
    texto = str(texto)

    if len(texto) <= largo:
        return texto

    return f"{texto[:largo - 3]}..."


def _generar_pdf_recibo(detalle):
    contenido = []
    rosa = "0.839 0.169 0.459"
    rosa_claro = "1.000 0.941 0.965"
    borde = "0.953 0.831 0.886"
    texto = "0.184 0.161 0.200"
    gris = "0.431 0.349 0.396"

    def rect(x, y, ancho, alto, fill=None, stroke=None, line_width=1):
        contenido.append("q")

        if fill:
            contenido.append(f"{fill} rg")

        if stroke:
            contenido.append(f"{stroke} RG")
            contenido.append(f"{line_width} w")

        contenido.append(f"{x} {y} {ancho} {alto} re")
        contenido.append("B" if fill and stroke else "f" if fill else "S")
        contenido.append("Q")

    def linea(x1, y1, x2, y2, color=borde, line_width=1):
        contenido.append("q")
        contenido.append(f"{color} RG")
        contenido.append(f"{line_width} w")
        contenido.append(f"{x1} {y1} m {x2} {y2} l S")
        contenido.append("Q")

    def texto_pdf(x, y, valor, size=11, font="/F1", color=texto, align="left"):
        valor = str(valor)
        ancho_estimado = len(valor) * size * 0.48

        if align == "right":
            x = x - ancho_estimado
        elif align == "center":
            x = x - (ancho_estimado / 2)

        contenido.append("BT")
        contenido.append(f"{color} rg")
        contenido.append(f"{font} {size} Tf")
        contenido.append(f"{x:.2f} {y:.2f} Td")
        contenido.append(f"({_texto_pdf(valor)}) Tj")
        contenido.append("ET")

    rect(32, 32, 548, 728, fill="1 1 1")
    rect(32, 704, 548, 56, fill=rosa_claro)
    texto_pdf(52, 728, "H&D Boutique", size=24, font="/F2", color=rosa)
    texto_pdf(52, 710, "Recibo de venta", size=12, font="/F2", color=gris)

    rect(432, 714, 118, 32, fill="1 1 1", stroke=borde)
    texto_pdf(444, 734, "No. recibo", size=9, font="/F2", color=gris)
    texto_pdf(444, 720, _numero_recibo_pdf(detalle["ID_Recibo"]), size=13, font="/F2", color=texto)

    linea(52, 690, 560, 690)
    texto_pdf(52, 672, "Fecha", size=9, font="/F2", color=gris)
    texto_pdf(52, 656, _fecha_pdf(detalle["fecha"]), size=11, font="/F2", color=texto)

    datos = [
        ("Cliente", detalle["cliente"]),
        ("Vendedor", detalle["vendedor"]),
        ("Medio de pago", detalle["medio_pago"]),
        ("Estado", detalle["estado"]),
    ]
    posiciones = [(52, 604), (312, 604), (52, 548), (312, 548)]

    for (etiqueta, valor), (x, y) in zip(datos, posiciones):
        rect(x, y, 228, 42, fill="0.996 0.980 0.988", stroke=borde)
        texto_pdf(x + 12, y + 25, etiqueta, size=9, font="/F2", color=gris)
        texto_pdf(x + 12, y + 10, _recortar_pdf(valor, 30), size=11, font="/F2", color=texto)

    texto_pdf(52, 512, "Productos comprados", size=14, font="/F2", color=texto)
    rect(52, 482, 508, 24, fill=rosa_claro, stroke=borde)
    texto_pdf(64, 490, "Producto", size=9, font="/F2", color=gris)
    texto_pdf(292, 490, "Talla", size=9, font="/F2", color=gris)
    texto_pdf(352, 490, "Cant.", size=9, font="/F2", color=gris)
    texto_pdf(428, 490, "Precio", size=9, font="/F2", color=gris)
    texto_pdf(548, 490, "Subtotal", size=9, font="/F2", color=gris, align="right")

    y_fila = 458
    productos = detalle["productos"]

    if not productos:
        texto_pdf(64, y_fila + 8, "No hay productos registrados para este recibo.", size=10, color=gris)
        y_fila -= 26
    else:
        for producto in productos[:12]:
            rect(52, y_fila, 508, 24, fill="1 1 1", stroke="0.973 0.906 0.937")
            texto_pdf(64, y_fila + 8, _recortar_pdf(producto["producto"], 34), size=9, color=texto)
            texto_pdf(292, y_fila + 8, _recortar_pdf(producto["talla"], 10), size=9, color=texto)
            texto_pdf(362, y_fila + 8, producto["cantidad"], size=9, color=texto, align="center")
            texto_pdf(474, y_fila + 8, _moneda_pdf(producto["precio"]), size=9, color=texto, align="right")
            texto_pdf(548, y_fila + 8, _moneda_pdf(producto["subtotal"]), size=9, color=texto, align="right")
            y_fila -= 24

        if len(productos) > 12:
            texto_pdf(64, y_fila + 8, f"+ {len(productos) - 12} productos adicionales", size=9, color=gris)
            y_fila -= 22

    y_totales = max(y_fila - 50, 110)
    rect(342, y_totales, 218, 76, fill=rosa_claro, stroke=borde)
    texto_pdf(360, y_totales + 54, "Total productos", size=10, font="/F2", color=gris)
    texto_pdf(542, y_totales + 54, _moneda_pdf(detalle["total_productos"]), size=10, color=texto, align="right")
    texto_pdf(360, y_totales + 34, "Delivery", size=10, font="/F2", color=gris)
    texto_pdf(542, y_totales + 34, _moneda_pdf(detalle["delivery"]), size=10, color=texto, align="right")
    linea(356, y_totales + 25, 546, y_totales + 25, color=borde)
    texto_pdf(360, y_totales + 10, "Total", size=12, font="/F2", color=gris)
    texto_pdf(542, y_totales + 10, _moneda_pdf(detalle["total"]), size=16, font="/F2", color=rosa, align="right")

    linea(52, 84, 560, 84)
    texto_pdf(306, 62, "Gracias por su compra.", size=12, font="/F2", color=texto, align="center")
    texto_pdf(306, 46, "Este comprobante fue generado por H&D Boutique.", size=9, color=gris, align="center")

    stream = "\n".join(contenido).encode("cp1252", errors="replace")

    objetos = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        b"/Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
        b"<< /Length " + str(len(stream)).encode("ascii") + b" >>\nstream\n" + stream + b"\nendstream",
    ]

    pdf = BytesIO()
    pdf.write(b"%PDF-1.4\n")
    offsets = []

    for numero, objeto in enumerate(objetos, start=1):
        offsets.append(pdf.tell())
        pdf.write(f"{numero} 0 obj\n".encode("ascii"))
        pdf.write(objeto)
        pdf.write(b"\nendobj\n")

    xref_inicio = pdf.tell()
    pdf.write(f"xref\n0 {len(objetos) + 1}\n".encode("ascii"))
    pdf.write(b"0000000000 65535 f \n")

    for offset in offsets:
        pdf.write(f"{offset:010d} 00000 n \n".encode("ascii"))

    pdf.write(
        f"trailer\n<< /Size {len(objetos) + 1} /Root 1 0 R >>\n"
        f"startxref\n{xref_inicio}\n%%EOF\n".encode("ascii")
    )
    pdf.seek(0)

    return pdf


@router.get("/resumen", response_model=ReciboResumenResponse)
def obtener_resumen_recibos(db: Session = Depends(get_db)):
    hoy = date.today()
    inicio_mes = hoy.replace(day=1)

    if hoy.month == 12:
        inicio_mes_siguiente = hoy.replace(year=hoy.year + 1, month=1, day=1)
    else:
        inicio_mes_siguiente = hoy.replace(month=hoy.month + 1, day=1)

    recibos_hoy = _query_recibos_base(db).filter(
        Venta.FechaVenta == hoy
    ).count()

    recibos_mes = _query_recibos_base(db).filter(
        Venta.FechaVenta >= inicio_mes,
        Venta.FechaVenta < inicio_mes_siguiente
    ).count()

    monto_facturado = db.query(
        func.coalesce(func.sum(Venta.Total), 0)
    ).join(
        Recibo,
        Recibo.ID_Venta == Venta.ID_Venta
    ).filter(
        Venta.FechaVenta >= inicio_mes,
        Venta.FechaVenta < inicio_mes_siguiente
    ).scalar()

    return {
        "recibos_hoy": recibos_hoy,
        "recibos_mes": recibos_mes,
        "monto_facturado": _a_float(monto_facturado)
    }


@router.get("/", response_model=list[ReciboListadoResponse])
def listar_recibos(
    fecha: Optional[date] = None,
    busqueda: Optional[str] = None,
    medio_pago: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = _query_recibos_base(db)

    if fecha:
        query = query.filter(Venta.FechaVenta == fecha)

    if busqueda and busqueda.strip():
        texto = busqueda.strip().lower()
        patron = f"%{texto}%"

        filtros_busqueda = [
            func.lower(
                func.concat(
                    func.coalesce(Cliente.Nombres, ""),
                    " ",
                    func.coalesce(Cliente.Apellidos, "")
                )
            ).like(patron)
        ]

        texto_numerico = texto.replace("r-", "").replace("r", "").replace("-", "")

        if texto_numerico.isdigit():
            filtros_busqueda.append(Recibo.ID_Recibo == int(texto_numerico))

        query = query.filter(or_(*filtros_busqueda))

    recibos_data = query.order_by(
        Recibo.FechaEmision.desc(),
        Recibo.ID_Recibo.desc()
    ).all()

    medio_filtrado = _normalizar_medio_pago(medio_pago)
    recibos = []

    for recibo, venta, cliente, empleado in recibos_data:
        item = _recibo_a_listado(recibo, venta, cliente, empleado, db)

        if medio_filtrado and item["medio_pago"].lower() != medio_filtrado:
            continue

        recibos.append(item)

    return recibos


@router.get("/ultimo", response_model=ReciboDetalleResponse)
def obtener_ultimo_recibo(db: Session = Depends(get_db)):
    data = _query_recibos_base(db).order_by(
        Recibo.FechaEmision.desc(),
        Recibo.ID_Recibo.desc()
    ).first()

    if not data:
        raise HTTPException(status_code=404, detail="No hay recibos emitidos todavía.")

    recibo, venta, cliente, empleado = data
    return _recibo_a_detalle(recibo, venta, cliente, empleado, db)


@router.get("/{id_recibo}", response_model=ReciboDetalleResponse)
def obtener_recibo(id_recibo: int, db: Session = Depends(get_db)):
    return _obtener_recibo_detalle(id_recibo, db)


@router.get("/{id_recibo}/pdf")
def descargar_pdf_recibo(id_recibo: int, db: Session = Depends(get_db)):
    detalle = _obtener_recibo_detalle(id_recibo, db)
    pdf = _generar_pdf_recibo(detalle)
    nombre_archivo = f"recibo-{id_recibo}.pdf"

    return StreamingResponse(
        pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{nombre_archivo}"'
        }
    )


@router.post("/", response_model=ReciboResponse)
def crear_recibo(recibo: ReciboCreate, db: Session = Depends(get_db)):
    venta = db.query(Venta).filter(Venta.ID_Venta == recibo.ID_Venta).first()

    if not venta:
        raise HTTPException(
            status_code=404,
            detail="La venta indicada no existe"
        )

    recibo_existente = db.query(Recibo).filter(
        Recibo.ID_Venta == recibo.ID_Venta
    ).first()

    if recibo_existente:
        raise HTTPException(
            status_code=400,
            detail="Esta venta ya tiene un recibo registrado"
        )

    nuevo_recibo = Recibo(
        ID_Venta=recibo.ID_Venta,
        FechaEmision=recibo.FechaEmision,
        Estado=recibo.Estado,
        Observacion=recibo.Observacion
    )

    db.add(nuevo_recibo)
    db.commit()
    db.refresh(nuevo_recibo)

    return nuevo_recibo


@router.put("/{id_recibo}", response_model=ReciboResponse)
def actualizar_recibo(
    id_recibo: int,
    recibo_actualizado: ReciboUpdate,
    db: Session = Depends(get_db)
):
    recibo = db.query(Recibo).filter(Recibo.ID_Recibo == id_recibo).first()

    if not recibo:
        raise HTTPException(status_code=404, detail="Recibo no encontrado")

    datos_actualizados = recibo_actualizado.model_dump(exclude_unset=True)

    for campo, valor in datos_actualizados.items():
        setattr(recibo, campo, valor)

    db.commit()
    db.refresh(recibo)

    return recibo
