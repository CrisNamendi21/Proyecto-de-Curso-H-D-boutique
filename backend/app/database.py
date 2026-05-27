from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.engine import URL

from app.config import settings

connection_url = URL.create(
    "mssql+pyodbc",
    host=settings.DB_SERVER,
    database=settings.DB_NAME,
    query={
        "driver": settings.DB_DRIVER,
        "Trusted_Connection": settings.DB_TRUSTED_CONNECTION
    }
)

engine = create_engine(connection_url)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        # FastAPI cierra esta sesion despues de cada request que usa Depends(get_db).
        db.close()
