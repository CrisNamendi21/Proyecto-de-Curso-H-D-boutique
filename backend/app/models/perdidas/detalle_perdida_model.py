from sqlalchemy import Column, DECIMAL, ForeignKey, Integer

from app.database import Base


class DetallePerdida(Base):
    __tablename__ = "DetallePerdidas"

    ID_DetallePerdida = Column(Integer, primary_key=True, index=True)
    ID_Perdida = Column(
        Integer,
        ForeignKey("Perdidas.ID_Perdida"),
        nullable=False
    )
    ID_Producto = Column(
        Integer,
        ForeignKey("Productos.ID_Producto"),
        nullable=False
    )
    Cantidad = Column(Integer, nullable=False)
    CostoUnitario = Column(DECIMAL(10, 2), nullable=False)
    CostoTotal = Column(DECIMAL(10, 2), nullable=False)
