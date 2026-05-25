from sqlalchemy import Column, Integer, Unicode, DateTime, ForeignKey
from app.database import Base


class Recibo(Base):
    __tablename__ = "Recibos"

    ID_Recibo = Column(Integer, primary_key=True, index=True)

    ID_Venta = Column(
        Integer,
        ForeignKey("Ventas.ID_Venta"),
        nullable=False,
        unique=True
    )

    FechaEmision = Column(DateTime, nullable=False)
    Estado = Column(Unicode(50), nullable=False)
    Observacion = Column(Unicode(300), nullable=True)