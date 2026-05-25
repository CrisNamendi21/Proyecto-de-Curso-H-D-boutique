from sqlalchemy import Column, DECIMAL, Integer, ForeignKey
from app.database import Base


class ProductoProveedor(Base):
    __tablename__ = "ProductoProveedor"

    ID_ProductoProveedor = Column(Integer, primary_key=True, index=True)
    ID_Producto = Column(
        Integer,
        ForeignKey("Productos.ID_Producto"),
        nullable=False
    )
    ID_Proveedor = Column(
        Integer,
        ForeignKey("Proveedores.ID_Proveedor"),
        nullable=False
    )
    PrecioDeCompra = Column(DECIMAL(10, 2), nullable=False)