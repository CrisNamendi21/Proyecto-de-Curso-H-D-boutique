from typing import Optional

from pydantic import BaseModel


class LoginRequest(BaseModel):
    Usuario: str
    Password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    id_usuario: int
    usuario: str
    nombre: str
    rol: str
    id_empleado: Optional[int] = None


class UsuarioAutenticado(BaseModel):
    id_usuario: int
    usuario: str
    nombre: str
    rol: str
    id_empleado: Optional[int] = None
