# app/models/refresh_token.py
"""
Model śledzenia refresh tokenów - umożliwia rotację i unieważnianie sesji.

Sam refresh token pozostaje bezstanowym JWT (weryfikowanym podpisem), ale
jego "jti" (unikalny identyfikator) jest tu rejestrowany, żeby dało się:
- unieważnić konkretną sesję (logout) lub całą rodzinę (wykryty reuse),
- odrzucić token, którego jti nie ma w bazie lub jest już oznaczony jako revoked.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    jti: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    revoked_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    @property
    def is_valid(self) -> bool:
        return self.revoked_at is None and self.expires_at > datetime.utcnow()

    def __repr__(self) -> str:
        return f"<RefreshToken(id={self.id}, user_id={self.user_id}, revoked={self.revoked_at is not None})>"
