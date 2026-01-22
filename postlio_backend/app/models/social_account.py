# postlio_backend/app/models/social_account.py
"""
Model konta social media.
Tylko oficjalnie wspierane typy kont z automatyczną publikacją.
"""

from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, JSON, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class SocialAccount(Base):
    """
    Przechowuje połączone konta social media użytkownika.

    Obsługiwane typy:
    - facebook_page: Strony Facebook
    - instagram_business: Konta biznesowe Instagram
    - instagram_creator: Konta twórców Instagram
    - linkedin_profile: Profile LinkedIn
    - linkedin_company: Strony firmowe LinkedIn

    WAŻNE: Tokeny są przechowywane ZASZYFROWANE!
    """
    __tablename__ = "social_accounts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"))

    # Platforma i typ konta
    platform: Mapped[str] = mapped_column(String(50))  # facebook, instagram, linkedin
    account_type: Mapped[str] = mapped_column(String(50))  # facebook_page, instagram_business, etc.

    # Identyfikatory na platformie
    platform_user_id: Mapped[str] = mapped_column(String(255))
    platform_username: Mapped[str] = mapped_column(String(255), nullable=True)

    # Tokeny (ZASZYFROWANE!)
    access_token: Mapped[str] = mapped_column(Text)
    refresh_token: Mapped[str] = mapped_column(Text, nullable=True)
    token_expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    # Dane profilu (JSON)
    profile_data: Mapped[dict] = mapped_column(JSON, nullable=True)

    # Dla Facebook - Page info
    page_id: Mapped[str] = mapped_column(String(255), nullable=True)
    page_name: Mapped[str] = mapped_column(String(255), nullable=True)
    page_access_token: Mapped[str] = mapped_column(Text, nullable=True)

    # Dla Instagram - powiązane z FB Page
    instagram_account_id: Mapped[str] = mapped_column(String(255), nullable=True)
    connected_fb_page_id: Mapped[str] = mapped_column(String(255), nullable=True)

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_used_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    last_error: Mapped[str] = mapped_column(Text, nullable=True)

    # Statystyki
    posts_published: Mapped[int] = mapped_column(Integer, default=0)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<SocialAccount {self.platform}:{self.platform_username} ({self.account_type})>"

    @property
    def is_token_expired(self) -> bool:
        """Sprawdza czy token wygasł."""
        if not self.token_expires_at:
            return False
        return self.token_expires_at < datetime.utcnow()

    @property
    def connection_status(self) -> str:
        """Zwraca status połączenia."""
        if not self.is_active:
            return "disconnected"
        if self.is_token_expired:
            return "expired"
        if self.last_error:
            return "error"
        return "connected"

    @property
    def requires_image(self) -> bool:
        """Czy konto wymaga obrazka (Instagram)."""
        return self.account_type in ("instagram_business", "instagram_creator")