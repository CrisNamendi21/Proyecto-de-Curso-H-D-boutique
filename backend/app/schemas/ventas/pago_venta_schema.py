from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict


class PagoVentaBase(BaseModel):
    ID_Venta: int
    Tipo_pago: int
    Monto: Decimal
    Referencia: Optional[str] = None


class PagoVentaCreate(PagoVentaBase):
    pass


class PagoVentaUpdate(BaseModel):
    Tipo_pago: Optional[int] = None
    Monto: Optional[Decimal] = None
    Referencia: Optional[str] = None


class PagoVentaResponse(PagoVentaBase):
    ID_PagoVenta: int

    model_config = ConfigDict(from_attributes=True)