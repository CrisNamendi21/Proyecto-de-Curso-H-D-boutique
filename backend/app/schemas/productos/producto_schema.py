from typing import Optional
from pydantic import BaseModel, ConfigDict
from decimal import Decimal


class ProductoBase(BaseModel):
    ID_Categoria: int
    ID_Talla: int
    Nombre: str
    Stock: int
    Estado: str
    Descripcion: Optional[str] = None


class ProductoCreate(ProductoBase):
    pass


class ProductoUpdate(BaseModel):
    ID_Categoria: Optional[int] = None
    ID_Talla: Optional[int] = None
    Nombre: Optional[str] = None
    Stock: Optional[int] = None
    Estado: Optional[str] = None
    Descripcion: Optional[str] = None


class ProductoResponse(ProductoBase):
    ID_Producto: int
    PrecioUnitario: Optional[Decimal] = None

    model_config = ConfigDict(from_attributes=True)
