from typing import Optional
from pydantic import BaseModel, ConfigDict


class TipoPagoBase(BaseModel):
    NombrePago: str


class TipoPagoCreate(TipoPagoBase):
    pass


class TipoPagoUpdate(BaseModel):
    NombrePago: Optional[str] = None


class TipoPagoResponse(TipoPagoBase):
    Tipo_pago: int

    model_config = ConfigDict(from_attributes=True)