# postlio_backend/app/models/autopilot.py
"""
Modele Autopilot - konfiguracja i kolejka postów.
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Text, Integer, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
import enum


class AutopilotStatus(str, enum.Enum):
    """Status elementu w kolejce"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    PUBLISHED = "published"
    FAILED = "failed"
    SCHEDULED = "scheduled"


class PostLength(str, enum.Enum):
    """Długość generowanego posta"""
    SHORT = "short"
    MEDIUM = "medium"
    LONG = "long"


class AutopilotConfig(Base):
    """
    Konfiguracja Autopilota dla marki.
    Każda marka może mieć jedną aktywną konfigurację.
    """
    __tablename__ = "autopilot_configs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    brand_id: Mapped[int] = mapped_column(Integer, ForeignKey("brands.id", ondelete="CASCADE"), unique=True)

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    is_paused: Mapped[bool] = mapped_column(Boolean, default=False)

    # Harmonogram
    posts_per_week: Mapped[int] = mapped_column(Integer, default=3)
    schedule_days: Mapped[dict] = mapped_column(JSON, default=["monday", "wednesday", "friday"])
    schedule_time: Mapped[str] = mapped_column(String(5), default="10:00")
    timezone: Mapped[str] = mapped_column(String(50), default="Europe/Warsaw")

    # Platformy docelowe
    platforms: Mapped[dict] = mapped_column(JSON, default=["facebook", "instagram"])

    # === NOWE: Powiązanie z kontami social media ===
    # Mapowanie: platform -> social_account_id
    # Przykład: {"facebook": 1, "instagram": 2, "linkedin": 3}
    social_account_mapping: Mapped[dict] = mapped_column(JSON, default={})

    # Czy automatycznie publikować po zatwierdzeniu (True)
    # czy tylko w zaplanowanym czasie (False)
    auto_publish_on_approve: Mapped[bool] = mapped_column(Boolean, default=False)

    # Kategorie tematyczne (rotacja)
    categories: Mapped[dict] = mapped_column(JSON, default=["lifestyle"])

    # Ustawienia generowania
    creativity_level: Mapped[int] = mapped_column(Integer, default=50)
    post_length: Mapped[str] = mapped_column(String(10), default="medium")
    include_images: Mapped[bool] = mapped_column(Boolean, default=True)
    include_hashtags: Mapped[bool] = mapped_column(Boolean, default=True)
    include_emoji: Mapped[bool] = mapped_column(Boolean, default=True)

    # Preferencje AI
    text_provider: Mapped[str] = mapped_column(String(20), default="gemini")
    image_provider: Mapped[str] = mapped_column(String(20), default="pollinations")
    image_style: Mapped[str] = mapped_column(String(20), default="realistic")

    # Statystyki
    total_generated: Mapped[int] = mapped_column(Integer, default=0)
    total_approved: Mapped[int] = mapped_column(Integer, default=0)
    total_rejected: Mapped[int] = mapped_column(Integer, default=0)
    total_published: Mapped[int] = mapped_column(Integer, default=0)
    streak_days: Mapped[int] = mapped_column(Integer, default=0)
    last_generation_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_published_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="autopilot_configs")
    brand = relationship("Brand", back_populates="autopilot_config")
    queue_items = relationship("AutopilotQueueItem", back_populates="config", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<AutopilotConfig(id={self.id}, brand_id={self.brand_id}, active={self.is_active})>"

    def get_social_account_id(self, platform: str) -> Optional[int]:
        """Pobierz ID konta social dla danej platformy."""
        mapping = self.social_account_mapping or {}
        return mapping.get(platform)


class AutopilotQueueItem(Base):
    """
    Element kolejki Autopilota.
    Wygenerowany post czekający na zatwierdzenie lub publikację.
    """
    __tablename__ = "autopilot_queue"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    config_id: Mapped[int] = mapped_column(Integer, ForeignKey("autopilot_configs.id", ondelete="CASCADE"))
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    brand_id: Mapped[int] = mapped_column(Integer, ForeignKey("brands.id", ondelete="CASCADE"))

    # Treść posta
    platform: Mapped[str] = mapped_column(String(20))
    content: Mapped[str] = mapped_column(Text)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    hashtags: Mapped[dict] = mapped_column(JSON, default=[])

    # Metadane generowania
    category: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    topic_used: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Status i planowanie
    status: Mapped[str] = mapped_column(String(20), default="pending")
    scheduled_for: Mapped[datetime] = mapped_column(DateTime)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # === NOWE: Powiązanie z kontem social media ===
    social_account_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("social_accounts.id", ondelete="SET NULL"),
        nullable=True
    )

    # Identyfikator posta na platformie (po publikacji)
    platform_post_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    platform_post_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Błędy publikacji
    publish_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    publish_attempts: Mapped[int] = mapped_column(Integer, default=0)
    last_publish_attempt_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # AI info
    text_provider_used: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    image_provider_used: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    generation_params: Mapped[dict] = mapped_column(JSON, default={})

    # Feedback użytkownika
    user_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    edit_count: Mapped[int] = mapped_column(Integer, default=0)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    config = relationship("AutopilotConfig", back_populates="queue_items")
    user = relationship("User", back_populates="autopilot_queue_items")
    brand = relationship("Brand", back_populates="autopilot_queue_items")
    social_account = relationship("SocialAccount", foreign_keys=[social_account_id])

    def __repr__(self) -> str:
        return f"<AutopilotQueueItem(id={self.id}, platform={self.platform}, status={self.status})>"

    @property
    def can_publish(self) -> bool:
        """Sprawdza czy element może być opublikowany."""
        return (
                self.status == "approved"
                and self.social_account_id is not None
                and self.publish_attempts < 3  # Max 3 próby
        )

    @property
    def is_ready_to_publish(self) -> bool:
        """Sprawdza czy nadszedł czas publikacji."""
        if not self.can_publish:
            return False
        return datetime.utcnow() >= self.scheduled_for