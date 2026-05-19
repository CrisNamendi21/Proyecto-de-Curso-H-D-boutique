from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict


class DetalleCompraBase(BaseModel):
    ID_ProductoProveedor: int
    ID_Compra: int
    Cantidad: int
    precio_unitario: Decimal
    subtotal: Decimal


class DetalleCompraCreate(DetalleCompraBase):
    pass


class DetalleCompraUpdate(BaseModel):
    ID_ProductoProveedor: Optional[int] = None
    ID_Compra: Optional[int] = None
    Cantidad: Optional[int] = None
    precio_unitario: Optional[Decimal] = None
    subtotal: Optional[Decimal] = None


class DetalleCompraResponse(DetalleCompraBase):
    ID_DetalleCompra: int

    model_config = ConfigDict(from_attributes=True)