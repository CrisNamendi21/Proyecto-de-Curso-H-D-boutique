from typing import Optional
from pydantic import BaseModel, ConfigDict


class DepartamentoBase(BaseModel):
    Departamento: str


class DepartamentoCreate(DepartamentoBase):
    pass


class DepartamentoUpdate(BaseModel):
    Departamento: Optional[str] = None


class DepartamentoResponse(DepartamentoBase):
    ID_Departamento: int

    model_config = ConfigDict(from_attributes=True)