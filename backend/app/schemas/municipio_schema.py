from typing import Optional
from pydantic import BaseModel, ConfigDict


class MunicipioBase(BaseModel):
    ID_Departamento: int
    Municipio: str


class MunicipioCreate(MunicipioBase):
    pass


class MunicipioUpdate(BaseModel):
    ID_Departamento: Optional[int] = None
    Municipio: Optional[str] = None


class MunicipioResponse(MunicipioBase):
    ID_Municipio: int

    model_config = ConfigDict(from_attributes=True)