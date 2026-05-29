from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth.security import (
    crear_token_acceso,
    obtener_usuario_actual,
    verificar_password_duena,
    verificar_password_hash,
)
from app.config import settings
from app.database import get_db
from app.models.empleados.empleado_model import Empleado
from app.models.usuarios.usuario_model import UsuarioSistema
from app.schemas.auth.auth_schema import (
    LoginRequest,
    TokenResponse,
    UsuarioAutenticado,
)


router = APIRouter(
    prefix="/auth",
    tags=["Autenticacion"]
)


@router.post("/login", response_model=TokenResponse)
def iniciar_sesion(datos: LoginRequest, db: Session = Depends(get_db)):
    usuario = datos.Usuario.strip()
    password = datos.Password

    if usuario == settings.DUENA_LOGIN_USUARIO and verificar_password_duena(password):
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

    data = db.query(UsuarioSistema, Empleado).join(
        Empleado,
        UsuarioSistema.ID_Empleado == Empleado.ID_Empleado
    ).filter(
        func.lower(UsuarioSistema.Usuario) == usuario.lower()
    ).first()

    if not data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contrasena incorrectos."
        )

    usuario_sistema, empleado = data

    if usuario_sistema.Estado != "ACTIVO" or empleado.FechaFin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario se encuentra inactivo."
        )

    if not verificar_password_hash(password, usuario_sistema.ContrasenaHash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contrasena incorrectos."
        )

    nombre_empleado = f"{empleado.Nombres} {empleado.Apellidos}".strip()
    token = crear_token_acceso({
        "sub": usuario_sistema.Usuario,
        "nombre": nombre_empleado,
        "rol": usuario_sistema.Rol.lower(),
        "id_empleado": empleado.ID_Empleado,
    })

    return TokenResponse(
        access_token=token,
        usuario=usuario_sistema.Usuario,
        nombre=nombre_empleado,
        rol=usuario_sistema.Rol.lower(),
        id_empleado=empleado.ID_Empleado
    )


@router.get("/me", response_model=UsuarioAutenticado)
def obtener_perfil_actual(
    usuario_actual: UsuarioAutenticado = Depends(obtener_usuario_actual)
):
    return usuario_actual
