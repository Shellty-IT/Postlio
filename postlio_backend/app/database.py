# postlio_backend/app/database.py
"""
Konfiguracja bazy danych - PostgreSQL (Neon) z asyncpg.
Obsługa trybu testowego z SQLite in-memory.
"""
import os
import ssl
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

# ============================================================
# TESTING MODE DETECTION
# ============================================================

TESTING = os.environ.get("TESTING", "false").lower() == "true"


# ============================================================
# ENGINE CONFIGURATION
# ============================================================

def _create_production_engine():
    """Create PostgreSQL engine for production."""

    def get_engine_url():
        """Przygotuj URL dla asyncpg (usuń sslmode jeśli istnieje)."""
        url = settings.DATABASE_URL
        if "sslmode=" in url:
            url = url.split("?")[0]
        return url

    def get_connect_args():
        """Przygotuj argumenty połączenia dla asyncpg."""
        if "neon.tech" in settings.DATABASE_URL or "sslmode" in settings.DATABASE_URL:
            return {"ssl": ssl.create_default_context()}
        return {}

    return create_async_engine(
        get_engine_url(),
        echo=settings.DEBUG,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        connect_args=get_connect_args(),
    )


def _create_test_engine():
    """Create SQLite in-memory engine for testing."""
    from sqlalchemy.pool import StaticPool

    return create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False,
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
    )


# ============================================================
# ENGINE & SESSION MAKER (wybór na podstawie TESTING)
# ============================================================

if TESTING:
    engine = _create_test_engine()
else:
    engine = _create_production_engine()

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


# ============================================================
# BASE CLASS
# ============================================================

class Base(DeclarativeBase):
    """Bazowa klasa dla modeli SQLAlchemy."""
    pass


# ============================================================
# DEPENDENCY
# ============================================================

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency do uzyskiwania sesji bazy danych."""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ============================================================
# LIFECYCLE FUNCTIONS
# ============================================================

async def init_db():
    """Inicjalizacja bazy danych dla trybu testowego i lokalnego developmentu."""
    if not (TESTING or settings.DEBUG):
        return

    async with engine.begin() as conn:
        from app.models import user, brand, post, social_account, autopilot, refresh_token  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """Zamknięcie połączeń z bazą danych."""
    await engine.dispose()


# ============================================================
# TEST HELPERS (tylko dla testów)
# ============================================================

async def reset_test_db():
    """Reset test database - drop and recreate all tables."""
    if not TESTING:
        raise RuntimeError("reset_test_db can only be called in TESTING mode!")

    from app.models import user, brand, post, social_account, autopilot, refresh_token  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
