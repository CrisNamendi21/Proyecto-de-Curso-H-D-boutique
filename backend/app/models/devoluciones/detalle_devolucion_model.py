from sqlalchemy import Column, Integer, ForeignKey
from app.database import Base


class DetalleDevolucion(Base):
    __tablename__ = "DetalleDevolucion"

    ID_DetalleDevolucion = Column(Integer, primary_key=True, index=True)
    ID_Devolucion = Column(
        Integer,
        ForeignKey("Devolucion.ID_Devolucion"),
        nullable=False
    )
    ID_DetalleVenta = Column(
        Integer,
        ForeignKey("DetalleVenta.ID_DetalleVenta"),
        nullable=False
    )
    Cantidad = Column(Integer, nullable=False)