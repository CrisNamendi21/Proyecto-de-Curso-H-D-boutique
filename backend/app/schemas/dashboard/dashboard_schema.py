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
