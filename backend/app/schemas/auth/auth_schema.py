from pydantic import BaseModel


class LoginRequest(BaseModel):
    Usuario: str
    Password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: str
    nombre: str
    rol: str


class UsuarioAutenticado(BaseModel):
    usuario: str
    nombre: str
    rol: str
