from datetime import date
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class CompraBase(BaseModel):
    ID_Proveedor: int
    ID_Empleado: int
    FechaCompra: date
    total: Decimal
    Descripcion: str
    FechaRevision: Optional[date] = None
    CostoDeEnvio: Optional[Decimal] = None
    FechaRelleno: Optional[date] = None


class CompraCreate(CompraBase):
    pass


class CompraUpdate(BaseModel):
    ID_Proveedor: Optional[int] = None
    ID_Empleado: Optional[int] = None
    FechaCompra: Optional[date] = None
    total: Optional[Decimal] = None
    Descripcion: Optional[str] = None
    FechaRevision: Optional[date] = None
    CostoDeEnvio: Optional[Decimal] = None
    FechaRelleno: Optional[date] = None


class CompraResponse(CompraBase):
    ID_Compra: int

    model_config = ConfigDict(from_attributes=True)


class CompraResumenResponse(BaseModel):
    compras_mes: Decimal
    ordenes_registradas: int
    monto_invertido: Decimal
    proveedores_activos: int


class CompraListadoResponse(BaseModel):
    ID_Compra: int
    ID_Proveedor: int
    fecha: str
    proveedor: str
    producto_principal: str
    cantidad_total: int
    monto: Decimal
    estado: str
    descripcion: Optional[str] = None
    costo_envio: Decimal


class ProductoProveedorCompraResponse(BaseModel):
    ID_ProductoProveedor: int
    ID_Producto: int
    Nombre: str
    ID_Talla: int
    Talla: Optional[str] = None
    PrecioDeCompra: Decimal
    Stock: int


class CompraCompletaProducto(BaseModel):
    ID_ProductoProveedor: int
    Cantidad: int = Field(gt=0)


class CompraCompletaCreate(BaseModel):
    ID_Proveedor: int
    ID_Empleado: int = 1
    FechaCompra: date
    Estado: str
    Descripcion: Optional[str] = None
    CostoDeEnvio: Optional[Decimal] = Field(default=None, ge=0)
    productos: list[CompraCompletaProducto]


class CompraCompletaResponse(BaseModel):
    mensaje: str
    ID_Compra: int
    ID_Proveedor: int
    ID_Empleado: int
    TotalProductos: Decimal
    CostoDeEnvio: Decimal
    TotalCompra: Decimal
    Estado: str
    DetallesRegistrados: int
