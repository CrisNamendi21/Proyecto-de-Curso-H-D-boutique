from sqlalchemy import Column, Integer, Unicode, ForeignKey
from app.database import Base


class Proveedor(Base):
    __tablename__ = "Proveedores"

    ID_Proveedor = Column(Integer, primary_key=True, index=True)
    ID_Direccion_proveedores = Column(
        Integer,
        ForeignKey("Direccion_proveedores.ID_Direccion_proveedores"),
        nullable=False
    )
    NombreEmpresa = Column(Unicode(150), nullable=False)
    NombreDeContacto = Column(Unicode(100), nullable=False)
    ApellidoDeContacto = Column(Unicode(100), nullable=False)
    NumeroTelefono = Column(Unicode(20), nullable=False)
    CorreoProfesional = Column(Unicode(150), nullable=False)
    Estado = Column(Unicode(50), nullable=False)