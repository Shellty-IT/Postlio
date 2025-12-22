from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Postlio API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # API
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./postlio.db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Security
    SECRET_KEY: str = "your-super-secret-key-change-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # === TEXT AI PROVIDERS ===
    GOOGLE_API_KEY: Optional[str] = None  # Gemini
    GROQ_API_KEY: Optional[str] = None  # Groq (Llama, Mixtral)

    # === IMAGE AI PROVIDERS ===
    CLIPDROP_API_KEY: Optional[str] = None  # Stability AI
    HUGGINGFACE_API_KEY: Optional[str] = None  # Stable Diffusion
    # Pollinations - no key needed

    # Default providers
    DEFAULT_TEXT_PROVIDER: str = "gemini"
    DEFAULT_IMAGE_PROVIDER: str = "pollinations"

    # Social Media APIs
    FACEBOOK_APP_ID: Optional[str] = None
    FACEBOOK_APP_SECRET: Optional[str] = None
    LINKEDIN_CLIENT_ID: Optional[str] = None
    LINKEDIN_CLIENT_SECRET: Optional[str] = None

    # Frontend URL (CORS)
    FRONTEND_URL: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()