from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DB_SERVER: str
    DB_NAME: str
    DB_DRIVER: str
    DB_TRUSTED_CONNECTION: str
    JWT_SECRET_KEY: str = "cambiar-esta-clave-jwt-en-produccion"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    DUENA_LOGIN_USUARIO: str = "duena"
    DUENA_LOGIN_NOMBRE: str = "Dueña H&D Boutique"
    DUENA_PASSWORD_SALT: str = "hdboutique-dev-salt"
    DUENA_PASSWORD_HASH: str = "affb37fd7ee3f2bdd39b4fcbb5dd6bb2d54126d2eaa15841b8861df6619f24b2"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8"
    )


settings = Settings()
