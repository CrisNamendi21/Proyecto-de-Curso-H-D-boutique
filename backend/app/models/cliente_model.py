from sqlalchemy import Column, Integer, Unicode, ForeignKey
from app.database import Base


class Cliente(Base):
    __tablename__ = "Clientes"

    ID_Cliente = Column(Integer, primary_key=True, index=True)
    ID_Direccion = Column(
        Integer,
        ForeignKey("Direccion_clientes.ID_Direccion"),
        nullable=False
    )
    Nombres = Column(Unicode(100), nullable=False)
    Apellidos = Column(Unicode(100), nullable=False)
    Estado = Column(Unicode(50), nullable=False)
    NumeroTelefono = Column(Unicode(20), nullable=True)