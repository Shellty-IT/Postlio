# postlio_backend/alembic/env.py
"""
Alembic environment configuration for async SQLAlchemy with PostgreSQL (Neon).
"""
import asyncio
import os
from logging.config import fileConfig
from urllib.parse import urlparse, urlunparse

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import create_async_engine

from alembic import context

# Załaduj zmienne środowiskowe z .env
from dotenv import load_dotenv

load_dotenv()

# Import your models and Base
from app.database import Base
from app.models.user import User
from app.models.brand import Brand
from app.models.post import Post
from app.models.social_account import SocialAccount
from app.models.autopilot import AutopilotConfig, AutopilotQueueItem

# this is the Alembic Config object
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Model's MetaData object for 'autogenerate' support
target_metadata = Base.metadata

# Pobierz DATABASE_URL z .env
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("❌ DATABASE_URL nie jest ustawiony w .env!")


def clean_database_url(url: str) -> str:
    """
    Usuwa wszystkie query parameters z URL.
    asyncpg nie obsługuje sslmode, channel_binding itp. w URL.
    """
    parsed = urlparse(url)
    # Tworzymy nowy URL bez query string
    clean_url = urlunparse((
        parsed.scheme,
        parsed.netloc,
        parsed.path,
        '',  # params
        '',  # query - USUWAMY!
        ''  # fragment
    ))
    return clean_url


# Oczyszczony URL (bez ?sslmode=require&channel_binding=require)
CLEAN_DATABASE_URL = clean_database_url(DATABASE_URL)

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    context.configure(
        url=CLEAN_DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in 'online' mode with async engine."""
    connect_args = {}
    if "neon.tech" in DATABASE_URL or "sslmode=" in DATABASE_URL:
        import ssl

        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        connect_args = {"ssl": ssl_context}

    connectable = create_async_engine(
        CLEAN_DATABASE_URL,
        poolclass=pool.NullPool,
        connect_args=connect_args,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
