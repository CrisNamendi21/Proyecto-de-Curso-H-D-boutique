from sqlalchemy import Column, Date, DECIMAL, Integer, ForeignKey, column
from app.database import Base


class Venta(Base):
    __tablename__ = "Ventas"

    ID_Venta = Column(Integer, primary_key=True, index=True)
    FechaVenta = Column(Date, nullable=False)
    Tipo_pago = Column(
        Integer,
        ForeignKey("Tipo_pago.Tipo_pago"),
        nullable=False
    )
    ID_Cliente = Column(
        Integer,
        ForeignKey("Clientes.ID_Cliente"),
        nullable=False
    )
    ID_Empleado = Column(
        Integer,
        ForeignKey("Empleados.ID_Empleado"),
        nullable=False
    )
    CostoDelivery = Column(DECIMAL(10, 2), nullable=True)
    Total = Column(DECIMAL(10, 2), nullable=False)