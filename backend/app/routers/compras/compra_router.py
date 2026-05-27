from datetime import date
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.compras.detalle_compra_model import DetalleCompra
from app.models.compras.compra_model import Compra
from app.models.empleados.empleado_model import Empleado
from app.models.productos.producto_model import Producto
from app.models.productos.producto_proveedor_model import ProductoProveedor
from app.models.proveedores.proveedor_model import Proveedor
from app.schemas.compras.compra_schema import (
    CompraCompletaCreate,
    CompraCompletaResponse,
    CompraCreate,
    CompraListadoResponse,
    CompraResumenResponse,
    CompraUpdate,
    CompraResponse,
)


router = APIRouter(
    prefix="/compras",
    tags=["Compras"]
)


def _a_decimal(valor):
    return Decimal(valor or 0)


def _estado_compra(compra: Compra):
    return "Recibida" if compra.FechaRevision else "Pendiente"


def _detalles_compra(db: Session, id_compra: int):
    return db.query(DetalleCompra, ProductoProveedor, Producto).join(
        ProductoProveedor,
        DetalleCompra.ID_ProductoProveedor == ProductoProveedor.ID_ProductoProveedor
    ).join(
        Producto,
        ProductoProveedor.ID_Producto == Producto.ID_Producto
    ).filter(
        DetalleCompra.ID_Compra == id_compra
    ).order_by(
        DetalleCompra.ID_DetalleCompra.asc()
    ).all()


def _producto_principal_y_cantidad(db: Session, id_compra: int):
    detalles = _detalles_compra(db, id_compra)
    cantidad_total = sum(detalle.Cantidad for detalle, _, _ in detalles)

    if not detalles:
        return "Sin productos", 0

    primer_producto = detalles[0][2].Nombre

    if len(detalles) == 1:
        return primer_producto, cantidad_total

    return f"{primer_producto} + {len(detalles) - 1} más", cantidad_total


def _compra_a_listado(compra: Compra, proveedor: Proveedor, db: Session):
    producto_principal, cantidad_total = _producto_principal_y_cantidad(
        db,
        compra.ID_Compra
    )

    return {
        "ID_Compra": compra.ID_Compra,
        "fecha": compra.FechaCompra.isoformat(),
        "proveedor": proveedor.NombreEmpresa,
        "producto_principal": producto_principal,
        "cantidad_total": cantidad_total,
        "monto": _a_decimal(compra.total),
        "estado": _estado_compra(compra),
        "descripcion": compra.Descripcion,
        "costo_envio": _a_decimal(compra.CostoDeEnvio),
    }


@router.get("/resumen", response_model=CompraResumenResponse)
def obtener_resumen_compras(db: Session = Depends(get_db)):
    hoy = date.today()
    inicio_mes = hoy.replace(day=1)

    if hoy.month == 12:
        inicio_mes_siguiente = hoy.replace(year=hoy.year + 1, month=1, day=1)
    else:
        inicio_mes_siguiente = hoy.replace(month=hoy.month + 1, day=1)

    compras_mes = db.query(func.coalesce(func.sum(Compra.total), 0)).filter(
        Compra.FechaCompra >= inicio_mes,
        Compra.FechaCompra < inicio_mes_siguiente
    ).scalar()

    ordenes_registradas = db.query(Compra).filter(
        Compra.FechaCompra >= inicio_mes,
        Compra.FechaCompra < inicio_mes_siguiente
    ).count()

    proveedores_activos = db.query(Proveedor).filter(
        func.lower(Proveedor.Estado) == "activo"
    ).count()

    return {
        "compras_mes": _a_decimal(compras_mes),
        "ordenes_registradas": ordenes_registradas,
        "monto_invertido": _a_decimal(compras_mes),
        "proveedores_activos": proveedores_activos,
    }


@router.get("/", response_model=list[CompraListadoResponse])
def listar_compras(
    busqueda: Optional[str] = None,
    proveedor: Optional[int] = None,
    fecha: Optional[date] = None,
    estado: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Compra, Proveedor).join(
        Proveedor,
        Compra.ID_Proveedor == Proveedor.ID_Proveedor
    )

    if proveedor:
        query = query.filter(Compra.ID_Proveedor == proveedor)

    if fecha:
        query = query.filter(Compra.FechaCompra == fecha)

    compras_data = query.order_by(
        Compra.FechaCompra.desc(),
        Compra.ID_Compra.desc()
    ).all()

    estado_normalizado = estado.strip().lower() if estado else ""
    busqueda_normalizada = busqueda.strip().lower() if busqueda else ""
    compras = []

    for compra, proveedor_data in compras_data:
        item = _compra_a_listado(compra, proveedor_data, db)

        if estado_normalizado and item["estado"].lower() != estado_normalizado:
            continue

        if busqueda_normalizada:
            texto_item = " ".join([
                str(item["ID_Compra"]),
                item["proveedor"],
                item["producto_principal"],
            ]).lower()

            if busqueda_normalizada not in texto_item:
                continue

        compras.append(item)

    return compras


@router.get("/{id_compra}", response_model=CompraResponse)
def obtener_compra(id_compra: int, db: Session = Depends(get_db)):
    compra = db.query(Compra).filter(
        Compra.ID_Compra == id_compra
    ).first()

    if not compra:
        raise HTTPException(status_code=404, detail="Compra no encontrada")

    return compra


@router.post("/", response_model=CompraResponse)
def crear_compra(compra: CompraCreate, db: Session = Depends(get_db)):
    proveedor = db.query(Proveedor).filter(
        Proveedor.ID_Proveedor == compra.ID_Proveedor
    ).first()

    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")

    empleado = db.query(Empleado).filter(
        Empleado.ID_Empleado == compra.ID_Empleado
    ).first()

    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    nueva_compra = Compra(**compra.model_dump())

    db.add(nueva_compra)
    db.commit()
    db.refresh(nueva_compra)

    return nueva_compra


@router.post("/registrar-completa", response_model=CompraCompletaResponse)
def registrar_compra_completa(
    compra: CompraCompletaCreate,
    db: Session = Depends(get_db)
):
    proveedor = db.query(Proveedor).filter(
        Proveedor.ID_Proveedor == compra.ID_Proveedor
    ).first()

    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado.")

    empleado = db.query(Empleado).filter(
        Empleado.ID_Empleado == compra.ID_Empleado
    ).first()

    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado.")

    estado = compra.Estado.strip().capitalize()

    if estado not in ("Pendiente", "Recibida"):
        raise HTTPException(status_code=400, detail="Estado de compra inválido.")

    if not compra.productos:
        raise HTTPException(
            status_code=400,
            detail="Debes agregar al menos un producto a la compra."
        )

    costo_envio = _a_decimal(compra.CostoDeEnvio)

    if costo_envio < 0:
        raise HTTPException(status_code=400, detail="El costo de envío no puede ser negativo.")

    productos_agrupados = {}

    for item in compra.productos:
        productos_agrupados[item.ID_ProductoProveedor] = (
            productos_agrupados.get(item.ID_ProductoProveedor, 0) + item.Cantidad
        )

    detalles_preparados = []
    total_productos = Decimal("0.00")

    for id_producto_proveedor, cantidad in productos_agrupados.items():
        producto_proveedor = db.query(ProductoProveedor, Producto).join(
            Producto,
            ProductoProveedor.ID_Producto == Producto.ID_Producto
        ).filter(
            ProductoProveedor.ID_ProductoProveedor == id_producto_proveedor
        ).first()

        if not producto_proveedor:
            raise HTTPException(status_code=404, detail="Producto no encontrado.")

        relacion, producto = producto_proveedor

        if relacion.ID_Proveedor != compra.ID_Proveedor:
            raise HTTPException(
                status_code=400,
                detail="El producto no pertenece al proveedor seleccionado."
            )

        precio_compra = relacion.PrecioDeCompra

        if precio_compra <= 0:
            raise HTTPException(
                status_code=400,
                detail="El precio de compra debe ser mayor que cero."
            )

        subtotal = cantidad * precio_compra
        total_productos += subtotal
        detalles_preparados.append({
            "relacion": relacion,
            "producto": producto,
            "cantidad": cantidad,
            "precio_compra": precio_compra,
            "subtotal": subtotal,
        })

    total_compra = total_productos + costo_envio

    try:
        nueva_compra = Compra(
            ID_Proveedor=compra.ID_Proveedor,
            ID_Empleado=compra.ID_Empleado,
            FechaCompra=compra.FechaCompra,
            total=total_compra,
            Descripcion=compra.Descripcion or "Compra registrada desde el módulo Compras.",
            FechaRevision=compra.FechaCompra if estado == "Recibida" else None,
            CostoDeEnvio=costo_envio,
            FechaRelleno=None,
        )

        db.add(nueva_compra)
        db.flush()

        for detalle in detalles_preparados:
            nuevo_detalle = DetalleCompra(
                ID_ProductoProveedor=detalle["relacion"].ID_ProductoProveedor,
                ID_Compra=nueva_compra.ID_Compra,
                Cantidad=detalle["cantidad"],
                precio_unitario=detalle["precio_compra"],
                subtotal=detalle["subtotal"],
            )

            db.add(nuevo_detalle)

            if estado == "Recibida":
                detalle["producto"].Stock = detalle["producto"].Stock + detalle["cantidad"]

        db.commit()
        db.refresh(nueva_compra)

        return {
            "mensaje": "Compra completa registrada correctamente.",
            "ID_Compra": nueva_compra.ID_Compra,
            "ID_Proveedor": nueva_compra.ID_Proveedor,
            "ID_Empleado": nueva_compra.ID_Empleado,
            "TotalProductos": total_productos,
            "CostoDeEnvio": costo_envio,
            "TotalCompra": total_compra,
            "Estado": estado,
            "DetallesRegistrados": len(detalles_preparados),
        }
    except Exception:
        db.rollback()
        raise


@router.put("/{id_compra}/recibir", response_model=CompraListadoResponse)
def marcar_compra_recibida(id_compra: int, db: Session = Depends(get_db)):
    compra = db.query(Compra).filter(
        Compra.ID_Compra == id_compra
    ).first()

    if not compra:
        raise HTTPException(status_code=404, detail="Compra no encontrada.")

    if compra.FechaRevision:
        raise HTTPException(status_code=400, detail="La compra ya fue recibida.")

    detalles = _detalles_compra(db, compra.ID_Compra)

    if not detalles:
        raise HTTPException(
            status_code=400,
            detail="La compra no tiene productos registrados."
        )

    try:
        compra.FechaRevision = date.today()

        for detalle, _, producto in detalles:
            producto.Stock = producto.Stock + detalle.Cantidad

        db.commit()
        db.refresh(compra)

        proveedor = db.query(Proveedor).filter(
            Proveedor.ID_Proveedor == compra.ID_Proveedor
        ).first()

        return _compra_a_listado(compra, proveedor, db)
    except Exception:
        db.rollback()
        raise


@router.put("/{id_compra}", response_model=CompraResponse)
def actualizar_compra(
    id_compra: int,
    compra_actualizada: CompraUpdate,
    db: Session = Depends(get_db)
):
    compra = db.query(Compra).filter(
        Compra.ID_Compra == id_compra
    ).first()

    if not compra:
        raise HTTPException(status_code=404, detail="Compra no encontrada")

    datos_actualizados = compra_actualizada.model_dump(exclude_unset=True)

    if "ID_Proveedor" in datos_actualizados:
        proveedor = db.query(Proveedor).filter(
            Proveedor.ID_Proveedor == datos_actualizados["ID_Proveedor"]
        ).first()

        if not proveedor:
            raise HTTPException(status_code=404, detail="Proveedor no encontrado")

    if "ID_Empleado" in datos_actualizados:
        empleado = db.query(Empleado).filter(
            Empleado.ID_Empleado == datos_actualizados["ID_Empleado"]
        ).first()

        if not empleado:
            raise HTTPException(status_code=404, detail="Empleado no encontrado")

    for campo, valor in datos_actualizados.items():
        setattr(compra, campo, valor)

    db.commit()
    db.refresh(compra)

    return compra
