from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict


class DetalleVentaBase(BaseModel):
    ID_Venta: int
    ID_Producto: int
    Cantidad: int
    PrecioUnitario: Decimal
    subtotal: Decimal


class DetalleVentaCreate(DetalleVentaBase):
    pass


class DetalleVentaUpdate(BaseModel):
    ID_Venta: Optional[int] = None
    ID_Producto: Optional[int] = None
    Cantidad: Optional[int] = None
    PrecioUnitario: Optional[Decimal] = None
    subtotal: Optional[Decimal] = None


class DetalleVentaResponse(DetalleVentaBase):
    ID_DetalleVenta: int

    model_config = ConfigDict(from_attributes=True)