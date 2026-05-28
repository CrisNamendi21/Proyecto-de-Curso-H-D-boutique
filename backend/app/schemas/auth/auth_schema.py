from typing import Optional

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
    id_empleado: Optional[int] = None


class UsuarioAutenticado(BaseModel):
    usuario: str
    nombre: str
    rol: str
    id_empleado: Optional[int] = None
