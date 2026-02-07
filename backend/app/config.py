from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    App configuration.
    Pydantic automatically reads values from the .env file.
    """
    DATABASE_URL: str
    REDIS_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = "../.env"  # Points to the .env file at project root


settings = Settings()