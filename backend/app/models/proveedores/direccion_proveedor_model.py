from sqlalchemy import Column, Integer, Unicode, ForeignKey
from app.database import Base


class DireccionProveedor(Base):
    __tablename__ = "Direccion_proveedores"

    ID_Direccion_proveedores = Column(Integer, primary_key=True, index=True)
    Departamento = Column(
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
