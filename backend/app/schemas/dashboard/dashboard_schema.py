from pydantic import BaseModel


class DashboardResumen(BaseModel):
    ventas_dia: float
    cantidad_ventas_dia: int
    ventas_mes: float
    cantidad_ventas_mes: int
    stock_bajo: int
    productos_vendidos_mes: int


class VentaSemanal(BaseModel):
    dia: str
    total: float


class UltimaVentaDashboard(BaseModel):
    id_venta: int
    fecha: str
    cliente: str
    producto: str
    total: float


class DashboardResponse(BaseModel):
    resumen: DashboardResumen
    ventas_semanales: list[VentaSemanal]
    ultimas_ventas: list[UltimaVentaDashboard]


class ClienteTopDashboard(BaseModel):
    ID_Cliente: int
    cliente: str
    compras: int
    total: float


class ProductoTopDashboard(BaseModel):
    ID_Producto: int
    producto: str
    cantidad: int
    total: float


class ResumenVentaPeriodoItem(BaseModel):
    etiqueta: str
    total_vendido: float
    cantidad_ventas: int


class ResumenVentasPeriodoResponse(BaseModel):
    periodo: str
    titulo: str
    etiquetas: list[str]
    datos: list[ResumenVentaPeriodoItem]
    total_periodo: float
    cantidad_ventas_periodo: int
    fecha_inicio: str
    fecha_fin: str
    mes: int | None = None
    anio: int | None = None
