from sqlalchemy import Column, DECIMAL, Integer, ForeignKey
from app.database import Base


class DetalleCompra(Base):
    __tablename__ = "DetalleCompras"

    ID_DetalleCompra = Column(Integer, primary_key=True, index=True)
    ID_ProductoProveedor = Column(
        Integer,
        ForeignKey("ProductoProveedor.ID_ProductoProveedor"),
        nullable=False
    )
    ID_Compra = Column(
        Integer,
        ForeignKey("Compras.ID_Compra"),
        nullable=False
    )
    Cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(DECIMAL(10, 2), nullable=False)
    subtotal = Column(DECIMAL(10, 2), nullable=False)