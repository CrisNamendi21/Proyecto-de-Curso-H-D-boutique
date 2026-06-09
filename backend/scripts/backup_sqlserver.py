"""Crea un backup .bak de la base SQL Server configurada en el proyecto.

Uso:
  python backend/scripts/backup_sqlserver.py
  python backend/scripts/backup_sqlserver.py --dry-run

Variables soportadas:
  DB_SERVER, DB_NAME, DB_DRIVER, DB_TRUSTED_CONNECTION, DB_USER, DB_PASSWORD,
  BACKUP_DIR.
"""

from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_BACKUP_DIR = PROJECT_ROOT / "backups"


def load_env_files() -> None:
    try:
        from dotenv import load_dotenv
    except ImportError:
        return

    load_dotenv(PROJECT_ROOT / ".env")
    load_dotenv(PROJECT_ROOT / "backend" / ".env")


def env(name: str, default: str = "") -> str:
    return os.getenv(name, default).strip()


def bracket_identifier(value: str) -> str:
    return f"[{value.replace(']', ']]')}]"


def build_connection_string() -> str:
    driver = env("DB_DRIVER", "ODBC Driver 17 for SQL Server")
    server = env("DB_SERVER", "localhost")
    database = env("DB_NAME")
    trusted = env("DB_TRUSTED_CONNECTION", "yes").lower()

    if not database:
        raise RuntimeError("Falta configurar DB_NAME.")

    parts = [
        f"DRIVER={{{driver}}}",
        f"SERVER={server}",
        f"DATABASE={database}",
    ]

    if trusted in {"yes", "true", "1", "trusted_connection"}:
        parts.append("Trusted_Connection=yes")
    else:
        user = env("DB_USER")
        password = env("DB_PASSWORD")

        if not user or not password:
            raise RuntimeError(
                "DB_USER y DB_PASSWORD son obligatorios si DB_TRUSTED_CONNECTION no está activo."
            )

        parts.extend([f"UID={user}", f"PWD={password}"])

    return ";".join(parts) + ";"


def build_backup_path() -> Path:
    backup_dir = Path(env("BACKUP_DIR") or DEFAULT_BACKUP_DIR)

    if not backup_dir.is_absolute():
        backup_dir = PROJECT_ROOT / backup_dir

    database = env("DB_NAME")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_database = "".join(
        character if character.isalnum() or character in ("-", "_") else "_"
        for character in database
    )

    return backup_dir / f"{safe_database}_{timestamp}.bak"


def run_backup(dry_run: bool = False) -> Path:
    load_env_files()

    database = env("DB_NAME")
    if not database:
        raise RuntimeError("Falta configurar DB_NAME en el entorno o archivo .env.")

    backup_path = build_backup_path()
    sql = (
        f"BACKUP DATABASE {bracket_identifier(database)} "
        "TO DISK = ? WITH COPY_ONLY, STATS = 10"
    )

    if dry_run:
        print(f"Base de datos: {database}")
        print(f"Archivo destino: {backup_path}")
        print("Modo dry-run: no se ejecutó el backup.")
        return backup_path

    backup_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        import pyodbc
    except ImportError as exc:
        raise RuntimeError(
            "No se encontró pyodbc. Instala los requerimientos del backend antes de ejecutar el backup."
        ) from exc

    connection = pyodbc.connect(build_connection_string(), autocommit=True)

    try:
        cursor = connection.cursor()
        cursor.execute(sql, str(backup_path))
        while cursor.nextset():
            pass
    finally:
        connection.close()

    print(f"Backup creado: {backup_path}")
    return backup_path


def main() -> None:
    parser = argparse.ArgumentParser(description="Crear backup SQL Server de H&D Boutique.")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Muestra la ruta del backup sin conectarse a SQL Server.",
    )
    args = parser.parse_args()

    try:
        run_backup(dry_run=args.dry_run)
    except RuntimeError as error:
        print(f"Error: {error}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
