from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    mongodb_uri: str
    frontend_origins: str
    monitoring_interval: int = 300

    class Config:
        env_file = ".env"

    @property
    def allowed_origins(self) -> list[str]:
        return self.frontend_origins.split(',')


@lru_cache()
def get_settings() -> Settings:
    return Settings()
