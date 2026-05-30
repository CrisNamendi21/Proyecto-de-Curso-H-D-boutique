import getpass
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT))

from app.auth.security import generar_hash_password  # noqa: E402


def main() -> None:
    password = getpass.getpass("Contrasena a convertir en hash: ")
    confirmacion = getpass.getpass("Confirmar contrasena: ")

    if password != confirmacion:
        raise SystemExit("Las contrasenas no coinciden.")

    print(generar_hash_password(password))


if __name__ == "__main__":
    main()
