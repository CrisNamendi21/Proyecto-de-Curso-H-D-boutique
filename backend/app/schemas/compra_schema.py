from datetime import date
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict


class CompraBase(BaseModel):
    ID_Proveedor: int
    ID_Empleado: int
    FechaCompra: date
    total: Decimal
    Descripcion: str
    FechaRevision: Optional[date] = None
    CostoDeEnvio: Optional[Decimal] = None
    FechaRelleno: Optional[date] = None


class CompraCreate(CompraBase):
    pass


class CompraUpdate(BaseModel):
    ID_Proveedor: Optional[int] = None
    ID_Empleado: Optional[int] = None
    FechaCompra: Optional[date] = None
    total: Optional[Decimal] = None
    Descripcion: Optional[str] = None
    FechaRevision: Optional[date] = None
    CostoDeEnvio: Optional[Decimal] = None
    FechaRelleno: Optional[date] = None


class CompraResponse(CompraBase):
    ID_Compra: int

    model_config = ConfigDict(from_attributes=True)