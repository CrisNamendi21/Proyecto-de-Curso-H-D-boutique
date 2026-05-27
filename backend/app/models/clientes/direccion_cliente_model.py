from sqlalchemy import Column, Integer, Unicode, ForeignKey
from app.database import Base


class DireccionCliente(Base):
    __tablename__ = "Direccion_clientes"

    ID_Direccion = Column(Integer, primary_key=True, index=True)
    ID_Departamento = Column(
        Integer,
        ForeignKey("Departamentos.ID_Departamento"),
        nullable=False
    )
    ID_Municipio = Column(
        Integer,
        ForeignKey("Municipios.ID_Municipio"),
        nullable=True
    )
    Direccion = Column(Unicode(300), nullable=True)
