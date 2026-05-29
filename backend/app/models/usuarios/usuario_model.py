from sqlalchemy import Column, DateTime, ForeignKey, Integer, Unicode
from sqlalchemy.sql import func

from app.database import Base


class UsuarioSistema(Base):
    __tablename__ = "Usuarios"

    ID_Usuario = Column(Integer, primary_key=True, index=True)
    ID_Empleado = Column(
        Integer,
        ForeignKey("Empleados.ID_Empleado"),
        nullable=False,
        unique=True
    )
    Usuario = Column(Unicode(80), nullable=False, unique=True)
    ContrasenaHash = Column(Unicode(255), nullable=False)
    Rol = Column(Unicode(30), nullable=False)
    Estado = Column(Unicode(20), nullable=False, default="ACTIVO")
    FechaCreacion = Column(DateTime, nullable=False, server_default=func.now())
