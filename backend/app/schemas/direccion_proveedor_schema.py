from typing import Optional
from pydantic import BaseModel, ConfigDict


class DireccionProveedorBase(BaseModel):
    Departamento: int
    Direccion: Optional[str] = None


class DireccionProveedorCreate(DireccionProveedorBase):
    pass


class DireccionProveedorUpdate(BaseModel):
    Departamento: Optional[int] = None
    Direccion: Optional[str] = None


class DireccionProveedorResponse(DireccionProveedorBase):
    ID_Direccion_proveedores: int

    model_config = ConfigDict(from_attributes=True)