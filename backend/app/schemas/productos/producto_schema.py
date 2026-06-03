from typing import Optional
from pydantic import BaseModel, ConfigDict
from decimal import Decimal


class ProductoBase(BaseModel):
    ID_Categoria: int
    ID_Talla: int
    Nombre: str
    Stock: int
    Estado: str
    Descripcion: Optional[str] = None


class ProductoCreate(ProductoBase):
    pass


class ProductoCompletoCreate(ProductoBase):
    ID_Proveedor: int
    PrecioDeCompra: Decimal


class ProductoUpdate(BaseModel):
    ID_Categoria: Optional[int] = None
    ID_Talla: Optional[int] = None
    Nombre: Optional[str] = None
    Stock: Optional[int] = None
    Estado: Optional[str] = None
    Descripcion: Optional[str] = None


class ProductoEstadoUpdate(BaseModel):
    Estado: str


class ProductoResponse(ProductoBase):
    ID_Producto: int
    PrecioUnitario: Optional[Decimal] = None
    PrecioDeCompra: Optional[Decimal] = None
    Talla: Optional[str] = None
    Categoria: Optional[str] = None
    ID_Proveedor: Optional[int] = None
    Proveedor: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ProductoInventarioResumen(BaseModel):
    total_productos: int
    valor_inventario: Decimal
    productos_bajos_stock: int
    productos_sin_stock: int
