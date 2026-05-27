from fastapi import APIRouter, Depends, HTTPException
from decimal import Decimal
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.productos.producto_model import Producto
from app.models.productos.producto_proveedor_model import ProductoProveedor
from app.models.proveedores.proveedor_model import Proveedor
from app.models.catalogos.categoria_model import Categoria
from app.models.catalogos.talla_model import Talla
from app.schemas.productos.producto_schema import (
    ProductoCompletoCreate,
    ProductoCreate,
    ProductoInventarioResumen,
    ProductoResponse,
    ProductoUpdate,
)


router = APIRouter(
    prefix="/productos",
    tags=["Productos"]
)


def producto_con_precio(producto: Producto, db: Session):
    categoria = db.query(Categoria).filter(
        Categoria.ID_Categoria == producto.ID_Categoria
    ).first()

    talla = db.query(Talla).filter(
        Talla.ID_Talla == producto.ID_Talla
    ).first()

    producto_data = {
        "ID_Producto": producto.ID_Producto,
        "ID_Categoria": producto.ID_Categoria,
        "ID_Talla": producto.ID_Talla,
        "Talla": talla.Talla if talla else None,
        "Nombre": producto.Nombre,
        "Stock": producto.Stock,
        "Estado": producto.Estado,
        "Descripcion": producto.Descripcion,
        "PrecioUnitario": None,
        "PrecioDeCompra": None,
        "Categoria": categoria.Categoria if categoria else None,
        "ID_Proveedor": None,
        "Proveedor": None,
    }

    producto_proveedor = db.query(ProductoProveedor, Proveedor).join(
        Proveedor,
        ProductoProveedor.ID_Proveedor == Proveedor.ID_Proveedor
    ).filter(
        ProductoProveedor.ID_Producto == producto.ID_Producto
    ).order_by(
        ProductoProveedor.ID_ProductoProveedor.desc()
    ).first()

    if producto_proveedor:
        relacion, proveedor = producto_proveedor
        producto_data["PrecioDeCompra"] = relacion.PrecioDeCompra
        producto_data["PrecioUnitario"] = relacion.PrecioDeCompra * Decimal("1.15")
        producto_data["ID_Proveedor"] = proveedor.ID_Proveedor
        producto_data["Proveedor"] = proveedor.NombreEmpresa

    return producto_data


@router.get("/", response_model=list[ProductoResponse])
def listar_productos(db: Session = Depends(get_db)):
    productos = db.query(Producto).order_by(Producto.ID_Producto.desc()).all()
    return [producto_con_precio(producto, db) for producto in productos]


@router.get("/resumen-inventario", response_model=ProductoInventarioResumen)
def obtener_resumen_inventario(db: Session = Depends(get_db)):
    productos = db.query(Producto).all()
    total_productos = len(productos)
    productos_bajos_stock = sum(
        1 for producto in productos if producto.Stock > 0 and producto.Stock <= 5
    )
    productos_sin_stock = sum(1 for producto in productos if producto.Stock == 0)

    valor_inventario = Decimal("0.00")

    for producto in productos:
        producto_proveedor = db.query(ProductoProveedor).filter(
            ProductoProveedor.ID_Producto == producto.ID_Producto
        ).order_by(
            ProductoProveedor.ID_ProductoProveedor.desc()
        ).first()

        if producto_proveedor:
            valor_inventario += producto.Stock * producto_proveedor.PrecioDeCompra

    return {
        "total_productos": total_productos,
        "valor_inventario": valor_inventario,
        "productos_bajos_stock": productos_bajos_stock,
        "productos_sin_stock": productos_sin_stock,
    }


@router.get("/{id_producto}", response_model=ProductoResponse)
def obtener_producto(id_producto: int, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(
        Producto.ID_Producto == id_producto
    ).first()

    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    return producto_con_precio(producto, db)


@router.post("/", response_model=ProductoResponse)
def crear_producto(producto: ProductoCreate, db: Session = Depends(get_db)):
    categoria = db.query(Categoria).filter(
        Categoria.ID_Categoria == producto.ID_Categoria
    ).first()

    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    talla = db.query(Talla).filter(
        Talla.ID_Talla == producto.ID_Talla
    ).first()

    if not talla:
        raise HTTPException(status_code=404, detail="Talla no encontrada")

    nuevo_producto = Producto(**producto.model_dump())

    db.add(nuevo_producto)
    db.commit()
    db.refresh(nuevo_producto)

    return producto_con_precio(nuevo_producto, db)


@router.post("/registrar-completo", response_model=ProductoResponse)
def crear_producto_completo(producto: ProductoCompletoCreate, db: Session = Depends(get_db)):
    if not producto.Nombre or not producto.Nombre.strip():
        raise HTTPException(status_code=400, detail="El nombre del producto es obligatorio.")

    if producto.Stock < 0:
        raise HTTPException(status_code=400, detail="El stock no puede ser negativo.")

    if producto.PrecioDeCompra <= 0:
        raise HTTPException(status_code=400, detail="El costo debe ser mayor que cero.")

    categoria = db.query(Categoria).filter(
        Categoria.ID_Categoria == producto.ID_Categoria
    ).first()

    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada.")

    talla = db.query(Talla).filter(
        Talla.ID_Talla == producto.ID_Talla
    ).first()

    if not talla:
        raise HTTPException(status_code=404, detail="Talla no encontrada.")

    proveedor = db.query(Proveedor).filter(
        Proveedor.ID_Proveedor == producto.ID_Proveedor
    ).first()

    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado.")

    try:
        nuevo_producto = Producto(
            ID_Categoria=producto.ID_Categoria,
            ID_Talla=producto.ID_Talla,
            Nombre=producto.Nombre.strip(),
            Stock=producto.Stock,
            Estado=producto.Estado,
            Descripcion=producto.Descripcion,
        )

        db.add(nuevo_producto)
        db.flush()

        relacion = ProductoProveedor(
            ID_Producto=nuevo_producto.ID_Producto,
            ID_Proveedor=producto.ID_Proveedor,
            PrecioDeCompra=producto.PrecioDeCompra,
        )

        db.add(relacion)
        db.commit()
        db.refresh(nuevo_producto)

        return producto_con_precio(nuevo_producto, db)
    except Exception:
        db.rollback()
        raise


@router.put("/{id_producto}", response_model=ProductoResponse)
def actualizar_producto(
    id_producto: int,
    producto_actualizado: ProductoUpdate,
    db: Session = Depends(get_db)
):
    producto = db.query(Producto).filter(
        Producto.ID_Producto == id_producto
    ).first()

    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    datos_actualizados = producto_actualizado.model_dump(exclude_unset=True)

    if "ID_Categoria" in datos_actualizados:
        categoria = db.query(Categoria).filter(
            Categoria.ID_Categoria == datos_actualizados["ID_Categoria"]
        ).first()

        if not categoria:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")

    if "ID_Talla" in datos_actualizados:
        talla = db.query(Talla).filter(
            Talla.ID_Talla == datos_actualizados["ID_Talla"]
        ).first()

        if not talla:
            raise HTTPException(status_code=404, detail="Talla no encontrada")

    for campo, valor in datos_actualizados.items():
        setattr(producto, campo, valor)

    db.commit()
    db.refresh(producto)

    return producto
