"""
Unit tests for the weekly R2 orphaned-images cleanup.

Tests cover:
- Extracting R2 keys from public URLs (and rejecting non-R2 URLs)
- Images referenced by a Post or AutopilotQueueItem are never deleted
- Only orphaned images older than the minimum age are deleted
- Behavior when R2 is not configured
"""
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

import pytest

from app.models.post import Post
from app.services.storage.cleanup_service import _extract_r2_key, cleanup_orphaned_images


R2_PUBLIC_URL = "https://pub-test.r2.dev"


@pytest.fixture
def configured_settings(monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "R2_ACCOUNT_ID", "acc123")
    monkeypatch.setattr(settings, "R2_ACCESS_KEY_ID", "key123")
    monkeypatch.setattr(settings, "R2_SECRET_ACCESS_KEY", "secret123")
    monkeypatch.setattr(settings, "R2_BUCKET_NAME", "postlio-media")
    monkeypatch.setattr(settings, "R2_ENDPOINT_URL", "https://acc123.r2.cloudflarestorage.com")
    monkeypatch.setattr(settings, "R2_PUBLIC_URL", R2_PUBLIC_URL)
    return settings


def _old(hours=48):
    return datetime.now(timezone.utc) - timedelta(hours=hours)


def _recent(hours=1):
    return datetime.now(timezone.utc) - timedelta(hours=hours)


class TestExtractR2Key:
    @pytest.mark.unit
    def test_extracts_key_from_r2_url(self, configured_settings):
        url = f"{R2_PUBLIC_URL}/posts/abc123.jpg"
        assert _extract_r2_key(url) == "posts/abc123.jpg"

    @pytest.mark.unit
    def test_returns_none_for_none(self, configured_settings):
        assert _extract_r2_key(None) is None

    @pytest.mark.unit
    def test_returns_none_for_empty_string(self, configured_settings):
        assert _extract_r2_key("") is None

    @pytest.mark.unit
    def test_returns_none_for_legacy_pollinations_url(self, configured_settings):
        url = "https://gen.pollinations.ai/image/a%20cat?model=flux"
        assert _extract_r2_key(url) is None

    @pytest.mark.unit
    def test_returns_none_for_base64_data_uri(self, configured_settings):
        assert _extract_r2_key("data:image/png;base64,iVBORw0KGgo=") is None

    @pytest.mark.unit
    def test_returns_none_when_r2_not_configured(self, monkeypatch):
        from app.config import settings
        monkeypatch.setattr(settings, "R2_PUBLIC_URL", None)
        assert _extract_r2_key(f"{R2_PUBLIC_URL}/posts/abc.jpg") is None

    @pytest.mark.unit
    def test_returns_none_for_different_host(self, configured_settings):
        assert _extract_r2_key("https://evil.example.com/posts/abc.jpg") is None


class TestCleanupOrphanedImages:
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_skips_when_r2_not_configured(self, db_session):
        with patch("app.services.storage.cleanup_service.r2_storage") as mock_r2:
            mock_r2.is_available = False

            result = await cleanup_orphaned_images(db_session)

        assert result == {"skipped": True}

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_deletes_orphaned_old_images(self, db_session, configured_settings):
        with patch("app.services.storage.cleanup_service.r2_storage") as mock_r2:
            mock_r2.is_available = True
            mock_r2.list_all_objects = AsyncMock(return_value=[
                {"key": "posts/orphan.jpg", "size": 100, "last_modified": _old()},
            ])
            mock_r2.delete_objects = AsyncMock(return_value=1)

            result = await cleanup_orphaned_images(db_session)

        mock_r2.delete_objects.assert_called_once_with(["posts/orphan.jpg"])
        assert result == {
            "bucket_objects": 1,
            "referenced": 0,
            "orphaned": 1,
            "deleted": 1,
        }

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_never_deletes_image_referenced_by_post(
        self, db_session, configured_settings, test_user
    ):
        post = Post(
            user_id=test_user.id,
            content="Has an image",
            image_url=f"{R2_PUBLIC_URL}/posts/kept.jpg",
            platforms=["facebook"],
        )
        db_session.add(post)
        await db_session.commit()

        with patch("app.services.storage.cleanup_service.r2_storage") as mock_r2:
            mock_r2.is_available = True
            mock_r2.list_all_objects = AsyncMock(return_value=[
                {"key": "posts/kept.jpg", "size": 100, "last_modified": _old()},
            ])
            mock_r2.delete_objects = AsyncMock(return_value=0)

            result = await cleanup_orphaned_images(db_session)

        mock_r2.delete_objects.assert_called_once_with([])
        assert result["referenced"] == 1
        assert result["orphaned"] == 0

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_never_deletes_image_referenced_by_queue_item(
        self, db_session, configured_settings, queue_item_with_image
    ):
        from app.config import settings
        queue_item_with_image.image_url = f"{settings.R2_PUBLIC_URL}/posts/queued.jpg"
        await db_session.commit()

        with patch("app.services.storage.cleanup_service.r2_storage") as mock_r2:
            mock_r2.is_available = True
            mock_r2.list_all_objects = AsyncMock(return_value=[
                {"key": "posts/queued.jpg", "size": 100, "last_modified": _old()},
            ])
            mock_r2.delete_objects = AsyncMock(return_value=0)

            result = await cleanup_orphaned_images(db_session)

        mock_r2.delete_objects.assert_called_once_with([])
        assert result["orphaned"] == 0

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_does_not_delete_recently_uploaded_orphan(self, db_session, configured_settings):
        """An image generated moments ago in an open Kreator AI session must
        survive cleanup even though no Post references it yet."""
        with patch("app.services.storage.cleanup_service.r2_storage") as mock_r2:
            mock_r2.is_available = True
            mock_r2.list_all_objects = AsyncMock(return_value=[
                {"key": "posts/fresh.jpg", "size": 100, "last_modified": _recent()},
            ])
            mock_r2.delete_objects = AsyncMock(return_value=0)

            result = await cleanup_orphaned_images(db_session)

        mock_r2.delete_objects.assert_called_once_with([])
        assert result["orphaned"] == 0

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_mixed_referenced_orphaned_and_recent(
        self, db_session, configured_settings, test_user
    ):
        post = Post(
            user_id=test_user.id,
            content="Kept",
            image_url=f"{R2_PUBLIC_URL}/posts/kept.jpg",
            platforms=["facebook"],
        )
        db_session.add(post)
        await db_session.commit()

        with patch("app.services.storage.cleanup_service.r2_storage") as mock_r2:
            mock_r2.is_available = True
            mock_r2.list_all_objects = AsyncMock(return_value=[
                {"key": "posts/kept.jpg", "size": 100, "last_modified": _old()},
                {"key": "posts/orphan_old.jpg", "size": 100, "last_modified": _old()},
                {"key": "posts/orphan_fresh.jpg", "size": 100, "last_modified": _recent()},
            ])
            mock_r2.delete_objects = AsyncMock(return_value=1)

            result = await cleanup_orphaned_images(db_session)

        mock_r2.delete_objects.assert_called_once_with(["posts/orphan_old.jpg"])
        assert result["bucket_objects"] == 3
        assert result["referenced"] == 1
        assert result["orphaned"] == 1

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_ignores_legacy_non_r2_urls_when_building_referenced_set(
        self, db_session, configured_settings, test_user
    ):
        """Posts saved before the R2 migration still have Pollinations URLs -
        cleanup must not crash on them nor treat them as referencing an R2 key."""
        post = Post(
            user_id=test_user.id,
            content="Legacy image",
            image_url="https://gen.pollinations.ai/image/cat?model=flux",
            platforms=["facebook"],
        )
        db_session.add(post)
        await db_session.commit()

        with patch("app.services.storage.cleanup_service.r2_storage") as mock_r2:
            mock_r2.is_available = True
            mock_r2.list_all_objects = AsyncMock(return_value=[])
            mock_r2.delete_objects = AsyncMock(return_value=0)

            result = await cleanup_orphaned_images(db_session)

        assert result["referenced"] == 0
