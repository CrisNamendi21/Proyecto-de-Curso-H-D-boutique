from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field


class ProductoVentaCompleta(BaseModel):
    ID_Producto: int
    Cantidad: int = Field(gt=0)
    PrecioUnitario: Decimal = Field(gt=0)


class PagoVentaCompleta(BaseModel):
    Tipo_pago: int
    Monto: Decimal = Field(gt=0)
    Referencia: Optional[str] = None


class ClienteVentaCompleta(BaseModel):
    Nombres: Optional[str] = None
    Apellidos: Optional[str] = None
    NumeroTelefono: Optional[str] = None
    Direccion: Optional[str] = None
    ID_Departamento: Optional[int] = None
    ID_Municipio: Optional[int] = None


class VentaCompletaCreate(BaseModel):
    ID_Cliente: Optional[int] = None
    ID_Empleado: int
    CostoDelivery: Optional[Decimal] = Field(default=None, gt=0)
    ObservacionRecibo: Optional[str] = "Recibo generado automáticamente."
    cliente: Optional[ClienteVentaCompleta] = None
    productos: List[ProductoVentaCompleta] = Field(min_length=1)
    pagos: List[PagoVentaCompleta] = Field(min_length=1)
