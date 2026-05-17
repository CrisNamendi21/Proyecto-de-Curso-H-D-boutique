from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DB_SERVER: str
    DB_NAME: str
    DB_DRIVER: str
    DB_TRUSTED_CONNECTION: str

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8"
    )


settings = Settings()