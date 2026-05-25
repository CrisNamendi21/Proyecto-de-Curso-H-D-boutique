from datetime import date
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict


class VentaBase(BaseModel):
    FechaVenta: date
    Tipo_pago: int
    ID_Cliente: int
    ID_Empleado: int
    Total: Decimal


class VentaCreate(VentaBase):
    pass


class VentaUpdate(BaseModel):
    FechaVenta: Optional[date] = None
    Tipo_pago: Optional[int] = None
    ID_Cliente: Optional[int] = None
    ID_Empleado: Optional[int] = None
    Total: Optional[Decimal] = None


class VentaResponse(VentaBase):
    ID_Venta: int

    model_config = ConfigDict(from_attributes=True)