from sqlalchemy import Column, Integer, Numeric, Unicode, ForeignKey
from app.database import Base


class PagoVenta(Base):
    __tablename__ = "PagosVenta"

    ID_PagoVenta = Column(Integer, primary_key=True, index=True)

    ID_Venta = Column(
        Integer,
        ForeignKey("Ventas.ID_Venta"),
        nullable=False
    )

    Tipo_pago = Column(
        Integer,
        ForeignKey("Tipo_pago.Tipo_pago"),
        nullable=False
    )

    Monto = Column(Numeric(10, 2), nullable=False)
    Referencia = Column(Unicode(100), nullable=True)