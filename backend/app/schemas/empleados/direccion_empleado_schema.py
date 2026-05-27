from typing import Optional
from pydantic import BaseModel, ConfigDict


class DireccionEmpleadoBase(BaseModel):
    Departamento: int
    ID_Municipio: Optional[int] = None
    Direccion: Optional[str] = None


class DireccionEmpleadoCreate(DireccionEmpleadoBase):
    pass


class DireccionEmpleadoUpdate(BaseModel):
    Departamento: Optional[int] = None
    ID_Municipio: Optional[int] = None
    Direccion: Optional[str] = None


class DireccionEmpleadoResponse(DireccionEmpleadoBase):
    ID_Direccion_empleado: int

    model_config = ConfigDict(from_attributes=True)
