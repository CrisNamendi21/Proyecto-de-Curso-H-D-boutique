from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.security import (
    crear_token_acceso,
    obtener_usuario_actual,
    verificar_password_duena,
)
from app.config import settings
from app.schemas.auth.auth_schema import (
    LoginRequest,
    TokenResponse,
    UsuarioAutenticado,
)


router = APIRouter(
    prefix="/auth",
    tags=["Autenticación"]
)


@router.post("/login", response_model=TokenResponse)
def iniciar_sesion(datos: LoginRequest):
    usuario_valido = datos.Usuario.strip() == settings.DUENA_LOGIN_USUARIO
    password_valido = verificar_password_duena(datos.Password)

    if not usuario_valido or not password_valido:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos."
        )

    token = crear_token_acceso({
        "sub": settings.DUENA_LOGIN_USUARIO,
        "nombre": settings.DUENA_LOGIN_NOMBRE,
        "rol": "duena",
    })

    return TokenResponse(
        access_token=token,
        usuario=settings.DUENA_LOGIN_USUARIO,
        nombre=settings.DUENA_LOGIN_NOMBRE,
        rol="duena"
    )


@router.get("/me", response_model=UsuarioAutenticado)
def obtener_perfil_actual(
    usuario_actual: UsuarioAutenticado = Depends(obtener_usuario_actual)
):
    return usuario_actual
