from sqlalchemy import Column, Integer, Unicode

from app.database import Base


class Categoria(Base):
    __tablename__ = "Categorias"

    ID_Categoria = Column(Integer, primary_key=True, index=True)
    Categoria = Column(Unicode(100), nullable=False)