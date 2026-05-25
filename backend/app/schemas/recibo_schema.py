from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class ReciboBase(BaseModel):
    ID_Venta: int
    FechaEmision: datetime
    Estado: str
    Observacion: Optional[str] = None


class ReciboCreate(ReciboBase):
    pass


class ReciboUpdate(BaseModel):
    FechaEmision: Optional[datetime] = None
    Estado: Optional[str] = None
    Observacion: Optional[str] = None


class ReciboResponse(ReciboBase):
    ID_Recibo: int

    model_config = ConfigDict(from_attributes=True)