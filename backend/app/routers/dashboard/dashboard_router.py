from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.clientes.cliente_model import Cliente
from app.models.productos.producto_model import Producto
from app.models.ventas.detalle_venta_model import DetalleVenta
from app.models.ventas.venta_model import Venta
from app.schemas.dashboard.dashboard_schema import (
    ClienteTopDashboard,
    DashboardResponse,
    ProductoTopDashboard,
    ResumenVentasPeriodoResponse,
)


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]


def _a_float(valor):
    return float(valor or 0)


MESES_ANIO = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
]
NOMBRES_MESES = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
]


def _inicio_mes(fecha: date):
    return fecha.replace(day=1)


def _inicio_mes_siguiente(fecha: date):
    if fecha.month == 12:
        return fecha.replace(year=fecha.year + 1, month=1, day=1)

    return fecha.replace(month=fecha.month + 1, day=1)


def _fin_mes(fecha: date):
    return _inicio_mes_siguiente(fecha) - timedelta(days=1)


def _validar_anio(anio: int):
    if anio < 2000 or anio > 2100:
        raise HTTPException(
            status_code=400,
            detail="El anio debe estar entre 2000 y 2100."
        )


def _item_resumen(etiqueta: str, total=0, cantidad=0):
    return {
        "etiqueta": etiqueta,
        "total_vendido": _a_float(total),
        "cantidad_ventas": int(cantidad or 0),
    }


def _ventas_por_fecha(db: Session, inicio: date, fin: date):
    return db.query(
        Venta.FechaVenta,
        func.coalesce(func.sum(Venta.Total), 0),
        func.count(Venta.ID_Venta),
    ).filter(
        Venta.FechaVenta >= inicio,
        Venta.FechaVenta <= fin
    ).group_by(
        Venta.FechaVenta
    ).all()


def _rango_resumen_ventas(
    periodo: str,
    mes: int | None,
    anio: int | None,
    fecha_inicio: date | None,
    fecha_fin: date | None,
):
    periodo_normalizado = str(periodo or "semanal").strip().lower()
    hoy = date.today()

    if fecha_inicio or fecha_fin:
        if not fecha_inicio or not fecha_fin:
            raise HTTPException(
                status_code=400,
                detail="Debes enviar fecha_inicio y fecha_fin para usar rango personalizado."
            )

        if fecha_inicio > fecha_fin:
            raise HTTPException(
                status_code=400,
                detail="La fecha de inicio no puede ser mayor que la fecha final."
            )

        return "personalizado", fecha_inicio, fecha_fin, "Rango personalizado"

    if periodo_normalizado == "semanal":
        inicio = hoy - timedelta(days=hoy.weekday())
        return "semanal", inicio, inicio + timedelta(days=6), "Semana actual"

    if periodo_normalizado == "mensual":
        anio_consulta = anio or hoy.year
        mes_consulta = mes or hoy.month
        _validar_anio(anio_consulta)

        if mes_consulta < 1 or mes_consulta > 12:
            raise HTTPException(
                status_code=400,
                detail="El mes debe estar entre 1 y 12."
            )

        inicio = date(anio_consulta, mes_consulta, 1)
        return (
            "mensual",
            inicio,
            _fin_mes(inicio),
            f"{NOMBRES_MESES[mes_consulta - 1]} {anio_consulta}",
        )

    if periodo_normalizado == "anual":
        anio_consulta = anio or hoy.year
        _validar_anio(anio_consulta)
        return (
            "anual",
            date(anio_consulta, 1, 1),
            date(anio_consulta, 12, 31),
            f"Anio {anio_consulta}",
        )

    raise HTTPException(
        status_code=400,
        detail="Periodo invalido. Usa semanal, mensual, anual o fechas personalizadas."
    )


def _nombre_cliente(cliente: Cliente):
    nombre = f"{cliente.Nombres or ''} {cliente.Apellidos or ''}".strip()
    return nombre or "Cliente sin nombre"


def _nombre_cliente_valores(nombres, apellidos, id_cliente):
    nombre = f"{nombres or ''} {apellidos or ''}".strip()
    return nombre or f"Cliente {id_cliente}"


def _resumen_producto(detalles):
    if not detalles:
        return "Sin productos"

    primer_producto = detalles[0][1].Nombre

    if len(detalles) == 1:
        return primer_producto

    return f"{primer_producto} + {len(detalles) - 1} más"


def _rango_periodo(periodo: str):
    hoy = date.today()
    periodo_normalizado = str(periodo or "general").strip().lower()

    if periodo_normalizado == "semanal":
        inicio = hoy - timedelta(days=hoy.weekday())
        return inicio, inicio + timedelta(days=7)

    if periodo_normalizado == "mensual":
        return _inicio_mes(hoy), _inicio_mes_siguiente(hoy)

    return None, None


def _aplicar_periodo(query, periodo: str):
    inicio, fin = _rango_periodo(periodo)

    if inicio and fin:
        return query.filter(Venta.FechaVenta >= inicio, Venta.FechaVenta < fin)

    return query


@router.get("/resumen-ventas", response_model=ResumenVentasPeriodoResponse)
def obtener_resumen_ventas_periodo(
    periodo: str = Query(default="semanal"),
    mes: int | None = Query(default=None, ge=1, le=12),
    anio: int | None = Query(default=None),
    fecha_inicio: date | None = None,
    fecha_fin: date | None = None,
    db: Session = Depends(get_db)
):
    # El resumen sale de Ventas para evitar tablas derivadas que puedan quedar desactualizadas.
    periodo_normalizado, inicio, fin, titulo = _rango_resumen_ventas(
        periodo,
        mes,
        anio,
        fecha_inicio,
        fecha_fin,
    )
    ventas_data = _ventas_por_fecha(db, inicio, fin)

    if periodo_normalizado == "semanal":
        etiquetas = DIAS_SEMANA
        totales_por_fecha = {
            venta_fecha: (total, cantidad)
            for venta_fecha, total, cantidad in ventas_data
        }
        datos = []

        for indice, etiqueta in enumerate(etiquetas):
            fecha_dia = inicio + timedelta(days=indice)
            total, cantidad = totales_por_fecha.get(fecha_dia, (0, 0))
            datos.append(_item_resumen(etiqueta, total, cantidad))
    elif periodo_normalizado == "mensual":
        etiquetas = [f"Semana {indice}" for indice in range(1, 6)]
        acumulado = {
            etiqueta: {"total": 0, "cantidad": 0}
            for etiqueta in etiquetas
        }

        for venta_fecha, total, cantidad in ventas_data:
            semana = min(((venta_fecha.day - 1) // 7) + 1, 5)
            etiqueta = f"Semana {semana}"
            acumulado[etiqueta]["total"] += _a_float(total)
            acumulado[etiqueta]["cantidad"] += int(cantidad or 0)

        datos = [
            _item_resumen(etiqueta, valores["total"], valores["cantidad"])
            for etiqueta, valores in acumulado.items()
        ]
    elif periodo_normalizado == "anual":
        etiquetas = MESES_ANIO
        acumulado = {
            etiqueta: {"total": 0, "cantidad": 0}
            for etiqueta in etiquetas
        }

        for venta_fecha, total, cantidad in ventas_data:
            etiqueta = etiquetas[venta_fecha.month - 1]
            acumulado[etiqueta]["total"] += _a_float(total)
            acumulado[etiqueta]["cantidad"] += int(cantidad or 0)

        datos = [
            _item_resumen(etiqueta, valores["total"], valores["cantidad"])
            for etiqueta, valores in acumulado.items()
        ]
    else:
        etiquetas = [
            venta_fecha.isoformat()
            for venta_fecha, _, _ in ventas_data
        ]
        datos = [
            _item_resumen(venta_fecha.isoformat(), total, cantidad)
            for venta_fecha, total, cantidad in ventas_data
        ]

    total_periodo = sum(item["total_vendido"] for item in datos)
    cantidad_ventas_periodo = sum(item["cantidad_ventas"] for item in datos)

    return {
        "periodo": periodo_normalizado,
        "titulo": titulo,
        "etiquetas": etiquetas,
        "datos": datos,
        "total_periodo": total_periodo,
        "cantidad_ventas_periodo": cantidad_ventas_periodo,
        "fecha_inicio": inicio.isoformat(),
        "fecha_fin": fin.isoformat(),
        "mes": inicio.month if periodo_normalizado == "mensual" else None,
        "anio": inicio.year,
    }


@router.get("/", response_model=DashboardResponse)
def obtener_dashboard(db: Session = Depends(get_db)):
    # Este endpoint conserva el resumen original usado por las tarjetas principales del dashboard.
    hoy = date.today()
    inicio_mes = _inicio_mes(hoy)
    inicio_mes_siguiente = _inicio_mes_siguiente(hoy)
    inicio_semana = hoy - timedelta(days=hoy.weekday())
    fin_semana = inicio_semana + timedelta(days=7)

    ventas_dia_data = db.query(
        func.coalesce(func.sum(Venta.Total), 0),
        func.count(Venta.ID_Venta)
    ).filter(
        Venta.FechaVenta == hoy
    ).first()

    ventas_mes_data = db.query(
        func.coalesce(func.sum(Venta.Total), 0),
        func.count(Venta.ID_Venta)
    ).filter(
        Venta.FechaVenta >= inicio_mes,
        Venta.FechaVenta < inicio_mes_siguiente
    ).first()

    stock_bajo = db.query(func.count(Producto.ID_Producto)).filter(
        Producto.Stock <= 5
    ).scalar() or 0

    productos_vendidos_mes = db.query(
        func.coalesce(func.sum(DetalleVenta.Cantidad), 0)
    ).join(
        Venta,
        DetalleVenta.ID_Venta == Venta.ID_Venta
    ).filter(
        Venta.FechaVenta >= inicio_mes,
        Venta.FechaVenta < inicio_mes_siguiente
    ).scalar() or 0

    ventas_semana_data = db.query(
        Venta.FechaVenta,
        func.coalesce(func.sum(Venta.Total), 0)
    ).filter(
        Venta.FechaVenta >= inicio_semana,
        Venta.FechaVenta < fin_semana
    ).group_by(
        Venta.FechaVenta
    ).all()

    totales_por_fecha = {
        venta_fecha: _a_float(total)
        for venta_fecha, total in ventas_semana_data
    }

    ventas_semanales = []

    for indice, dia in enumerate(DIAS_SEMANA):
        fecha_dia = inicio_semana + timedelta(days=indice)
        ventas_semanales.append({
            "dia": dia,
            "total": totales_por_fecha.get(fecha_dia, 0)
        })

    ultimas_ventas_data = db.query(Venta, Cliente).join(
        Cliente,
        Venta.ID_Cliente == Cliente.ID_Cliente
    ).order_by(
        Venta.FechaVenta.desc(),
        Venta.ID_Venta.desc()
    ).limit(5).all()

    ultimas_ventas = []

    for venta, cliente in ultimas_ventas_data:
        detalles = db.query(DetalleVenta, Producto).join(
            Producto,
            DetalleVenta.ID_Producto == Producto.ID_Producto
        ).filter(
            DetalleVenta.ID_Venta == venta.ID_Venta
        ).order_by(
            DetalleVenta.ID_DetalleVenta.asc()
        ).all()

        ultimas_ventas.append({
            "id_venta": venta.ID_Venta,
            "fecha": venta.FechaVenta.isoformat(),
            "cliente": _nombre_cliente(cliente),
            "producto": _resumen_producto(detalles),
            "total": _a_float(venta.Total)
        })

    return {
        "resumen": {
            "ventas_dia": _a_float(ventas_dia_data[0]),
            "cantidad_ventas_dia": ventas_dia_data[1],
            "ventas_mes": _a_float(ventas_mes_data[0]),
            "cantidad_ventas_mes": ventas_mes_data[1],
            "stock_bajo": stock_bajo,
            "productos_vendidos_mes": int(productos_vendidos_mes)
        },
        "ventas_semanales": ventas_semanales,
        "ultimas_ventas": ultimas_ventas
    }


@router.get("/clientes-top", response_model=list[ClienteTopDashboard])
def obtener_clientes_top(
    periodo: str = "general",
    db: Session = Depends(get_db)
):
    query = db.query(
        Cliente.ID_Cliente,
        Cliente.Nombres,
        Cliente.Apellidos,
        func.count(Venta.ID_Venta),
        func.coalesce(func.sum(Venta.Total), 0),
    ).join(
        Venta,
        Venta.ID_Cliente == Cliente.ID_Cliente
    )

    query = _aplicar_periodo(query, periodo)

    clientes = query.group_by(
        Cliente.ID_Cliente,
        Cliente.Nombres,
        Cliente.Apellidos,
    ).order_by(
        func.coalesce(func.sum(Venta.Total), 0).desc()
    ).limit(5).all()

    return [
        {
            "ID_Cliente": id_cliente,
            "cliente": _nombre_cliente_valores(nombres, apellidos, id_cliente),
            "compras": int(compras or 0),
            "total": _a_float(total),
        }
        for id_cliente, nombres, apellidos, compras, total in clientes
    ]


@router.get("/productos-top", response_model=list[ProductoTopDashboard])
def obtener_productos_top(
    periodo: str = "general",
    db: Session = Depends(get_db)
):
    query = db.query(
        Producto.ID_Producto,
        Producto.Nombre,
        func.coalesce(func.sum(DetalleVenta.Cantidad), 0),
        func.coalesce(func.sum(DetalleVenta.subtotal), 0),
    ).join(
        DetalleVenta,
        DetalleVenta.ID_Producto == Producto.ID_Producto
    ).join(
        Venta,
        DetalleVenta.ID_Venta == Venta.ID_Venta
    )

    query = _aplicar_periodo(query, periodo)

    productos = query.group_by(
        Producto.ID_Producto,
        Producto.Nombre,
    ).order_by(
        func.coalesce(func.sum(DetalleVenta.Cantidad), 0).desc()
    ).limit(5).all()

    return [
        {
            "ID_Producto": id_producto,
            "producto": nombre,
            "cantidad": int(cantidad or 0),
            "total": _a_float(total),
        }
        for id_producto, nombre, cantidad, total in productos
    ]
