# app/config.py
"""
Konfiguracja aplikacji.
"""
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import Optional

ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    # App
    DEBUG: bool = False
    APP_NAME: str = "Postlio"
    APP_VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"

    # Security
    SECRET_KEY: str = "dev-secret-key-change-this-in-production-min-32-chars"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # Token Encryption (dla social media tokenów)
    TOKEN_ENCRYPTION_KEY: Optional[str] = None

    # Database - PostgreSQL (Neon)
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost/postlio"

    # AI Providers - Text
    GOOGLE_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None

    # AI Providers - Image
    HUGGINGFACE_API_KEY: Optional[str] = None
    POLLINATIONS_API_KEY: Optional[str] = None

    # AI Defaults
    DEFAULT_TEXT_PROVIDER: str = "gemini"
    DEFAULT_IMAGE_PROVIDER: str = "pollinations"

    # Frontend
    FRONTEND_URL: str = "http://localhost:3000"

    # ==================== SOCIAL MEDIA APIs ====================

    # Facebook / Instagram (Meta for Developers)
    FACEBOOK_APP_ID: Optional[str] = None
    FACEBOOK_APP_SECRET: Optional[str] = None
    FACEBOOK_API_VERSION: str = "v18.0"

    # LinkedIn (LinkedIn Developers)
    LINKEDIN_CLIENT_ID: Optional[str] = None
    LINKEDIN_CLIENT_SECRET: Optional[str] = None

    # Google OAuth (Google Cloud Console)
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None

    # OAuth Callback URLs
    @property
    def facebook_redirect_uri(self) -> str:
        return f"{self.FRONTEND_URL}/api/auth/callback/facebook"

    @property
    def instagram_redirect_uri(self) -> str:
        return f"{self.FRONTEND_URL}/api/auth/callback/instagram"

    @property
    def linkedin_redirect_uri(self) -> str:
        return f"{self.FRONTEND_URL}/api/auth/callback/linkedin"

    @property
    def google_redirect_uri(self) -> str:
        return f"{self.FRONTEND_URL}/api/auth/callback/google"

    class Config:
        env_file = ENV_FILE
        extra = "ignore"


settings = Settings()