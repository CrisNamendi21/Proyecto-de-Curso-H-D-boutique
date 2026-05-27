from pydantic import BaseModel


class ResumenVentasDia(BaseModel):
    ventas_hoy: float
    transacciones: int
    productos_vendidos: int
    total_neto: float


class ProductoVentaDia(BaseModel):
    producto: str
    talla: str
    cantidad: int
    precio: float
    subtotal: float


class VentaDiaItem(BaseModel):
    id_venta: int
    numero_venta: str
    hora: str
    fecha: str
    cliente: str
    metodo_pago: str
    total: float
    productos: int
    productos_detalle: list[ProductoVentaDia]


class ProductoMasVendidoDia(BaseModel):
    producto: str
    cantidad: int
    total_vendido: float


class MetodoPagoDia(BaseModel):
    metodo: str
    total: float


class VentasResumenDiaResponse(BaseModel):
    resumen: ResumenVentasDia
    ventas: list[VentaDiaItem]
    productos_mas_vendidos: list[ProductoMasVendidoDia]
    metodos_pago: list[MetodoPagoDia]
