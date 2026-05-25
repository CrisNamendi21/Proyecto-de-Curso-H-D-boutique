from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.catalogos.categoria_model import Categoria
from app.schemas.catalogos.categoria_schema import (
    CategoriaCreate,
    CategoriaUpdate,
    CategoriaResponse
)


router = APIRouter(
    prefix="/categorias",
    tags=["Categorías"]
)


@router.get("/", response_model=list[CategoriaResponse])
def obtener_categorias(db: Session = Depends(get_db)):
    categorias = db.query(Categoria).all()
    return categorias


@router.get("/{id_categoria}", response_model=CategoriaResponse)
def obtener_categoria(id_categoria: int, db: Session = Depends(get_db)):
    categoria = db.query(Categoria).filter(
        Categoria.ID_Categoria == id_categoria
    ).first()

    if categoria is None:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    return categoria


@router.post("/", response_model=CategoriaResponse)
def crear_categoria(datos: CategoriaCreate, db: Session = Depends(get_db)):
    nueva_categoria = Categoria(
        Categoria=datos.Categoria
    )

    db.add(nueva_categoria)
    db.commit()
    db.refresh(nueva_categoria)

    return nueva_categoria


@router.put("/{id_categoria}", response_model=CategoriaResponse)
def actualizar_categoria(
    id_categoria: int,
    datos: CategoriaUpdate,
    db: Session = Depends(get_db)
):
    categoria = db.query(Categoria).filter(
        Categoria.ID_Categoria == id_categoria
    ).first()

    if categoria is None:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    categoria.Categoria = datos.Categoria

    db.commit()
    db.refresh(categoria)

    return categoria