from sqlalchemy import Column, Integer, Unicode
from app.database import Base


class TipoPago(Base):
    __tablename__ = "Tipo_pago"

    Tipo_pago = Column(Integer, primary_key=True, index=True)
    NombrePago = Column(Unicode(100), nullable=False)