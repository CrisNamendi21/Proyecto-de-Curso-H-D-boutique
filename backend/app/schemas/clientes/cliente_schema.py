from typing import Optional
from pydantic import BaseModel, ConfigDict


class ClienteBase(BaseModel):
    ID_Direccion: int
    Nombres: str
    Apellidos: str
    Estado: str
    NumeroTelefono: Optional[str] = None


class ClienteCreate(ClienteBase):
    pass


class ClienteUpdate(BaseModel):
    ID_Direccion: Optional[int] = None
    Nombres: Optional[str] = None
    Apellidos: Optional[str] = None
    Estado: Optional[str] = None
    NumeroTelefono: Optional[str] = None


class ClienteResponse(ClienteBase):
    ID_Cliente: int

    model_config = ConfigDict(from_attributes=True)