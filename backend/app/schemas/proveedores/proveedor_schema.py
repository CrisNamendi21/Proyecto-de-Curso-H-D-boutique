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


class ProveedorResumenResponse(BaseModel):
    total_proveedores: int
    activos: int
    inactivos: int


class ProveedorListadoResponse(BaseModel):
    ID_Proveedor: int
    ID_Direccion_proveedores: int
    FechaRegistro: Optional[str] = None
    NombreEmpresa: str
    NombreProveedor: str
    NombreDeContacto: str
    ApellidoDeContacto: str
    NumeroTelefono: str
    CorreoProfesional: str
    Direccion: Optional[str] = None
    ID_Departamento: Optional[int] = None
    Departamento: Optional[str] = None
    ID_Municipio: Optional[int] = None
    Municipio: Optional[str] = None
    Estado: str


class ProveedorCompletoCreate(BaseModel):
    NombreEmpresa: str
    NombreDeContacto: str
    ApellidoDeContacto: str
    NumeroTelefono: str
    CorreoProfesional: str
    Direccion: str
    ID_Departamento: int
    ID_Municipio: int


class ProveedorEstadoUpdate(BaseModel):
    Estado: str
