import base64
import hashlib
import hmac
import json
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings
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
    hash_generado = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        settings.DUENA_PASSWORD_SALT.encode("utf-8"),
        120000
    ).hex()

    return hash_generado


def verificar_password_hash(password: str, password_hash: str) -> bool:
    hash_generado = generar_hash_password(password)
    return hmac.compare_digest(hash_generado, password_hash)


def verificar_password_duena(password: str) -> bool:
    return verificar_password_hash(password, settings.DUENA_PASSWORD_HASH)


def crear_token_acceso(datos: dict) -> str:
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
            detail="Token inválido."
        ) from exc

    try:
        header = json.loads(_base64url_decode(header_codificado))
    except (json.JSONDecodeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido."
        ) from exc

    if header.get("alg") != settings.JWT_ALGORITHM:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido."
        )

    firma_esperada = _firmar_jwt(header_codificado, payload_codificado)

    if not hmac.compare_digest(firma, firma_esperada):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido."
        )

    try:
        payload = json.loads(_base64url_decode(payload_codificado))
    except (json.JSONDecodeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido."
        ) from exc

    expiracion = payload.get("exp")
    ahora = int(datetime.now(timezone.utc).timestamp())

    if not expiracion or ahora > expiracion:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="La sesión expiró."
        )

    return payload


def obtener_usuario_actual(
    credenciales: HTTPAuthorizationCredentials | None = Depends(bearer_scheme)
) -> UsuarioAutenticado:
    if not credenciales:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticación requerido."
        )

    payload = decodificar_token(credenciales.credentials)
    usuario = payload.get("sub")
    nombre = payload.get("nombre")
    rol = payload.get("rol")

    if not usuario or rol not in ("duena", "colaborador"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticación inválido."
        )

    return UsuarioAutenticado(
        usuario=usuario,
        nombre=nombre or settings.DUENA_LOGIN_NOMBRE,
        rol=rol,
        id_empleado=payload.get("id_empleado")
    )
