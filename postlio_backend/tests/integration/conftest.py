# tests/integration/conftest.py
"""
Integration test fixtures with COMPLETE database isolation.
TESTING=true is set by pytest-env in pytest.ini
"""
import asyncio
import sys
import pytest
import pytest_asyncio
from datetime import datetime, timedelta
from typing import AsyncGenerator, Dict
from unittest.mock import patch, AsyncMock, MagicMock

from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession


# ============================================================
# EVENT LOOP - Windows compatible, fresh per test
# ============================================================

@pytest.fixture(scope="function")
def event_loop():
    """Create fresh event loop for each test function."""
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    yield loop

    # Cleanup pending tasks
    try:
        pending = asyncio.all_tasks(loop)
        for task in pending:
            task.cancel()
        if pending:
            loop.run_until_complete(asyncio.gather(*pending, return_exceptions=True))
    except Exception:
        pass
    finally:
        loop.close()


# ============================================================
# DATABASE SETUP - Fresh tables for each test
# ============================================================

@pytest_asyncio.fixture(scope="function")
async def setup_test_db():
    """
    Setup fresh database for each test.
    Uses SQLite in-memory (configured via TESTING=true in pytest.ini).
    """
    from app.database import engine, Base
    from app.models import user, brand, post, social_account, autopilot  # noqa: F401

    # Create all tables fresh
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    yield

    # Cleanup - tables will be dropped, but engine stays alive for next test


@pytest_asyncio.fixture(scope="function")
async def db_session(setup_test_db) -> AsyncGenerator[AsyncSession, None]:
    """Get database session for direct database operations in tests."""
    from app.database import async_session_maker

    async with async_session_maker() as session:
        yield session
        await session.rollback()


# ============================================================
# API CLIENT
# ============================================================

@pytest_asyncio.fixture(scope="function")
async def client(setup_test_db) -> AsyncGenerator[AsyncClient, None]:
    """
    Create test client.
    Database is already set to SQLite via TESTING env var.
    """
    from app.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# ============================================================
# USER FIXTURES
# ============================================================

@pytest_asyncio.fixture
async def integration_user(db_session: AsyncSession):
    """Create test user in test database."""
    from app.models.user import User
    from app.utils.security import get_password_hash

    user = User(
        email="integration@test.com",
        hashed_password=get_password_hash("TestPassword123!"),
        full_name="Integration Test User",
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def auth_headers(integration_user) -> Dict[str, str]:
    """Create auth headers for integration_user."""
    from app.utils.security import create_access_token

    token = create_access_token(data={"sub": str(integration_user.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def another_integration_user(db_session: AsyncSession):
    """Create another user."""
    from app.models.user import User
    from app.utils.security import get_password_hash

    user = User(
        email="another@test.com",
        hashed_password=get_password_hash("AnotherPass123!"),
        full_name="Another User",
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def another_auth_headers(another_integration_user) -> Dict[str, str]:
    """Auth headers for another user."""
    from app.utils.security import create_access_token

    token = create_access_token(data={"sub": str(another_integration_user.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def inactive_user(db_session: AsyncSession):
    """Create inactive user."""
    from app.models.user import User
    from app.utils.security import get_password_hash

    user = User(
        email="inactive@test.com",
        hashed_password=get_password_hash("InactivePass123!"),
        full_name="Inactive User",
        is_active=False,
        is_verified=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


# ============================================================
# BRAND FIXTURES
# ============================================================

@pytest_asyncio.fixture
async def integration_brand(db_session: AsyncSession, integration_user):
    """Create test brand."""
    from app.models.brand import Brand

    brand = Brand(
        user_id=integration_user.id,
        name="Integration Test Brand",
        description="A brand for integration testing",
        industry="technology",
        voice_dna={
            "formality": 50,
            "energy": 60,
            "humor": 30,
            "personality_traits": ["professional", "innovative"],
        },
        is_active=True,
    )
    db_session.add(brand)
    await db_session.commit()
    await db_session.refresh(brand)
    return brand


# ============================================================
# SOCIAL ACCOUNT FIXTURES
# ============================================================

@pytest_asyncio.fixture
async def integration_facebook_account(db_session: AsyncSession, integration_user):
    """Create Facebook Page account."""
    from app.models.social_account import SocialAccount

    account = SocialAccount(
        user_id=integration_user.id,
        platform="facebook",
        account_type="facebook_page",
        platform_user_id="int_fb_123",
        platform_username="integrationpage",
        page_id="int_page_123",
        page_name="Integration Test Page",
        access_token="int_encrypted_token",
        page_access_token="int_encrypted_page_token",
        token_expires_at=datetime.utcnow() + timedelta(days=60),
        is_active=True,
    )
    db_session.add(account)
    await db_session.commit()
    await db_session.refresh(account)
    return account


# ============================================================
# AUTOPILOT FIXTURES
# ============================================================

@pytest_asyncio.fixture
async def integration_autopilot_config(
        db_session: AsyncSession,
        integration_user,
        integration_brand,
        integration_facebook_account,
):
    """Create autopilot config."""
    from app.models.autopilot import AutopilotConfig

    config = AutopilotConfig(
        user_id=integration_user.id,
        brand_id=integration_brand.id,
        posts_per_week=3,
        schedule_days=["monday", "wednesday", "friday"],
        schedule_time="09:00",
        timezone="Europe/Warsaw",
        platforms=["facebook"],
        categories=["technology", "business"],
        creativity_level=50,
        post_length="medium",
        include_images=True,
        include_hashtags=True,
        text_provider="gemini",
        image_provider="pollinations",
        is_active=True,
        social_account_mapping={"facebook": integration_facebook_account.id},
    )
    db_session.add(config)
    await db_session.commit()
    await db_session.refresh(config)
    return config


@pytest_asyncio.fixture
async def integration_queue_items(
        db_session: AsyncSession,
        integration_user,
        integration_brand,
        integration_autopilot_config,
):
    """Create queue items with various statuses."""
    from app.models.autopilot import AutopilotQueueItem

    items = []
    statuses = ["pending", "pending", "approved", "published", "rejected"]

    for i, status in enumerate(statuses):
        item = AutopilotQueueItem(
            config_id=integration_autopilot_config.id,
            user_id=integration_user.id,
            brand_id=integration_brand.id,
            platform="facebook",
            content=f"Integration test content {i}",
            hashtags=["test", "integration"],
            status=status,
            scheduled_for=datetime.utcnow() + timedelta(hours=i),
            topic_used=f"topic_{i}",
            text_provider_used="gemini",
            published_at=datetime.utcnow() if status == "published" else None,
        )
        db_session.add(item)
        items.append(item)

    await db_session.commit()
    for item in items:
        await db_session.refresh(item)

    return items


# ============================================================
# MOCK FIXTURES
# ============================================================

@pytest.fixture
def mock_ai_providers():
    """Mock AI providers."""
    with patch("app.services.ai.text.manager.text_ai_manager") as text_mock, \
            patch("app.services.ai.image.manager.image_ai_manager") as image_mock:
        text_provider = MagicMock()
        text_provider.generate_post = AsyncMock(return_value={
            "success": True,
            "content": "Generated content for test",
            "hashtags": ["test", "generated"],
        })
        text_mock.get_provider.return_value = text_provider

        image_mock.generate_image = AsyncMock(return_value={
            "success": True,
            "image_url": "https://test.com/image.jpg",
            "provider": "pollinations",
        })

        yield {"text": text_mock, "image": image_mock}


@pytest.fixture
def mock_social_manager():
    """Mock social manager."""
    with patch("app.services.publish_service.social_manager") as mock:
        result = MagicMock()
        result.success = True
        result.post_id = "int_post_123"
        result.post_url = "https://facebook.com/int_post_123"
        result.error = None

        mock.publish_post = AsyncMock(return_value=result)
        yield mock