from sqlalchemy import Column, Integer, Unicode
from app.database import Base


class Talla(Base):
    __tablename__ = "Tallas"

    ID_Talla = Column(Integer, primary_key=True, index=True)
    Talla = Column(Unicode(50), nullable=False)