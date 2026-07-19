# app/config.py
"""
Konfiguracja aplikacji.
"""
import os
from pathlib import Path
from pydantic import model_validator
from pydantic_settings import BaseSettings
from typing import Optional

ENV_FILE = Path(__file__).resolve().parent.parent / ".env"

_DEFAULT_SECRET_KEY = "dev-secret-key-change-this-in-production-min-32-chars"

# pytest-env ustawia TESTING=true przed importem modułów (patrz database.py)
TESTING = os.environ.get("TESTING", "false").lower() == "true"


class Settings(BaseSettings):
    # App
    DEBUG: bool = False
    APP_NAME: str = "Postlio"
    APP_VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"

    # Security
    SECRET_KEY: str = _DEFAULT_SECRET_KEY
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

    # ==================== CLOUDFLARE R2 (magazyn obrazow) ====================

    R2_ACCOUNT_ID: Optional[str] = None
    R2_ACCESS_KEY_ID: Optional[str] = None
    R2_SECRET_ACCESS_KEY: Optional[str] = None
    R2_BUCKET_NAME: Optional[str] = None
    R2_ENDPOINT_URL: Optional[str] = None
    R2_PUBLIC_URL: Optional[str] = None
    # Bezpiecznik: odmawia uploadu, zanim zbliżymy się do darmowego limitu R2.
    # Cloudflare liczy 10 GB dziesiętnie (10^9 B); 8000 MiB = 8.39 GB, czyli ~16% zapasu.
    R2_SAFETY_LIMIT_MB: int = 8000

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

    @model_validator(mode="after")
    def _validate_production_secrets(self) -> "Settings":
        """Fail fast zamiast cicho startować z niebezpiecznymi defaultami."""
        if self.DEBUG or TESTING:
            return self

        if self.SECRET_KEY == _DEFAULT_SECRET_KEY or len(self.SECRET_KEY) < 32:
            raise ValueError(
                "SECRET_KEY must be set to a unique value of at least 32 characters "
                "when DEBUG=false. Set the SECRET_KEY environment variable."
            )

        if not self.TOKEN_ENCRYPTION_KEY:
            raise ValueError(
                "TOKEN_ENCRYPTION_KEY must be set when DEBUG=false. "
                "There is no insecure fallback in production."
            )

        return self


settings = Settings()