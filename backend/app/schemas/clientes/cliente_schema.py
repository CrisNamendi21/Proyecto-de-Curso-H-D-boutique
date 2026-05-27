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


class ClienteResumenResponse(BaseModel):
    clientes_registrados: int
    clientes_nuevos_mes: int
    clientes_activos: int
    clientes_con_direccion: int


class ClienteListadoResponse(BaseModel):
    ID_Cliente: int
    ID_Direccion: int
    Nombres: Optional[str] = None
    Apellidos: Optional[str] = None
    NombreCompleto: str
    NumeroTelefono: Optional[str] = None
    Estado: str
    Direccion: Optional[str] = None
    ID_Departamento: Optional[int] = None
    Departamento: Optional[str] = None
    ID_Municipio: Optional[int] = None
    Municipio: Optional[str] = None
    FechaRegistro: Optional[str] = None


class ClienteCompletoCreate(BaseModel):
    Nombres: str
    Apellidos: str
    NumeroTelefono: Optional[str] = None
    Direccion: str
    ID_Departamento: int
    ID_Municipio: int
