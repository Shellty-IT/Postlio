from datetime import datetime
from enum import Enum
from sqlalchemy import String, Text, Integer, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


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
    brand_id: Mapped[int] = mapped_column(Integer, ForeignKey("brands.id"), nullable=True)

    content: Mapped[str] = mapped_column(Text)
    image_url: Mapped[str] = mapped_column(String(500), nullable=True)
    image_prompt: Mapped[str] = mapped_column(Text, nullable=True)

    platform: Mapped[str] = mapped_column(String(50))
    platform_post_id: Mapped[str] = mapped_column(String(255), nullable=True)

    status: Mapped[str] = mapped_column(String(50), default=PostStatus.DRAFT.value)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    published_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    ai_generated: Mapped[bool] = mapped_column(Boolean, default=False)
    ai_model: Mapped[str] = mapped_column(String(50), nullable=True)
    generation_params: Mapped[dict] = mapped_column(JSON, nullable=True)

    likes: Mapped[int] = mapped_column(Integer, default=0)
    comments: Mapped[int] = mapped_column(Integer, default=0)
    shares: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)