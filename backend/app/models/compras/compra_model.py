from sqlalchemy import Column, Date, DECIMAL, Integer, Unicode, ForeignKey
from app.database import Base


class Compra(Base):
    __tablename__ = "Compras"

    ID_Compra = Column(Integer, primary_key=True, index=True)
    ID_Proveedor = Column(
        Integer,
        ForeignKey("Proveedores.ID_Proveedor"),
        nullable=False
    )
    ID_Empleado = Column(
        Integer,
        ForeignKey("Empleados.ID_Empleado"),
        nullable=False
    )
    FechaCompra = Column(Date, nullable=False)
    total = Column(DECIMAL(10, 2), nullable=False)
    Descripcion = Column(Unicode(300), nullable=False)
    FechaRevision = Column(Date, nullable=True)
    CostoDeEnvio = Column(DECIMAL(10, 2), nullable=True)
    FechaRelleno = Column(Date, nullable=True)