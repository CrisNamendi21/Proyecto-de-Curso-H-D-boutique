from sqlalchemy import Column, Integer, Unicode, ForeignKey
from app.database import Base


class Producto(Base):
    __tablename__ = "Productos"

    ID_Producto = Column(Integer, primary_key=True, index=True)
    ID_Categoria = Column(
        Integer,
        ForeignKey("Categorias.ID_Categoria"),
        nullable=False
    )
    ID_Talla = Column(
        Integer,
        ForeignKey("Tallas.ID_Talla"),
        nullable=False
    )
    Nombre = Column(Unicode(150), nullable=False)
    Stock = Column(Integer, nullable=False)
    Estado = Column(Unicode(50), nullable=False)
    Descripcion = Column(Unicode(300), nullable=True)