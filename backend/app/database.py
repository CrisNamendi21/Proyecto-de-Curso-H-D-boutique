from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.engine import URL

#Importamos el objeto settings() del fichero config.py
from app.config import settings

#Se construye la URL de conexion
connection_url = URL.create(
    "mssql+pyodbc",
    host=settings.DB_SERVER,
    database=settings.DB_NAME,
    query={
        "driver": settings.DB_DRIVER,
        "Trusted_Connection": settings.DB_TRUSTED_CONNECTION
    }
)

#Creacion del motor de base de datos
engine = create_engine(connection_url)

#Se crean las sesiones
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

#se define esta linea de codigo
Base = declarative_base()

#Base es importante porque todos los modulos de SQLAlchemy heredan de ahi

#Esta funcion abre una sesion de base de datos, se la entrega a las rutas y luego
#la cierra automaticamente
def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()