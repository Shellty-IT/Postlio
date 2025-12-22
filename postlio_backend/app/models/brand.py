from datetime import datetime
from sqlalchemy import String, Text, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Brand(Base):
    __tablename__ = "brands"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))

    name: Mapped[str] = mapped_column(String(255))
    industry: Mapped[str] = mapped_column(String(100), nullable=True)

    tone: Mapped[str] = mapped_column(String(50), nullable=True)
    values: Mapped[dict] = mapped_column(JSON, nullable=True)
    target_audience: Mapped[str] = mapped_column(Text, nullable=True)
    keywords: Mapped[list] = mapped_column(JSON, nullable=True)
    avoid_words: Mapped[list] = mapped_column(JSON, nullable=True)
    example_posts: Mapped[list] = mapped_column(JSON, nullable=True)
    voice_profile: Mapped[dict] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)