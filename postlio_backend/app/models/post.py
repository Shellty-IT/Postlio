# postlio_backend/app/models/post.py
"""
Post model z obsługą wielu platform.

NAPRAWIONE:
- image_url zmienione z String(500) na Text - obsługa długich URL-i i base64
"""

from datetime import datetime
from enum import Enum
from typing import List, Dict, Any, Optional
from sqlalchemy import JSON, String, Text, Integer, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

_JSONB = JSON().with_variant(JSONB, "postgresql")


class PostStatus(str, Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    PUBLISHING = "publishing"
    PUBLISHED = "published"
    FAILED = "failed"


class Platform(str, Enum):
    FACEBOOK = "facebook"
    INSTAGRAM = "instagram"
    LINKEDIN = "linkedin"


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    brand_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("brands.id"), nullable=True)

    content: Mapped[str] = mapped_column(Text)
    image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    image_prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    platform: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    platform_post_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default=PostStatus.DRAFT.value)

    platforms: Mapped[List[str]] = mapped_column(_JSONB, default=list)
    platform_statuses: Mapped[Dict[str, Any]] = mapped_column(_JSONB, default=dict)

    scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    ai_generated: Mapped[bool] = mapped_column(Boolean, default=False)
    ai_model: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    generation_params: Mapped[Optional[dict]] = mapped_column(_JSONB, nullable=True)

    likes: Mapped[int] = mapped_column(Integer, default=0)
    comments: Mapped[int] = mapped_column(Integer, default=0)
    shares: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def get_platform_status(self, platform: str) -> dict:
        """Pobierz status publikacji dla danej platformy."""
        return self.platform_statuses.get(platform, {
            "status": "draft",
            "published_at": None,
            "platform_post_id": None
        })

    def set_platform_status(
            self,
            platform: str,
            status: str,
            published_at: datetime = None,
            platform_post_id: str = None
    ):
        """Ustaw status publikacji dla danej platformy."""
        if self.platform_statuses is None:
            self.platform_statuses = {}

        self.platform_statuses[platform] = {
            "status": status,
            "published_at": published_at.isoformat() if published_at else None,
            "platform_post_id": platform_post_id
        }

    def is_fully_published(self) -> bool:
        """Sprawdź czy post został opublikowany na wszystkich platformach."""
        if not self.platforms:
            return False
        return all(
            self.platform_statuses.get(p, {}).get("status") == "published"
            for p in self.platforms
        )

    def get_overall_status(self) -> str:
        """
        Oblicz ogólny status posta na podstawie statusów wszystkich platform.

        Logika:
        - Wszystkie published → published
        - Jakikolwiek failed → failed
        - Jakikolwiek publishing → publishing
        - Jakikolwiek scheduled → scheduled
        - Domyślnie → draft
        """
        if not self.platforms or not self.platform_statuses:
            return self.status or "draft"

        statuses = [
            self.platform_statuses.get(p, {}).get("status", "draft")
            for p in self.platforms
        ]

        if all(s == "published" for s in statuses):
            return "published"
        if any(s == "failed" for s in statuses):
            return "failed"
        if any(s == "publishing" for s in statuses):
            return "publishing"
        if any(s == "scheduled" for s in statuses):
            return "scheduled"
        return "draft"