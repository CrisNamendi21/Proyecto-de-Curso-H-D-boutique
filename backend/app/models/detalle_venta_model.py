from sqlalchemy import Column, DECIMAL, Integer, ForeignKey
from app.database import Base


class DetalleVenta(Base):
    __tablename__ = "DetalleVenta"

    ID_DetalleVenta = Column(Integer, primary_key=True, index=True)
    ID_Venta = Column(
        Integer,
        ForeignKey("Ventas.ID_Venta"),
        nullable=False
    )
    ID_Producto = Column(
        Integer,
        ForeignKey("Productos.ID_Producto"),
        nullable=False
    )
    Cantidad = Column(Integer, nullable=False)
    PrecioUnitario = Column(DECIMAL(10, 2), nullable=False)
    subtotal = Column(DECIMAL(10, 2), nullable=False)