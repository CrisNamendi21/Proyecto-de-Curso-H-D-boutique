from sqlalchemy import Column, Date, Integer, Unicode, ForeignKey
from app.database import Base


class Empleado(Base):
    __tablename__ = "Empleados"

    ID_Empleado = Column(Integer, primary_key=True, index=True)
    ID_Direccion_empleado = Column(
        Integer,
        ForeignKey("Direccion_empleados.ID_Direccion_empleado"),
        nullable=False
    )
    Nombres = Column(Unicode(100), nullable=False)
    Apellidos = Column(Unicode(100), nullable=False)
    NumeroTelefono = Column(Unicode(20), nullable=False)
    FechaInicio = Column(Date, nullable=False)
    CorreoProfesional = Column(Unicode(150), nullable=True)
    Cargo = Column(Unicode(100), nullable=True)
    FechaFin = Column(Date, nullable=True)
