from datetime import date
from typing import Optional
from pydantic import BaseModel, ConfigDict


class EmpleadoBase(BaseModel):
    ID_Direccion_empleado: int
    Nombres: str
    Apellidos: str
    NumeroTelefono: str
    FechaInicio: date
    CorreoProfesional: Optional[str] = None
    Cargo: Optional[str] = None
    FechaFin: Optional[date] = None


class EmpleadoCreate(EmpleadoBase):
    pass


class EmpleadoUpdate(BaseModel):
    ID_Direccion_empleado: Optional[int] = None
    Nombres: Optional[str] = None
    Apellidos: Optional[str] = None
    NumeroTelefono: Optional[str] = None
    FechaInicio: Optional[date] = None
    CorreoProfesional: Optional[str] = None
    Cargo: Optional[str] = None
    FechaFin: Optional[date] = None


class EmpleadoResponse(EmpleadoBase):
    ID_Empleado: int

    model_config = ConfigDict(from_attributes=True)