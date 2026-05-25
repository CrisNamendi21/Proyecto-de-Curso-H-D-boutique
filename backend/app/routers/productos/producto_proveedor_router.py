from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.productos.producto_model import Producto
from app.models.proveedores.proveedor_model import Proveedor
from app.models.productos.producto_proveedor_model import ProductoProveedor
from app.schemas.productos.producto_proveedor_schema import (
    ProductoProveedorCreate,
    ProductoProveedorUpdate,
    ProductoProveedorResponse,
)


router = APIRouter(
    prefix="/productos-proveedores",
    tags=["Productos proveedores"]
)


@router.get("/", response_model=list[ProductoProveedorResponse])
def listar_productos_proveedores(db: Session = Depends(get_db)):
    return db.query(ProductoProveedor).all()


@router.get("/{id_producto_proveedor}", response_model=ProductoProveedorResponse)
def obtener_producto_proveedor(
    id_producto_proveedor: int,
    db: Session = Depends(get_db)
):
    producto_proveedor = db.query(ProductoProveedor).filter(
        ProductoProveedor.ID_ProductoProveedor == id_producto_proveedor
    ).first()

    if not producto_proveedor:
        raise HTTPException(
            status_code=404,
            detail="Relación producto-proveedor no encontrada"
        )

    return producto_proveedor


@router.post("/", response_model=ProductoProveedorResponse)
def crear_producto_proveedor(
    producto_proveedor: ProductoProveedorCreate,
    db: Session = Depends(get_db)
):
    producto = db.query(Producto).filter(
        Producto.ID_Producto == producto_proveedor.ID_Producto
    ).first()

    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    proveedor = db.query(Proveedor).filter(
        Proveedor.ID_Proveedor == producto_proveedor.ID_Proveedor
    ).first()

    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")

    nuevo_producto_proveedor = ProductoProveedor(**producto_proveedor.model_dump())

    db.add(nuevo_producto_proveedor)
    db.commit()
    db.refresh(nuevo_producto_proveedor)

    return nuevo_producto_proveedor


@router.put("/{id_producto_proveedor}", response_model=ProductoProveedorResponse)
def actualizar_producto_proveedor(
    id_producto_proveedor: int,
    producto_proveedor_actualizado: ProductoProveedorUpdate,
    db: Session = Depends(get_db)
):
    producto_proveedor = db.query(ProductoProveedor).filter(
        ProductoProveedor.ID_ProductoProveedor == id_producto_proveedor
    ).first()

    if not producto_proveedor:
        raise HTTPException(
            status_code=404,
            detail="Relación producto-proveedor no encontrada"
        )

    datos_actualizados = producto_proveedor_actualizado.model_dump(exclude_unset=True)

    if "ID_Producto" in datos_actualizados:
        producto = db.query(Producto).filter(
            Producto.ID_Producto == datos_actualizados["ID_Producto"]
        ).first()

        if not producto:
            raise HTTPException(status_code=404, detail="Producto no encontrado")

    if "ID_Proveedor" in datos_actualizados:
        proveedor = db.query(Proveedor).filter(
            Proveedor.ID_Proveedor == datos_actualizados["ID_Proveedor"]
        ).first()

        if not proveedor:
            raise HTTPException(status_code=404, detail="Proveedor no encontrado")

    for campo, valor in datos_actualizados.items():
        setattr(producto_proveedor, campo, valor)

    db.commit()
    db.refresh(producto_proveedor)

    return producto_proveedor