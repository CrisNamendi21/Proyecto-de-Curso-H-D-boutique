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


class EmpleadoResumenResponse(BaseModel):
    empleados_registrados: int
    activos: int
    inactivos: int
    colaboradores: int


class EmpleadoListadoResponse(BaseModel):
    ID_Empleado: int
    ID_Direccion_empleado: int
    Nombres: str
    Apellidos: str
    NombreCompleto: str
    NumeroTelefono: str
    CorreoProfesional: Optional[str] = None
    Cargo: Optional[str] = None
    Estado: str
    FechaInicio: date
    FechaFin: Optional[date] = None
    Direccion: Optional[str] = None
    ID_Departamento: Optional[int] = None
    Departamento: Optional[str] = None
    ID_Municipio: Optional[int] = None
    Municipio: Optional[str] = None


class EmpleadoCompletoCreate(BaseModel):
    Nombres: str
    Apellidos: str
    NumeroTelefono: str
    FechaInicio: date
    CorreoProfesional: Optional[str] = None
    Cargo: Optional[str] = "Empleado"
    Direccion: str
    ID_Departamento: int
    ID_Municipio: int


class EmpleadoEstadoUpdate(BaseModel):
    Estado: str
