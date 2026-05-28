from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(
    prefix="/auth",
    tags=["Autenticación"]
)


class LoginRequest(BaseModel):
    usuario: str
    contrasena: str


@router.post("/login")
def login(datos: LoginRequest):
    usuario = datos.usuario.strip().lower()
    contrasena = datos.contrasena.strip()

    # Usuario temporal solo para probar la conexión frontend-backend
    if usuario == "duena" and contrasena == "1234":
        return {
            "mensaje": "Login correcto",
            "rol": "duena"
        }

    raise HTTPException(
        status_code=401,
        detail="Usuario o contraseña incorrectos"
    )