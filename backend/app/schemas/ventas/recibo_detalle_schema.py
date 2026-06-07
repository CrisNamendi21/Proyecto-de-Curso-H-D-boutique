from pydantic import BaseModel


class ReciboResumenResponse(BaseModel):
    recibos_hoy: int
    recibos_mes: int
    monto_facturado: float


class ProductoReciboResponse(BaseModel):
    producto: str
    talla: str
    cantidad: int
    precio: float
    subtotal: float


class ReciboListadoResponse(BaseModel):
    ID_Recibo: int
    numero_recibo: str
    numero_venta: str
    fecha: str
    cliente: str
    vendedor: str
    medio_pago: str
    total: float
    estado: str


class ReciboDetalleResponse(ReciboListadoResponse):
    delivery: float
    total_productos: float
    productos: list[ProductoReciboResponse]
