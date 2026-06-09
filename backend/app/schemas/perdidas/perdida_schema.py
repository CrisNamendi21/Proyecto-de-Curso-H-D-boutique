from datetime import date
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class PerdidaProductoCreate(BaseModel):
    ID_Producto: int
    Cantidad: int = Field(gt=0)
    CostoUnitario: Optional[Decimal] = Field(default=None, gt=0)


class PerdidaCreate(BaseModel):
    ID_Proveedor: Optional[int] = None
    ID_Compra: Optional[int] = None
    ID_Empleado: Optional[int] = None
    FechaRegistro: Optional[date] = None
    Motivo: str
    Observacion: Optional[str] = None
    Estado: str = "Registrada"
    productos: list[PerdidaProductoCreate]


class PerdidaDetalleProductoResponse(BaseModel):
    ID_DetallePerdida: int
    ID_Producto: int
    producto: str
    talla: Optional[str] = None
    cantidad: int
    costo_unitario: Decimal
    costo_total: Decimal


class PerdidaListadoResponse(BaseModel):
    ID_Perdida: int
    fecha: str
    proveedor: Optional[str] = None
    ID_Compra: Optional[int] = None
    empleado: Optional[str] = None
    motivo: str
    observacion: Optional[str] = None
    estado: str
    cantidad_total: int
    costo_total: Decimal
    producto_principal: str


class PerdidaDetalleResponse(PerdidaListadoResponse):
    productos: list[PerdidaDetalleProductoResponse]


class PerdidaResumenResponse(BaseModel):
    perdidas_mes: int
    unidades_perdidas_mes: int
    costo_perdidas_mes: Decimal
    perdidas_totales: int
