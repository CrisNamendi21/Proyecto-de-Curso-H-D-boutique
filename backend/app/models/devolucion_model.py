from sqlalchemy import Column, Date, DECIMAL, Integer, Unicode, ForeignKey
from app.database import Base


class Devolucion(Base):
    __tablename__ = "Devolucion"

    ID_Devolucion = Column(Integer, primary_key=True, index=True)
    ID_Venta = Column(
        Integer,
        ForeignKey("Ventas.ID_Venta"),
        nullable=False
    )
    FechaDevolucion = Column(Date, nullable=False)
    Motivo = Column(Unicode(300), nullable=False)
    Estado = Column(Unicode(50), nullable=False)
    Total_Devuelto = Column(DECIMAL(10, 2), nullable=False)