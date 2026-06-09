from sqlalchemy import Column, Date, ForeignKey, Integer, Unicode

from app.database import Base


class Perdida(Base):
    __tablename__ = "Perdidas"

    ID_Perdida = Column(Integer, primary_key=True, index=True)
    ID_Proveedor = Column(
        Integer,
        ForeignKey("Proveedores.ID_Proveedor"),
        nullable=True
    )
    ID_Compra = Column(
        Integer,
        ForeignKey("Compras.ID_Compra"),
        nullable=True
    )
    ID_Empleado = Column(
        Integer,
        ForeignKey("Empleados.ID_Empleado"),
        nullable=True
    )
    FechaRegistro = Column(Date, nullable=False)
    Motivo = Column(Unicode(150), nullable=False)
    Observacion = Column(Unicode(500), nullable=True)
    Estado = Column(Unicode(50), nullable=False)
