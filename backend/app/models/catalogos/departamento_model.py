from sqlalchemy import Column, Integer, Unicode
from app.database import Base


class Departamento(Base):
    __tablename__ = "Departamentos"

    ID_Departamento = Column(Integer, primary_key=True, index=True)
    Departamento = Column(Unicode(100), nullable=False)