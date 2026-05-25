from pydantic import BaseModel


class CategoriaBase(BaseModel):
    Categoria: str


class CategoriaCreate(CategoriaBase):
    pass


class CategoriaUpdate(CategoriaBase):
    pass


class CategoriaResponse(CategoriaBase):
    ID_Categoria: int

    class Config:
        from_attributes = True