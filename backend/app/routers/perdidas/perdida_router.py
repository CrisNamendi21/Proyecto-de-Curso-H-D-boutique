from datetime import date
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.orm import Session

from app.auth.security import requerir_roles
from app.database import get_db
from app.models.catalogos.talla_model import Talla
from app.models.compras.compra_model import Compra
from app.models.compras.detalle_compra_model import DetalleCompra
from app.models.empleados.empleado_model import Empleado
from app.models.perdidas.detalle_perdida_model import DetallePerdida
from app.models.perdidas.perdida_model import Perdida
from app.models.productos.producto_model import Producto
from app.models.productos.producto_proveedor_model import ProductoProveedor
from app.models.proveedores.proveedor_model import Proveedor
from app.schemas.auth.auth_schema import UsuarioAutenticado
from app.schemas.perdidas.perdida_schema import (
    PerdidaCreate,
    PerdidaDetalleResponse,
    PerdidaListadoResponse,
    PerdidaResumenResponse,
)


router = APIRouter(
    prefix="/perdidas",
    tags=["Pérdidas"]
)


def _a_decimal(valor):
    return Decimal(valor or 0)


def _nombre_persona(empleado):
    if not empleado:
        return None

    nombre = f"{empleado.Nombres or ''} {empleado.Apellidos or ''}".strip()
    return nombre or None


def _detalles_perdida(db: Session, id_perdida: int):
    return db.query(DetallePerdida, Producto, Talla).join(
        Producto,
        DetallePerdida.ID_Producto == Producto.ID_Producto
    ).outerjoin(
        Talla,
        Producto.ID_Talla == Talla.ID_Talla
    ).filter(
        DetallePerdida.ID_Perdida == id_perdida
    ).order_by(
        DetallePerdida.ID_DetallePerdida.asc()
    ).all()


def _perdida_a_respuesta(perdida, proveedor, compra, empleado, db: Session, incluir_detalle=False):
    detalles = _detalles_perdida(db, perdida.ID_Perdida)
    cantidad_total = sum(detalle.Cantidad for detalle, _, _ in detalles)
    costo_total = sum(_a_decimal(detalle.CostoTotal) for detalle, _, _ in detalles)

    if not detalles:
        producto_principal = "Sin productos"
    elif len(detalles) == 1:
        producto_principal = detalles[0][1].Nombre
    else:
        producto_principal = f"{detalles[0][1].Nombre} + {len(detalles) - 1} más"

    respuesta = {
        "ID_Perdida": perdida.ID_Perdida,
        "fecha": perdida.FechaRegistro.isoformat(),
        "proveedor": proveedor.NombreEmpresa if proveedor else None,
        "ID_Compra": compra.ID_Compra if compra else None,
        "empleado": _nombre_persona(empleado),
        "motivo": perdida.Motivo,
        "observacion": perdida.Observacion,
        "estado": perdida.Estado,
        "cantidad_total": cantidad_total,
        "costo_total": costo_total,
        "producto_principal": producto_principal,
    }

    if incluir_detalle:
        respuesta["productos"] = [
            {
                "ID_DetallePerdida": detalle.ID_DetallePerdida,
                "ID_Producto": producto.ID_Producto,
                "producto": producto.Nombre,
                "talla": talla.Talla if talla else "Sin talla",
                "cantidad": detalle.Cantidad,
                "costo_unitario": _a_decimal(detalle.CostoUnitario),
                "costo_total": _a_decimal(detalle.CostoTotal),
            }
            for detalle, producto, talla in detalles
        ]

    return respuesta


def _query_perdidas_base(db: Session):
    return db.query(Perdida, Proveedor, Compra, Empleado).outerjoin(
        Proveedor,
        Perdida.ID_Proveedor == Proveedor.ID_Proveedor
    ).outerjoin(
        Compra,
        Perdida.ID_Compra == Compra.ID_Compra
    ).outerjoin(
        Empleado,
        Perdida.ID_Empleado == Empleado.ID_Empleado
    )


def _obtener_costo_unitario(db: Session, id_producto: int, id_proveedor: Optional[int], id_compra: Optional[int]):
    if id_compra:
        detalle_compra = db.query(DetalleCompra, ProductoProveedor).join(
            ProductoProveedor,
            DetalleCompra.ID_ProductoProveedor == ProductoProveedor.ID_ProductoProveedor
        ).filter(
            DetalleCompra.ID_Compra == id_compra,
            ProductoProveedor.ID_Producto == id_producto
        ).first()

        if not detalle_compra:
            raise HTTPException(
                status_code=400,
                detail="El producto seleccionado no pertenece a la compra indicada."
            )

        detalle, _ = detalle_compra
        return detalle.precio_unitario

    query = db.query(ProductoProveedor).filter(
        ProductoProveedor.ID_Producto == id_producto
    )

    if id_proveedor:
        query = query.filter(ProductoProveedor.ID_Proveedor == id_proveedor)

    relacion = query.order_by(
        ProductoProveedor.ID_ProductoProveedor.desc()
    ).first()

    if not relacion:
        raise HTTPException(
            status_code=400,
            detail="No se encontró costo de compra para el producto seleccionado."
        )

    return relacion.PrecioDeCompra


def _manejar_error_tablas_perdidas(error: ProgrammingError, db: Session):
    db.rollback()
    mensaje = str(error.orig if getattr(error, "orig", None) else error)

    if "Perdidas" in mensaje or "DetallePerdidas" in mensaje:
        raise HTTPException(
            status_code=409,
            detail=(
                "El módulo de pérdidas aún no tiene sus tablas en esta base de datos. "
                "Ejecuta backend/scripts/crear_tablas_perdidas.sql y vuelve a intentar."
            ),
        )

    raise error


@router.get("/resumen", response_model=PerdidaResumenResponse)
def obtener_resumen_perdidas(
    db: Session = Depends(get_db),
    _: UsuarioAutenticado = Depends(requerir_roles("duena"))
):
    try:
        hoy = date.today()
        inicio_mes = hoy.replace(day=1)

        if hoy.month == 12:
            inicio_mes_siguiente = hoy.replace(year=hoy.year + 1, month=1, day=1)
        else:
            inicio_mes_siguiente = hoy.replace(month=hoy.month + 1, day=1)

        perdidas_mes_ids = [
            perdida.ID_Perdida
            for perdida in db.query(Perdida).filter(
                Perdida.FechaRegistro >= inicio_mes,
                Perdida.FechaRegistro < inicio_mes_siguiente
            ).all()
        ]

        unidades = Decimal("0")
        costo = Decimal("0.00")

        if perdidas_mes_ids:
            unidades, costo = db.query(
                func.coalesce(func.sum(DetallePerdida.Cantidad), 0),
                func.coalesce(func.sum(DetallePerdida.CostoTotal), 0)
            ).filter(
                DetallePerdida.ID_Perdida.in_(perdidas_mes_ids)
            ).first()

        return {
            "perdidas_mes": len(perdidas_mes_ids),
            "unidades_perdidas_mes": int(unidades or 0),
            "costo_perdidas_mes": _a_decimal(costo),
            "perdidas_totales": db.query(Perdida).count(),
        }
    except ProgrammingError as error:
        _manejar_error_tablas_perdidas(error, db)


@router.get("/", response_model=list[PerdidaListadoResponse])
def listar_perdidas(
    fecha: Optional[date] = None,
    producto: Optional[str] = None,
    proveedor: Optional[int] = None,
    motivo: Optional[str] = None,
    db: Session = Depends(get_db),
    _: UsuarioAutenticado = Depends(requerir_roles("duena"))
):
    try:
        query = _query_perdidas_base(db)

        if fecha:
            query = query.filter(Perdida.FechaRegistro == fecha)

        if proveedor:
            query = query.filter(Perdida.ID_Proveedor == proveedor)

        if motivo and motivo.strip():
            query = query.filter(func.lower(Perdida.Motivo).like(f"%{motivo.strip().lower()}%"))

        producto_filtrado = producto.strip().lower() if producto and producto.strip() else None
        perdidas = []

        for perdida, proveedor_data, compra, empleado in query.order_by(
            Perdida.FechaRegistro.desc(),
            Perdida.ID_Perdida.desc()
        ).all():
            item = _perdida_a_respuesta(perdida, proveedor_data, compra, empleado, db)

            if producto_filtrado:
                detalles = _detalles_perdida(db, perdida.ID_Perdida)
                if not any(producto_filtrado in producto.Nombre.lower() for _, producto, _ in detalles):
                    continue

            perdidas.append(item)

        return perdidas
    except ProgrammingError as error:
        _manejar_error_tablas_perdidas(error, db)


@router.get("/{id_perdida}", response_model=PerdidaDetalleResponse)
def obtener_perdida(
    id_perdida: int,
    db: Session = Depends(get_db),
    _: UsuarioAutenticado = Depends(requerir_roles("duena"))
):
    try:
        data = _query_perdidas_base(db).filter(
            Perdida.ID_Perdida == id_perdida
        ).first()

        if not data:
            raise HTTPException(status_code=404, detail="Pérdida no encontrada.")

        perdida, proveedor, compra, empleado = data
        return _perdida_a_respuesta(perdida, proveedor, compra, empleado, db, incluir_detalle=True)
    except ProgrammingError as error:
        _manejar_error_tablas_perdidas(error, db)


@router.post("/", response_model=PerdidaDetalleResponse)
def registrar_perdida(
    perdida_data: PerdidaCreate,
    db: Session = Depends(get_db),
    usuario_actual: UsuarioAutenticado = Depends(requerir_roles("duena"))
):
    if not perdida_data.productos:
        raise HTTPException(status_code=400, detail="Debes agregar al menos un producto a la pérdida.")

    if not perdida_data.Motivo or not perdida_data.Motivo.strip():
        raise HTTPException(status_code=400, detail="El motivo de la pérdida es obligatorio.")

    proveedor = None
    if perdida_data.ID_Proveedor:
        proveedor = db.query(Proveedor).filter(
            Proveedor.ID_Proveedor == perdida_data.ID_Proveedor
        ).first()

        if not proveedor:
            raise HTTPException(status_code=404, detail="Proveedor no encontrado.")

    compra = None
    if perdida_data.ID_Compra:
        compra = db.query(Compra).filter(
            Compra.ID_Compra == perdida_data.ID_Compra
        ).first()

        if not compra:
            raise HTTPException(status_code=404, detail="Compra no encontrada.")

        if perdida_data.ID_Proveedor and compra.ID_Proveedor != perdida_data.ID_Proveedor:
            raise HTTPException(
                status_code=400,
                detail="La compra no pertenece al proveedor seleccionado."
            )

    id_empleado = perdida_data.ID_Empleado or usuario_actual.id_empleado

    productos_preparados = []
    productos_agrupados = {}

    for item in perdida_data.productos:
        productos_agrupados[item.ID_Producto] = {
            "Cantidad": productos_agrupados.get(item.ID_Producto, {}).get("Cantidad", 0) + item.Cantidad,
            "CostoUnitario": item.CostoUnitario,
        }

    for id_producto, item in productos_agrupados.items():
        producto = db.query(Producto).filter(
            Producto.ID_Producto == id_producto
        ).first()

        if not producto:
            raise HTTPException(status_code=404, detail=f"Producto con ID {id_producto} no encontrado.")

        if str(producto.Estado or "").strip().upper() != "ACTIVO":
            raise HTTPException(
                status_code=400,
                detail=f"El producto {producto.Nombre} no está activo para registrar pérdidas."
            )

        cantidad = item["Cantidad"]

        if cantidad <= 0:
            raise HTTPException(status_code=400, detail="La cantidad perdida debe ser mayor que cero.")

        if producto.Stock < cantidad:
            raise HTTPException(
                status_code=400,
                detail=f"No hay stock suficiente de {producto.Nombre} para registrar la pérdida."
            )

        costo_unitario = item["CostoUnitario"] or _obtener_costo_unitario(
            db,
            producto.ID_Producto,
            perdida_data.ID_Proveedor,
            perdida_data.ID_Compra
        )

        productos_preparados.append({
            "producto": producto,
            "cantidad": cantidad,
            "costo_unitario": costo_unitario,
            "costo_total": costo_unitario * cantidad,
        })

    try:
        nueva_perdida = Perdida(
            ID_Proveedor=perdida_data.ID_Proveedor,
            ID_Compra=perdida_data.ID_Compra,
            ID_Empleado=id_empleado,
            FechaRegistro=perdida_data.FechaRegistro or date.today(),
            Motivo=perdida_data.Motivo.strip(),
            Observacion=perdida_data.Observacion.strip() if perdida_data.Observacion else None,
            Estado=perdida_data.Estado.strip() or "Registrada",
        )

        db.add(nueva_perdida)
        db.flush()

        for item in productos_preparados:
            detalle = DetallePerdida(
                ID_Perdida=nueva_perdida.ID_Perdida,
                ID_Producto=item["producto"].ID_Producto,
                Cantidad=item["cantidad"],
                CostoUnitario=item["costo_unitario"],
                CostoTotal=item["costo_total"],
            )

            db.add(detalle)
            item["producto"].Stock = item["producto"].Stock - item["cantidad"]

        db.commit()
        db.refresh(nueva_perdida)

        data = _query_perdidas_base(db).filter(
            Perdida.ID_Perdida == nueva_perdida.ID_Perdida
        ).first()
        perdida, proveedor_data, compra_data, empleado = data
        return _perdida_a_respuesta(
            perdida,
            proveedor_data,
            compra_data,
            empleado,
            db,
            incluir_detalle=True
        )
    except ProgrammingError as error:
        _manejar_error_tablas_perdidas(error, db)
    except Exception:
        db.rollback()
        raise
