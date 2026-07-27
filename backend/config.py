from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    GROQ_API_KEY: str = ""
    GITHUB_TOKEN: str = ""
    APP_NAME: str    = "CodeGuard API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool      = False
    ALLOWED_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://codeguard-phi.vercel.app",
    ]
    MAX_FILES_PER_SCAN: int   = 20
    MAX_FILE_SIZE_KB: int     = 200
    SCAN_TIMEOUT_SECONDS: int = 120
    DATABASE_URL: str = "sqlite:///./codeguard.db"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()

