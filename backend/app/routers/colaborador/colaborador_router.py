from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.auth.security import requerir_roles
from app.database import get_db
from app.models.catalogos.tipo_pago_model import TipoPago
from app.models.clientes.cliente_model import Cliente
from app.models.empleados.empleado_model import Empleado
from app.models.productos.producto_model import Producto
from app.models.ventas.detalle_venta_model import DetalleVenta
from app.models.ventas.pago_venta_model import PagoVenta
from app.models.ventas.recibo_model import Recibo
from app.models.ventas.venta_model import Venta
from app.routers.productos.producto_router import producto_con_precio
from app.routers.ventas.recibo_router import (
    _generar_pdf_recibo,
    _normalizar_medio_pago,
    _query_recibos_base,
    _recibo_a_detalle,
    _recibo_a_listado,
)
from app.routers.ventas.venta_router import registrar_venta_completa
from app.schemas.auth.auth_schema import UsuarioAutenticado
from app.schemas.ventas.venta_completa_schema import VentaCompletaCreate


router = APIRouter(
    prefix="/colaborador",
    tags=["Colaborador"]
)

UMBRAL_BAJO_STOCK = 5


def _id_empleado_colaborador(usuario_actual: UsuarioAutenticado) -> int:
    if not usuario_actual.id_empleado:
        raise HTTPException(
            status_code=403,
            detail="El usuario colaborador no tiene empleado asociado."
        )

    return usuario_actual.id_empleado


def _nombre_persona(nombres, apellidos, fallback="Sin nombre"):
    nombre = f"{nombres or ''} {apellidos or ''}".strip()
    return nombre or fallback


def _recibo_propio_query(db: Session, id_empleado: int):
    # Los recibos de colaborador siempre se filtran por el empleado autenticado.
    return _query_recibos_base(db).filter(Venta.ID_Empleado == id_empleado)


@router.get("/dashboard")
def obtener_dashboard_colaborador(
    db: Session = Depends(get_db),
    usuario_actual: UsuarioAutenticado = Depends(requerir_roles("colaborador"))
):
    # Este panel resume solo ventas y recibos del colaborador actual.
    id_empleado = _id_empleado_colaborador(usuario_actual)
    hoy = date.today()

    ventas_hoy_query = db.query(Venta).filter(
        Venta.ID_Empleado == id_empleado,
        Venta.FechaVenta == hoy
    )

    ventas_hoy = ventas_hoy_query.count()
    total_vendido_hoy = ventas_hoy_query.with_entities(
        func.coalesce(func.sum(Venta.Total), 0)
    ).scalar()

    productos_vendidos_hoy = db.query(
        func.coalesce(func.sum(DetalleVenta.Cantidad), 0)
    ).join(
        Venta,
        DetalleVenta.ID_Venta == Venta.ID_Venta
    ).filter(
        Venta.ID_Empleado == id_empleado,
        Venta.FechaVenta == hoy
    ).scalar()

    ultimos_recibos_data = _recibo_propio_query(db, id_empleado).order_by(
        Recibo.FechaEmision.desc(),
        Recibo.ID_Recibo.desc()
    ).limit(5).all()

    productos_bajo_stock = db.query(Producto).filter(
        func.upper(Producto.Estado) == "ACTIVO",
        Producto.Stock > 0,
        Producto.Stock <= UMBRAL_BAJO_STOCK
    ).order_by(Producto.Stock.asc()).limit(5).all()

    return {
        "colaborador": {
            "nombre": usuario_actual.nombre,
            "usuario": usuario_actual.usuario,
        },
        "resumen": {
            "ventas_hoy": ventas_hoy,
            "total_vendido_hoy": float(total_vendido_hoy or 0),
            "productos_vendidos_hoy": int(productos_vendidos_hoy or 0),
        },
        "ultimos_recibos": [
            _recibo_a_listado(recibo, venta, cliente, empleado, db)
            for recibo, venta, cliente, empleado in ultimos_recibos_data
        ],
        "productos_bajo_stock": [
            producto_con_precio(producto, db)
            for producto in productos_bajo_stock
        ],
    }


@router.get("/productos")
def listar_productos_colaborador(
    busqueda: Optional[str] = None,
    db: Session = Depends(get_db),
    usuario_actual: UsuarioAutenticado = Depends(requerir_roles("colaborador"))
):
    _id_empleado_colaborador(usuario_actual)
    query = db.query(Producto).filter(func.upper(Producto.Estado) == "ACTIVO")

    if busqueda and busqueda.strip():
        query = query.filter(Producto.Nombre.ilike(f"%{busqueda.strip()}%"))

    productos = query.order_by(Producto.Nombre.asc()).all()
    return [producto_con_precio(producto, db) for producto in productos]


@router.get("/clientes")
def listar_clientes_colaborador(
    busqueda: Optional[str] = None,
    db: Session = Depends(get_db),
    usuario_actual: UsuarioAutenticado = Depends(requerir_roles("colaborador"))
):
    _id_empleado_colaborador(usuario_actual)
    query = db.query(Cliente)

    if busqueda and busqueda.strip():
        texto = busqueda.strip().lower()
        patron = f"%{texto}%"
        query = query.filter(
            or_(
                func.lower(func.coalesce(Cliente.Nombres, "")).like(patron),
                func.lower(func.coalesce(Cliente.Apellidos, "")).like(patron),
                func.lower(func.coalesce(Cliente.NumeroTelefono, "")).like(patron),
            )
        )

    clientes = query.order_by(Cliente.ID_Cliente.desc()).limit(50).all()
    return [
        {
            "ID_Cliente": cliente.ID_Cliente,
            "NombreCompleto": _nombre_persona(cliente.Nombres, cliente.Apellidos),
            "Nombres": cliente.Nombres,
            "Apellidos": cliente.Apellidos,
            "NumeroTelefono": cliente.NumeroTelefono,
            "Estado": cliente.Estado,
        }
        for cliente in clientes
    ]


@router.post("/ventas/registrar-completa")
def registrar_venta_colaborador(
    venta_data: VentaCompletaCreate,
    db: Session = Depends(get_db),
    usuario_actual: UsuarioAutenticado = Depends(requerir_roles("colaborador"))
):
    id_empleado = _id_empleado_colaborador(usuario_actual)

    # El colaborador no puede decidir el empleado de la venta desde el frontend.
    venta_segura = venta_data.model_copy(update={"ID_Empleado": id_empleado})
    return registrar_venta_completa(venta_segura, db)


@router.get("/recibos")
def listar_recibos_colaborador(
    busqueda: Optional[str] = None,
    medio_pago: Optional[str] = None,
    db: Session = Depends(get_db),
    usuario_actual: UsuarioAutenticado = Depends(requerir_roles("colaborador"))
):
    id_empleado = _id_empleado_colaborador(usuario_actual)
    query = _recibo_propio_query(db, id_empleado)

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
            filtros_busqueda.append(Venta.ID_Venta == int(texto_numerico))

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


@router.get("/recibos/{id_recibo}")
def obtener_recibo_colaborador(
    id_recibo: int,
    db: Session = Depends(get_db),
    usuario_actual: UsuarioAutenticado = Depends(requerir_roles("colaborador"))
):
    id_empleado = _id_empleado_colaborador(usuario_actual)
    data = _recibo_propio_query(db, id_empleado).filter(
        Recibo.ID_Recibo == id_recibo
    ).first()

    if not data:
        raise HTTPException(status_code=404, detail="Recibo no encontrado")

    recibo, venta, cliente, empleado = data
    return _recibo_a_detalle(recibo, venta, cliente, empleado, db)


@router.get("/recibos/{id_recibo}/pdf")
def descargar_pdf_recibo_colaborador(
    id_recibo: int,
    db: Session = Depends(get_db),
    usuario_actual: UsuarioAutenticado = Depends(requerir_roles("colaborador"))
):
    detalle = obtener_recibo_colaborador(id_recibo, db, usuario_actual)
    pdf = _generar_pdf_recibo(detalle)

    return StreamingResponse(
        pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="recibo-{id_recibo}.pdf"'
        }
    )
