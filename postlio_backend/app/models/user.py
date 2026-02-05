# app/models/user.py
"""
Model użytkownika.
"""
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Avatar
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # OAuth login
    oauth_provider: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # "facebook", "google"
    oauth_provider_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)

    # Trial & Onboarding
    trial_ends_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True,
        default=lambda: datetime.utcnow() + timedelta(days=14)
    )
    onboarding_completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True,
        default=None
    )
    onboarding_skipped: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    brands = relationship("Brand", back_populates="user", cascade="all, delete-orphan")
    autopilot_configs = relationship("AutopilotConfig", back_populates="user", cascade="all, delete-orphan")
    autopilot_queue_items = relationship("AutopilotQueueItem", back_populates="user", cascade="all, delete-orphan")

    @property
    def is_trial_active(self) -> bool:
        """Sprawdza czy trial jest aktywny."""
        if self.trial_ends_at is None:
            return False
        return datetime.utcnow() < self.trial_ends_at

    @property
    def trial_days_remaining(self) -> int:
        """Zwraca liczbę pozostałych dni triala."""
        if self.trial_ends_at is None:
            return 0
        remaining = (self.trial_ends_at - datetime.utcnow()).days
        return max(0, remaining)

    @property
    def needs_onboarding(self) -> bool:
        """Sprawdza czy użytkownik musi przejść onboarding."""
        return self.onboarding_completed_at is None and not self.onboarding_skipped

    @property
    def has_password(self) -> bool:
        """Sprawdza czy użytkownik ma ustawione hasło (nie jest OAuth-only)."""
        return bool(self.hashed_password)

    @property
    def is_oauth_user(self) -> bool:
        """Sprawdza czy użytkownik zalogował się przez OAuth."""
        return bool(self.oauth_provider)

    def complete_onboarding(self) -> None:
        """Oznacza onboarding jako ukończony."""
        self.onboarding_completed_at = datetime.utcnow()
        self.onboarding_skipped = False

    def skip_onboarding(self) -> None:
        """Oznacza że użytkownik pominął onboarding (tryb demo)."""
        self.onboarding_skipped = True
        self.onboarding_completed_at = None

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}')>"