# tests/conftest.py
"""
Pytest configuration and shared fixtures.
Works for both unit and integration tests.
"""
import asyncio
import sys
from datetime import datetime, timedelta
from typing import AsyncGenerator, Generator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from sqlalchemy.dialects.sqlite.base import SQLiteTypeCompiler
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool  # ✅ ZMIANA: StaticPool zamiast NullPool

from app.database import Base
from app.models.user import User
from app.models.brand import Brand
from app.models.social_account import SocialAccount
from app.models.autopilot import AutopilotConfig, AutopilotQueueItem

SQLiteTypeCompiler.visit_JSONB = SQLiteTypeCompiler.visit_JSON


# ============================================================
# EVENT LOOP - Function-scoped for Windows compatibility
# ============================================================

@pytest.fixture(scope="function")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create event loop for each test function."""
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
# DATABASE FIXTURES - SQLite in-memory with StaticPool
# ============================================================

@pytest_asyncio.fixture(scope="function")
async def async_engine():
    """Create SQLite engine for tests with SHARED connection."""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False,
        poolclass=StaticPool,  # ✅ KLUCZOWA ZMIANA!
        connect_args={"check_same_thread": False},
    )

    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    # Cleanup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def db_session(async_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create database session."""
    session_maker = async_sessionmaker(
        async_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

    async with session_maker() as session:
        yield session
        await session.rollback()


# ============================================================
# USER FIXTURES
# ============================================================

@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create test user."""
    user = User(
        email="test@example.com",
        hashed_password="$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYr9gJz5tXXe",
        full_name="Test User",
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def another_user(db_session: AsyncSession) -> User:
    """Create another user."""
    user = User(
        email="another@example.com",
        hashed_password="$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYr9gJz5tXXe",
        full_name="Another User",
        is_active=True,
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
async def test_brand(db_session: AsyncSession, test_user: User) -> Brand:
    """Create test brand."""
    brand = Brand(
        user_id=test_user.id,
        name="Test Brand",
        description="A test brand",
        industry="technology",
        target_audience="developers",
        voice_dna={
            "formality": 60,
            "energy": 70,
            "humor": 40,
            "emotion": 50,
            "personality_traits": ["innovative", "helpful"],
        },
        primary_color="#2563EB",
        is_active=True,
    )
    db_session.add(brand)
    await db_session.commit()
    await db_session.refresh(brand)
    return brand


@pytest_asyncio.fixture
async def brand_without_voice_dna(db_session: AsyncSession, test_user: User) -> Brand:
    """Create brand without Voice DNA."""
    brand = Brand(
        user_id=test_user.id,
        name="Simple Brand",
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
async def facebook_page_account(db_session: AsyncSession, test_user: User) -> SocialAccount:
    """Create Facebook Page account."""
    account = SocialAccount(
        user_id=test_user.id,
        platform="facebook",
        account_type="facebook_page",
        platform_user_id="123456789",
        platform_username="testpage",
        page_id="987654321",
        page_name="Test Facebook Page",
        access_token="encrypted_token_fb",
        page_access_token="encrypted_page_token",
        token_expires_at=datetime.utcnow() + timedelta(days=60),
        is_active=True,
    )
    db_session.add(account)
    await db_session.commit()
    await db_session.refresh(account)
    return account


@pytest_asyncio.fixture
async def instagram_business_account(db_session: AsyncSession, test_user: User) -> SocialAccount:
    """Create Instagram Business account."""
    account = SocialAccount(
        user_id=test_user.id,
        platform="instagram",
        account_type="instagram_business",
        platform_user_id="ig_123456789",
        platform_username="testbusiness",
        instagram_account_id="17841400000000000",
        access_token="encrypted_token_ig",
        token_expires_at=datetime.utcnow() + timedelta(days=60),
        is_active=True,
    )
    db_session.add(account)
    await db_session.commit()
    await db_session.refresh(account)
    return account


@pytest_asyncio.fixture
async def instagram_personal_account(db_session: AsyncSession, test_user: User) -> SocialAccount:
    """Create personal Instagram account (no API access)."""
    account = SocialAccount(
        user_id=test_user.id,
        platform="instagram",
        account_type="instagram_personal",
        platform_user_id="ig_personal_123",
        platform_username="personalgram",
        access_token="no_api_access",
        is_active=True,
    )
    db_session.add(account)
    await db_session.commit()
    await db_session.refresh(account)
    return account


@pytest_asyncio.fixture
async def linkedin_profile_account(db_session: AsyncSession, test_user: User) -> SocialAccount:
    """Create LinkedIn Profile account."""
    account = SocialAccount(
        user_id=test_user.id,
        platform="linkedin",
        account_type="linkedin_profile",
        platform_user_id="li_123456789",
        platform_username="testprofile",
        access_token="encrypted_token_li",
        token_expires_at=datetime.utcnow() + timedelta(days=60),
        is_active=True,
    )
    db_session.add(account)
    await db_session.commit()
    await db_session.refresh(account)
    return account


@pytest_asyncio.fixture
async def expired_token_account(db_session: AsyncSession, test_user: User) -> SocialAccount:
    """Create account with expired token."""
    account = SocialAccount(
        user_id=test_user.id,
        platform="facebook",
        account_type="facebook_page",
        platform_user_id="expired_123",
        platform_username="expiredpage",
        page_id="expired_page_id",
        access_token="expired_token",
        token_expires_at=datetime.utcnow() - timedelta(days=1),
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
async def autopilot_config(
        db_session: AsyncSession,
        test_user: User,
        test_brand: Brand,
        facebook_page_account: SocialAccount,
) -> AutopilotConfig:
    """Create autopilot config."""
    config = AutopilotConfig(
        user_id=test_user.id,
        brand_id=test_brand.id,
        posts_per_week=5,
        schedule_days=["monday", "wednesday", "friday"],
        schedule_time="10:00",
        timezone="Europe/Warsaw",
        platforms=["facebook", "instagram"],
        categories=["technology", "business"],
        creativity_level=60,
        post_length="medium",
        include_images=True,
        include_hashtags=True,
        include_emoji=True,
        text_provider="gemini",
        image_provider="pollinations",
        is_active=True,
        social_account_mapping={"facebook": facebook_page_account.id},
    )
    db_session.add(config)
    await db_session.commit()
    await db_session.refresh(config)
    return config


@pytest_asyncio.fixture
async def queue_item_pending(
        db_session: AsyncSession,
        test_user: User,
        test_brand: Brand,
        autopilot_config: AutopilotConfig,
) -> AutopilotQueueItem:
    """Create pending queue item."""
    item = AutopilotQueueItem(
        config_id=autopilot_config.id,
        user_id=test_user.id,
        brand_id=test_brand.id,
        platform="facebook",
        content="Test post content",
        hashtags=["test", "postlio"],
        category="technology",
        status="pending",
        scheduled_for=datetime.utcnow() + timedelta(hours=2),
        topic_used="test topic",
        text_provider_used="gemini",
    )
    db_session.add(item)
    await db_session.commit()
    await db_session.refresh(item)
    return item


@pytest_asyncio.fixture
async def queue_item_approved(
        db_session: AsyncSession,
        test_user: User,
        test_brand: Brand,
        autopilot_config: AutopilotConfig,
        facebook_page_account: SocialAccount,
) -> AutopilotQueueItem:
    """Create approved queue item."""
    item = AutopilotQueueItem(
        config_id=autopilot_config.id,
        user_id=test_user.id,
        brand_id=test_brand.id,
        platform="facebook",
        content="Approved post!",
        hashtags=["approved"],
        status="approved",
        scheduled_for=datetime.utcnow() - timedelta(minutes=5),
        topic_used="business topic",
        text_provider_used="gemini",
        social_account_id=facebook_page_account.id,
    )
    db_session.add(item)
    await db_session.commit()
    await db_session.refresh(item)
    return item

@pytest_asyncio.fixture
async def queue_item_with_image(
    db_session: AsyncSession,
    test_user: User,
    test_brand: Brand,
    autopilot_config: AutopilotConfig,
    facebook_page_account: SocialAccount,
) -> AutopilotQueueItem:
    """Create queue item with image."""
    item = AutopilotQueueItem(
        config_id=autopilot_config.id,
        user_id=test_user.id,
        brand_id=test_brand.id,
        platform="instagram",
        content="Post with image!",
        image_url="https://example.com/image.jpg",  # ✅ Z obrazem
        hashtags=["photo", "instagram"],
        status="approved",
        scheduled_for=datetime.utcnow() - timedelta(minutes=5),
        topic_used="lifestyle topic",
        text_provider_used="gemini",
        image_provider_used="pollinations",
        social_account_id=facebook_page_account.id,
    )
    db_session.add(item)
    await db_session.commit()
    await db_session.refresh(item)
    return item

# ============================================================
# MOCK FIXTURES
# ============================================================

@pytest.fixture
def mock_social_manager():
    """Mock social manager."""
    with patch("app.services.publishers.business.social_manager") as mock:
        mock.publish_post = AsyncMock()
        yield mock


@pytest.fixture
def mock_text_ai_manager():
    """Mock text AI manager."""
    with patch("app.services.generation_service.text_ai_manager") as mock:
        provider = MagicMock()
        provider.generate_post = AsyncMock(return_value={
            "success": True,
            "content": "Generated content",
            "hashtags": ["generated"],
        })
        mock.get_provider.return_value = provider
        yield mock


@pytest.fixture
def mock_image_ai_manager():
    """Mock image AI manager."""
    with patch("app.services.generation_service.image_ai_manager") as mock:
        mock.generate_image = AsyncMock(return_value={
            "success": True,
            "image_url": "https://test.com/image.jpg",
            "provider": "pollinations",
        })
        yield mock


# ============================================================
# HELPER FIXTURES
# ============================================================

@pytest.fixture
def sample_publish_result():
    """Sample successful publish result."""
    from app.services.social.base import PublishResult, SocialPlatform
    return PublishResult(
        success=True,
        platform=SocialPlatform.FACEBOOK,
        post_id="post_123456",
        post_url="https://facebook.com/post/123456",
    )


@pytest.fixture
def sample_failed_publish_result():
    """Sample failed publish result."""
    from app.services.social.base import PublishResult, SocialPlatform
    return PublishResult(
        success=False,
        platform=SocialPlatform.FACEBOOK,
        error="API Error: Invalid token",
    )