from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class SocialAccount(Base):
    __tablename__ = "social_accounts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))

    platform: Mapped[str] = mapped_column(String(50))
    platform_user_id: Mapped[str] = mapped_column(String(255))
    platform_username: Mapped[str] = mapped_column(String(255), nullable=True)

    access_token: Mapped[str] = mapped_column(String(1000))
    refresh_token: Mapped[str] = mapped_column(String(1000), nullable=True)
    token_expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    profile_data: Mapped[dict] = mapped_column(JSON, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)