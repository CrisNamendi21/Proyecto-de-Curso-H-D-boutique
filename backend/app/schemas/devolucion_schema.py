from datetime import date
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict


class DevolucionBase(BaseModel):
    ID_Venta: int
    FechaDevolucion: date
    Motivo: str
    Estado: str
    Total_Devuelto: Decimal


class DevolucionCreate(DevolucionBase):
    pass


class DevolucionUpdate(BaseModel):
    ID_Venta: Optional[int] = None
    FechaDevolucion: Optional[date] = None
    Motivo: Optional[str] = None
    Estado: Optional[str] = None
    Total_Devuelto: Optional[Decimal] = None


class DevolucionResponse(DevolucionBase):
    ID_Devolucion: int

    model_config = ConfigDict(from_attributes=True)