from typing import Optional
from pydantic import BaseModel, ConfigDict


class ProveedorBase(BaseModel):
    ID_Direccion_proveedores: int
    NombreEmpresa: str
    NombreDeContacto: str
    ApellidoDeContacto: str
    NumeroTelefono: str
    CorreoProfesional: str
    Estado: str


class ProveedorCreate(ProveedorBase):
    pass


class ProveedorUpdate(BaseModel):
    ID_Direccion_proveedores: Optional[int] = None
    NombreEmpresa: Optional[str] = None
    NombreDeContacto: Optional[str] = None
    ApellidoDeContacto: Optional[str] = None
    NumeroTelefono: Optional[str] = None
    CorreoProfesional: Optional[str] = None
    Estado: Optional[str] = None


class ProveedorResponse(ProveedorBase):
    ID_Proveedor: int

    model_config = ConfigDict(from_attributes=True)