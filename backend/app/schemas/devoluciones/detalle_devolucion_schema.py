from typing import Optional
from pydantic import BaseModel, ConfigDict


class DetalleDevolucionBase(BaseModel):
    ID_Devolucion: int
    ID_DetalleVenta: int
    Cantidad: int


class DetalleDevolucionCreate(DetalleDevolucionBase):
    pass


class DetalleDevolucionUpdate(BaseModel):
    ID_Devolucion: Optional[int] = None
    ID_DetalleVenta: Optional[int] = None
    Cantidad: Optional[int] = None


class DetalleDevolucionResponse(DetalleDevolucionBase):
    ID_DetalleDevolucion: int

    model_config = ConfigDict(from_attributes=True)