from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.clientes.cliente_model import Cliente
from app.models.productos.producto_model import Producto
from app.models.ventas.detalle_venta_model import DetalleVenta
from app.models.ventas.venta_model import Venta
from app.schemas.dashboard.dashboard_schema import DashboardResponse


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]


def _a_float(valor):
    return float(valor or 0)


def _inicio_mes(fecha: date):
    return fecha.replace(day=1)


def _inicio_mes_siguiente(fecha: date):
    if fecha.month == 12:
        return fecha.replace(year=fecha.year + 1, month=1, day=1)

    return fecha.replace(month=fecha.month + 1, day=1)


def _nombre_cliente(cliente: Cliente):
    nombre = f"{cliente.Nombres or ''} {cliente.Apellidos or ''}".strip()
    return nombre or "Cliente sin nombre"


def _resumen_producto(detalles):
    if not detalles:
        return "Sin productos"

    primer_producto = detalles[0][1].Nombre

    if len(detalles) == 1:
        return primer_producto

    return f"{primer_producto} + {len(detalles) - 1} más"


@router.get("/", response_model=DashboardResponse)
def obtener_dashboard(db: Session = Depends(get_db)):
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
