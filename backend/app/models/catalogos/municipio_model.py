from sqlalchemy import Column, Integer, Unicode, ForeignKey
from app.database import Base


class Municipio(Base):
    __tablename__ = "Municipios"

    ID_Municipio = Column(Integer, primary_key=True, index=True)
    ID_Departamento = Column(Integer, ForeignKey("Departamentos.ID_Departamento"), nullable=False)
    Municipio = Column(Unicode(100), nullable=False)