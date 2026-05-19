from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict


class ProductoProveedorBase(BaseModel):
    ID_Producto: int
    ID_Proveedor: int
    PrecioDeCompra: Decimal


class ProductoProveedorCreate(ProductoProveedorBase):
    pass


class ProductoProveedorUpdate(BaseModel):
    ID_Producto: Optional[int] = None
    ID_Proveedor: Optional[int] = None
    PrecioDeCompra: Optional[Decimal] = None


class ProductoProveedorResponse(ProductoProveedorBase):
    ID_ProductoProveedor: int

    model_config = ConfigDict(from_attributes=True)