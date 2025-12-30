# postlio_backend/app/models/brand.py
"""
Model Brand z pełnym wsparciem dla Voice DNA.
"""
from datetime import datetime
from sqlalchemy import String, Text, Integer, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Brand(Base):
    __tablename__ = "brands"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))

    # Podstawowe informacje
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, nullable=True)
    logo_url: Mapped[str] = mapped_column(String(500), nullable=True)

    # Kolory
    primary_color: Mapped[str] = mapped_column(String(7), default="#8B5CF6")  # hex
    secondary_color: Mapped[str] = mapped_column(String(7), nullable=True)

    # Informacje o marce
    industry: Mapped[str] = mapped_column(String(100), nullable=True)
    target_audience: Mapped[str] = mapped_column(Text, nullable=True)

    # Voice DNA - przechowywane jako JSON
    # Struktura:
    # {
    #   "tone_formality": 50,
    #   "tone_energy": 50,
    #   "tone_humor": 30,
    #   "tone_emotion": 50,
    #   "personality_traits": ["professional", "friendly"],
    #   "communication_style": "informative",
    #   "keywords": [],
    #   "hashtags": [],
    #   "forbidden_words": [],
    #   "sample_posts": [],
    #   "emoji_usage": "moderate",
    #   "preferred_emojis": []
    # }
    voice_dna: Mapped[dict] = mapped_column(JSON, nullable=True, default=dict)

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)

    # Statystyki
    posts_count: Mapped[int] = mapped_column(Integer, default=0)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="brands")

    def __repr__(self) -> str:
        return f"<Brand(id={self.id}, name='{self.name}')>"