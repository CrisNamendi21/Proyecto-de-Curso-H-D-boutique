from typing import Optional
from pydantic import BaseModel, ConfigDict


class DireccionClienteBase(BaseModel):
    ID_Departamento: int
    Direccion: Optional[str] = None


class DireccionClienteCreate(DireccionClienteBase):
    pass


class DireccionClienteUpdate(BaseModel):
    ID_Departamento: Optional[int] = None
    Direccion: Optional[str] = None


class DireccionClienteResponse(DireccionClienteBase):
    ID_Direccion: int

    model_config = ConfigDict(from_attributes=True)