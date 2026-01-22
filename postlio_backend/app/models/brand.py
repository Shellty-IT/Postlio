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
    primary_color: Mapped[str] = mapped_column(String(7), default="#8B5CF6")
    secondary_color: Mapped[str] = mapped_column(String(7), nullable=True)

    # Informacje o marce
    industry: Mapped[str] = mapped_column(String(100), nullable=True)
    target_audience: Mapped[str] = mapped_column(Text, nullable=True)

    # Voice DNA - przechowywane jako JSON
    voice_dna: Mapped[dict] = mapped_column(JSON, nullable=True, default=dict)

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)

    # Statystyki
    posts_count: Mapped[int] = mapped_column(Integer, default=0)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="brands")
    autopilot_config = relationship("AutopilotConfig", back_populates="brand", uselist=False, cascade="all, delete-orphan")
    autopilot_queue_items = relationship("AutopilotQueueItem", back_populates="brand", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Brand(id={self.id}, name='{self.name}')>"