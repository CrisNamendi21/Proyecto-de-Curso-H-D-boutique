from fastapi import APIRouter, Depends, HTTPException
from decimal import Decimal
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.productos.producto_model import Producto
from app.models.productos.producto_proveedor_model import ProductoProveedor
from app.models.catalogos.categoria_model import Categoria
from app.models.catalogos.talla_model import Talla
from app.schemas.productos.producto_schema import (
    ProductoCreate,
    ProductoUpdate,
    ProductoResponse,
)


router = APIRouter(
    prefix="/productos",
    tags=["Productos"]
)


def producto_con_precio(producto: Producto, db: Session):
    producto_data = {
        "ID_Producto": producto.ID_Producto,
        "ID_Categoria": producto.ID_Categoria,
        "ID_Talla": producto.ID_Talla,
        "Nombre": producto.Nombre,
        "Stock": producto.Stock,
        "Estado": producto.Estado,
        "Descripcion": producto.Descripcion,
        "PrecioUnitario": None,
    }

    producto_proveedor = db.query(ProductoProveedor).filter(
        ProductoProveedor.ID_Producto == producto.ID_Producto
    ).order_by(
        ProductoProveedor.ID_ProductoProveedor.desc()
    ).first()

    if producto_proveedor:
        producto_data["PrecioUnitario"] = producto_proveedor.PrecioDeCompra * Decimal("1.15")

    return producto_data


@router.get("/", response_model=list[ProductoResponse])
def listar_productos(db: Session = Depends(get_db)):
    productos = db.query(Producto).all()
    return [producto_con_precio(producto, db) for producto in productos]


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

    return nuevo_producto


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
