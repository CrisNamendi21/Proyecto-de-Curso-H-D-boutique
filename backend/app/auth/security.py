import base64
import hashlib
import hmac
import json
from datetime import datetime, timedelta, timezone
from typing import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.empleados.empleado_model import Empleado
from app.models.usuarios.usuario_model import UsuarioSistema
from app.schemas.auth.auth_schema import UsuarioAutenticado


bearer_scheme = HTTPBearer(auto_error=False)


def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _base64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def _firmar_jwt(header: str, payload: str) -> str:
    contenido = f"{header}.{payload}".encode("utf-8")
    firma = hmac.new(
        settings.JWT_SECRET_KEY.encode("utf-8"),
        contenido,
        hashlib.sha256
    ).digest()
    return _base64url_encode(firma)


def generar_hash_password(password: str) -> str:
    # Nunca se guarda la contrasena plana; solo se compara contra este hash.
    hash_generado = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        settings.PASSWORD_HASH_SALT.encode("utf-8"),
        120000
    ).hex()

    return hash_generado


def verificar_password_hash(password: str, password_hash: str) -> bool:
    hash_generado = generar_hash_password(password)
    return hmac.compare_digest(hash_generado, password_hash)


def crear_token_acceso(datos: dict) -> str:
    # El token transporta la identidad de la sesion, pero no reemplaza la validacion en base.
    expiracion = datetime.now(timezone.utc) + timedelta(
        minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {
        **datos,
        "exp": int(expiracion.timestamp()),
    }
    header = {
        "alg": settings.JWT_ALGORITHM,
        "typ": "JWT",
    }

    header_codificado = _base64url_encode(json.dumps(header).encode("utf-8"))
    payload_codificado = _base64url_encode(json.dumps(payload).encode("utf-8"))
    firma = _firmar_jwt(header_codificado, payload_codificado)

    return f"{header_codificado}.{payload_codificado}.{firma}"


def decodificar_token(token: str) -> dict:
    try:
        header_codificado, payload_codificado, firma = token.split(".")
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalido."
        ) from exc

    try:
        header = json.loads(_base64url_decode(header_codificado))
    except (json.JSONDecodeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalido."
        ) from exc

    if header.get("alg") != settings.JWT_ALGORITHM:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalido."
        )

    firma_esperada = _firmar_jwt(header_codificado, payload_codificado)

    if not hmac.compare_digest(firma, firma_esperada):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalido."
        )

    try:
        payload = json.loads(_base64url_decode(payload_codificado))
    except (json.JSONDecodeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalido."
        ) from exc

    expiracion = payload.get("exp")
    ahora = int(datetime.now(timezone.utc).timestamp())

    if not expiracion or ahora > expiracion:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="La sesion expiro."
        )

    return payload


def obtener_usuario_actual(
    credenciales: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> UsuarioAutenticado:
    if not credenciales:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticacion requerido."
        )

    payload = decodificar_token(credenciales.credentials)
    id_usuario = payload.get("id_usuario")
    usuario = payload.get("sub")
    nombre = payload.get("nombre")
    rol = payload.get("rol", "").strip().lower()

    if not id_usuario or not usuario or rol not in ("duena", "colaborador"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticacion invalido."
        )

    # Se vuelve a consultar la base para bloquear tokens viejos de usuarios o empleados desactivados.
    data = db.query(UsuarioSistema, Empleado).join(
        Empleado,
        UsuarioSistema.ID_Empleado == Empleado.ID_Empleado
    ).filter(
        UsuarioSistema.ID_Usuario == id_usuario
    ).first()

    if not data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticacion invalido."
        )

    usuario_sistema, empleado = data

    if (
        usuario_sistema.Estado.strip().upper() != "ACTIVO"
        or empleado.FechaFin
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario se encuentra inactivo."
        )

    return UsuarioAutenticado(
        id_usuario=id_usuario,
        usuario=usuario,
        nombre=nombre or usuario,
        rol=rol,
        id_empleado=payload.get("id_empleado")
    )


def requerir_roles(*roles_permitidos: str) -> Callable:
    roles_normalizados = {rol.lower() for rol in roles_permitidos}

    def validador(
        usuario_actual: UsuarioAutenticado = Depends(obtener_usuario_actual)
    ) -> UsuarioAutenticado:
        if usuario_actual.rol.lower() not in roles_normalizados:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para acceder a este recurso."
            )

        return usuario_actual

    return validador
