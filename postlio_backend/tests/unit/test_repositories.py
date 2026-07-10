"""
Unit tests for repository layer.

Tests cover:
- BrandRepository: get_by_id, list, count, clear_default
- PostRepository: get_by_id, list with filters, count, get_drafts
- SocialRepository: get_by_id (raises NotFoundError), find_existing, list
- AutopilotRepository: get_recent_published_items
"""
import pytest
from datetime import datetime, timedelta

from app.repositories.brand_repo import BrandRepository
from app.repositories.post_repo import PostRepository
from app.repositories.social_repo import SocialRepository
from app.repositories.autopilot_repo import AutopilotRepository
from app.models.brand import Brand
from app.models.post import Post
from app.models.social_account import SocialAccount
from app.models.autopilot import AutopilotQueueItem
from app.api.exceptions import NotFoundError


# ==================== BrandRepository ====================

class TestBrandRepository:

    @pytest.fixture
    def repo(self):
        return BrandRepository()

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_by_id_returns_brand(self, repo, db_session, test_brand, test_user):
        result = await repo.get_by_id(db_session, test_user.id, test_brand.id)
        assert result is not None
        assert result.id == test_brand.id

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_by_id_returns_none_for_wrong_user(
            self, repo, db_session, test_brand, another_user
    ):
        result = await repo.get_by_id(db_session, another_user.id, test_brand.id)
        assert result is None

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_list_brands_returns_user_brands(self, repo, db_session, test_brand, test_user):
        brands = await repo.list_brands(db_session, test_user.id)
        assert any(b.id == test_brand.id for b in brands)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_list_brands_does_not_return_other_user_brands(
            self, repo, db_session, test_brand, another_user
    ):
        brands = await repo.list_brands(db_session, another_user.id)
        assert not any(b.id == test_brand.id for b in brands)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_count_brands_returns_correct_number(
            self, repo, db_session, test_brand, test_user
    ):
        count = await repo.count_brands(db_session, test_user.id)
        assert count >= 1

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_count_active_brands(self, repo, db_session, test_brand, test_user):
        count_active = await repo.count_brands(db_session, test_user.id, is_active=True)
        count_inactive = await repo.count_brands(db_session, test_user.id, is_active=False)
        total = await repo.count_brands(db_session, test_user.id)
        assert count_active + count_inactive == total

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_clear_default_removes_default_flag(
            self, repo, db_session, test_brand, test_user
    ):
        test_brand.is_default = True
        await db_session.flush()

        await repo.clear_default(db_session, test_user.id)
        await db_session.flush()

        from sqlalchemy import select, text
        result = await db_session.execute(
            select(Brand).where(Brand.user_id == test_user.id, Brand.is_default == True).execution_options(populate_existing=True)
        )
        assert result.scalars().first() is None

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_latest_returns_most_recently_updated(
            self, repo, db_session, test_brand, test_user
    ):
        latest = await repo.get_latest(db_session, test_user.id)
        assert latest is not None
        assert latest.id == test_brand.id


# ==================== PostRepository ====================

class TestPostRepository:

    @pytest.fixture
    def repo(self):
        return PostRepository()

    @pytest.fixture
    async def test_post(self, db_session, test_user, test_brand):
        post = Post(
            user_id=test_user.id,
            brand_id=test_brand.id,
            content="Test post content",
            platform="facebook",
            status="draft",
        )
        db_session.add(post)
        await db_session.flush()
        await db_session.refresh(post)
        return post

    @pytest.fixture
    async def scheduled_post(self, db_session, test_user, test_brand):
        post = Post(
            user_id=test_user.id,
            brand_id=test_brand.id,
            content="Scheduled post",
            platform="instagram",
            status="scheduled",
            scheduled_at=datetime.utcnow() + timedelta(hours=2),
        )
        db_session.add(post)
        await db_session.flush()
        await db_session.refresh(post)
        return post

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_by_id_returns_post(self, repo, db_session, test_post, test_user):
        result = await repo.get_by_id(db_session, test_user.id, test_post.id)
        assert result is not None
        assert result.id == test_post.id

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_by_id_returns_none_for_wrong_user(
            self, repo, db_session, test_post, another_user
    ):
        result = await repo.get_by_id(db_session, another_user.id, test_post.id)
        assert result is None

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_list_posts_returns_user_posts(
            self, repo, db_session, test_post, test_user
    ):
        posts = await repo.list_posts(db_session, test_user.id)
        assert any(p.id == test_post.id for p in posts)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_list_posts_filters_by_status(
            self, repo, db_session, test_post, scheduled_post, test_user
    ):
        drafts = await repo.list_posts(db_session, test_user.id, status="draft")
        statuses = {p.status for p in drafts}
        assert statuses == {"draft"}

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_list_posts_filters_by_brand(
            self, repo, db_session, test_post, test_user, test_brand, another_user
    ):
        posts = await repo.list_posts(db_session, test_user.id, brand_id=test_brand.id)
        assert all(p.brand_id == test_brand.id for p in posts)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_count_posts(self, repo, db_session, test_post, test_user):
        count = await repo.count_posts(db_session, test_user.id)
        assert count >= 1

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_drafts_returns_draft_posts(
            self, repo, db_session, test_post, test_user
    ):
        drafts = await repo.get_drafts(db_session, test_user.id)
        assert any(p.id == test_post.id for p in drafts)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_drafts_excludes_scheduled(
            self, repo, db_session, scheduled_post, test_user
    ):
        drafts = await repo.get_drafts(db_session, test_user.id)
        assert not any(p.id == scheduled_post.id for p in drafts)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_calendar_events_returns_in_range(
            self, repo, db_session, scheduled_post, test_user
    ):
        start = datetime.utcnow()
        end = datetime.utcnow() + timedelta(hours=5)
        events = await repo.get_calendar_events(db_session, test_user.id, start, end)
        assert any(p.id == scheduled_post.id for p in events)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_stats_returns_totals(self, repo, db_session, test_post, test_user):
        stats = await repo.get_stats(db_session, test_user.id)
        assert "total" in stats
        assert "by_status" in stats
        assert stats["total"] >= 1


# ==================== SocialRepository ====================

class TestSocialRepository:

    @pytest.fixture
    def repo(self):
        return SocialRepository()

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_by_id_returns_account(
            self, repo, db_session, facebook_page_account, test_user
    ):
        result = await repo.get_by_id(db_session, test_user.id, facebook_page_account.id)
        assert result.id == facebook_page_account.id

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_by_id_raises_not_found_for_wrong_user(
            self, repo, db_session, facebook_page_account, another_user
    ):
        with pytest.raises(NotFoundError):
            await repo.get_by_id(db_session, another_user.id, facebook_page_account.id)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_find_existing_returns_match(
            self, repo, db_session, facebook_page_account, test_user
    ):
        result = await repo.find_existing(
            db_session,
            test_user.id,
            "facebook",
            facebook_page_account.platform_user_id,
        )
        assert result is not None
        assert result.id == facebook_page_account.id

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_find_existing_returns_none_when_no_match(
            self, repo, db_session, test_user
    ):
        result = await repo.find_existing(
            db_session, test_user.id, "twitter", "nonexistent_123"
        )
        assert result is None

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_list_accounts_returns_user_accounts(
            self, repo, db_session, facebook_page_account, test_user
    ):
        accounts = await repo.list_accounts(db_session, test_user.id)
        assert any(a.id == facebook_page_account.id for a in accounts)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_list_accounts_excludes_other_user_accounts(
            self, repo, db_session, facebook_page_account, another_user
    ):
        accounts = await repo.list_accounts(db_session, another_user.id)
        assert not any(a.id == facebook_page_account.id for a in accounts)


# ==================== AutopilotRepository ====================

class TestAutopilotRepository:

    @pytest.fixture
    def repo(self):
        return AutopilotRepository()

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_recent_published_returns_published_items(
            self, repo, db_session, autopilot_config, test_user, test_brand
    ):
        item = AutopilotQueueItem(
            config_id=autopilot_config.id,
            user_id=test_user.id,
            brand_id=test_brand.id,
            platform="facebook",
            content="Published post",
            status="published",
            scheduled_for=datetime.utcnow() - timedelta(hours=1),
            published_at=datetime.utcnow() - timedelta(minutes=30),
        )
        db_session.add(item)
        await db_session.flush()

        results = await repo.get_recent_published_items(
            db_session, autopilot_config.id, test_user.id
        )

        assert any(r.id == item.id for r in results)
        assert all(r.status == "published" for r in results)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_recent_published_excludes_pending(
            self, repo, db_session, autopilot_config, test_user, test_brand
    ):
        pending = AutopilotQueueItem(
            config_id=autopilot_config.id,
            user_id=test_user.id,
            brand_id=test_brand.id,
            platform="facebook",
            content="Pending post",
            status="pending",
            scheduled_for=datetime.utcnow() + timedelta(hours=1),
        )
        db_session.add(pending)
        await db_session.flush()

        results = await repo.get_recent_published_items(
            db_session, autopilot_config.id, test_user.id
        )

        assert not any(r.id == pending.id for r in results)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_recent_published_respects_limit(
            self, repo, db_session, autopilot_config, test_user, test_brand
    ):
        for i in range(5):
            item = AutopilotQueueItem(
                config_id=autopilot_config.id,
                user_id=test_user.id,
                brand_id=test_brand.id,
                platform="facebook",
                content=f"Published {i}",
                status="published",
                scheduled_for=datetime.utcnow() - timedelta(hours=i + 1),
                published_at=datetime.utcnow() - timedelta(hours=i),
            )
            db_session.add(item)
        await db_session.flush()

        results = await repo.get_recent_published_items(
            db_session, autopilot_config.id, test_user.id, limit=3
        )

        assert len(results) <= 3
