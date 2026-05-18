from typing import Optional
from pydantic import BaseModel, ConfigDict


class TallaBase(BaseModel):
    Talla: str


class TallaCreate(TallaBase):
    pass


class TallaUpdate(BaseModel):
    Talla: Optional[str] = None


class TallaResponse(TallaBase):
    ID_Talla: int

    model_config = ConfigDict(from_attributes=True)