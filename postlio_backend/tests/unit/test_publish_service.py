"""
Unit tests for PublishService.

Tests cover:
- Account type validation (auto-publish vs manual)
- Social account validation for configs
- Publishing flow logic
- Error handling
- Manual publish preparation
"""
import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.publish_service import PublishService, PublishResult
from app.models.social_account import SocialAccount
from app.models.autopilot import AutopilotConfig, AutopilotQueueItem


class TestCanAutoPublish:
    """Tests for can_auto_publish method."""

    @pytest.fixture
    def publish_service(self, db_session):
        """Create PublishService instance."""
        return PublishService(db_session)

    @pytest.mark.unit
    def test_facebook_page_can_auto_publish(self, publish_service, facebook_page_account):
        """Facebook Page should support auto-publish."""
        assert publish_service.can_auto_publish(facebook_page_account) is True

    @pytest.mark.unit
    def test_instagram_business_can_auto_publish(self, publish_service, instagram_business_account):
        """Instagram Business should support auto-publish."""
        assert publish_service.can_auto_publish(instagram_business_account) is True

    @pytest.mark.unit
    def test_linkedin_profile_can_auto_publish(self, publish_service, linkedin_profile_account):
        """LinkedIn Profile should support auto-publish."""
        assert publish_service.can_auto_publish(linkedin_profile_account) is True

    @pytest.mark.unit
    def test_instagram_personal_cannot_auto_publish(self, publish_service, instagram_personal_account):
        """Personal Instagram account should NOT support auto-publish."""
        assert publish_service.can_auto_publish(instagram_personal_account) is False

    @pytest.mark.unit
    def test_unknown_account_type_cannot_auto_publish(self, publish_service, db_session, test_user):
        """Unknown account type should NOT support auto-publish."""
        account = SocialAccount(
            user_id=test_user.id,
            platform="twitter",
            account_type="twitter_personal",
            platform_user_id="tw_123",
            is_active=True,
        )
        assert publish_service.can_auto_publish(account) is False

    @pytest.mark.unit
    @pytest.mark.parametrize("account_type,expected", [
        ("facebook_page", True),
        ("instagram_business", True),
        ("instagram_creator", True),
        ("linkedin_profile", True),
        ("linkedin_company", True),
        ("facebook_personal", False),
        ("instagram_personal", False),
        ("unknown", False),
    ])
    def test_all_account_types(self, publish_service, db_session, test_user, account_type, expected):
        """Parametrized test for all account types."""
        account = SocialAccount(
            user_id=test_user.id,
            platform="test",
            account_type=account_type,
            platform_user_id="test_123",
            is_active=True,
        )
        assert publish_service.can_auto_publish(account) is expected


class TestValidateSocialAccountsForConfig:
    """Tests for validate_social_accounts_for_config method."""

    @pytest.fixture
    def publish_service(self, db_session):
        return PublishService(db_session)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_missing_account_returns_missing_status(
            self, publish_service, autopilot_config
    ):
        """Config with platform but no account should return 'missing' status."""
        # Usuń mapowanie Instagram
        autopilot_config.social_account_mapping = {}
        autopilot_config.platforms = ["twitter"]  # Platforma bez konta

        result = await publish_service.validate_social_accounts_for_config(autopilot_config)

        assert "twitter" in result
        assert result["twitter"]["status"] == "missing"
        assert result["twitter"]["can_auto_publish"] is False

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_connected_facebook_page_returns_connected(
            self, publish_service, autopilot_config, facebook_page_account
    ):
        """Connected Facebook Page should return 'connected' with can_auto_publish=True."""
        autopilot_config.platforms = ["facebook"]
        autopilot_config.social_account_mapping = {"facebook": facebook_page_account.id}

        result = await publish_service.validate_social_accounts_for_config(autopilot_config)

        assert "facebook" in result
        assert result["facebook"]["status"] == "connected"
        assert result["facebook"]["can_auto_publish"] is True
        assert result["facebook"]["account_type"] == "facebook_page"

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_expired_token_returns_expired_status(
            self, publish_service, autopilot_config, expired_token_account
    ):
        """Account with expired token should return 'expired' status."""
        autopilot_config.platforms = ["facebook"]
        autopilot_config.social_account_mapping = {"facebook": expired_token_account.id}

        result = await publish_service.validate_social_accounts_for_config(autopilot_config)

        assert "facebook" in result
        assert result["facebook"]["status"] == "expired"
        assert result["facebook"]["can_auto_publish"] is False

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_personal_account_returns_manual_only(
            self, publish_service, autopilot_config, instagram_personal_account
    ):
        """Personal account should return connected but can_auto_publish=False."""
        autopilot_config.platforms = ["instagram"]
        autopilot_config.social_account_mapping = {"instagram": instagram_personal_account.id}

        result = await publish_service.validate_social_accounts_for_config(autopilot_config)

        assert "instagram" in result
        assert result["instagram"]["status"] == "connected"
        assert result["instagram"]["can_auto_publish"] is False
        assert "ręczna" in result["instagram"]["message"].lower()


class TestPublishQueueItem:
    """Tests for publish_queue_item method."""

    @pytest.fixture
    def publish_service(self, db_session):
        return PublishService(db_session)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_already_published_returns_error(
            self, publish_service, queue_item_approved
    ):
        """Already published item should return error."""
        queue_item_approved.status = "published"

        result = await publish_service.publish_queue_item(queue_item_approved)

        assert result.success is False
        assert "Already published" in result.error

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_invalid_status_returns_error(
            self, publish_service, queue_item_pending
    ):
        """Item with 'pending' status should not be publishable."""
        result = await publish_service.publish_queue_item(queue_item_pending)

        assert result.success is False
        assert "Invalid status" in result.error

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_future_scheduled_without_force_returns_error(
            self, publish_service, queue_item_approved
    ):
        """Item scheduled for future should not publish without force=True."""
        queue_item_approved.scheduled_for = datetime.utcnow() + timedelta(hours=24)

        result = await publish_service.publish_queue_item(queue_item_approved, force=False)

        assert result.success is False
        assert "Not yet scheduled" in result.error

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_no_social_account_returns_error(
            self, publish_service, queue_item_approved
    ):
        """Publishing without social account should fail."""
        queue_item_approved.social_account_id = None
        # Mock get_social_account_for_platform to return None
        publish_service.get_social_account_for_platform = AsyncMock(return_value=None)

        result = await publish_service.publish_queue_item(queue_item_approved, force=True)

        assert result.success is False
        assert "No connected" in result.error

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_personal_account_requires_manual(
            self, publish_service, queue_item_approved, instagram_personal_account
    ):
        """Personal account should return requires_manual=True."""
        queue_item_approved.platform = "instagram"
        queue_item_approved.social_account_id = instagram_personal_account.id

        # Mock to return personal account
        publish_service.get_social_account = AsyncMock(return_value=instagram_personal_account)

        result = await publish_service.publish_queue_item(queue_item_approved, force=True)

        assert result.success is False
        assert result.requires_manual is True
        assert "manual" in result.error.lower()

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_successful_facebook_publish(
            self, publish_service, queue_item_approved, facebook_page_account,
            mock_social_manager, sample_publish_result
    ):
        """Successful Facebook Page publish should update item status."""
        queue_item_approved.social_account_id = facebook_page_account.id
        mock_social_manager.publish_post.return_value = sample_publish_result

        # Mock get_social_account
        publish_service.get_social_account = AsyncMock(return_value=facebook_page_account)

        with patch("app.services.publish_service.social_manager", mock_social_manager):
            result = await publish_service.publish_queue_item(queue_item_approved, force=True)

        assert result.success is True
        assert result.post_id == "post_123456"
        assert queue_item_approved.status == "published"
        assert queue_item_approved.published_at is not None

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_instagram_without_image_fails(
            self, publish_service, queue_item_approved, instagram_business_account
    ):
        """Instagram publish without image should fail."""
        queue_item_approved.platform = "instagram"
        queue_item_approved.image_url = None
        queue_item_approved.social_account_id = instagram_business_account.id

        publish_service.get_social_account = AsyncMock(return_value=instagram_business_account)

        result = await publish_service.publish_queue_item(queue_item_approved, force=True)

        assert result.success is False
        assert "image" in result.error.lower()

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_failed_publish_increments_attempts(
            self, publish_service, queue_item_approved, facebook_page_account,
            mock_social_manager, sample_failed_publish_result
    ):
        """Failed publish should increment publish_attempts."""
        queue_item_approved.social_account_id = facebook_page_account.id
        queue_item_approved.publish_attempts = 0
        mock_social_manager.publish_post.return_value = sample_failed_publish_result

        publish_service.get_social_account = AsyncMock(return_value=facebook_page_account)

        with patch("app.services.publish_service.social_manager", mock_social_manager):
            result = await publish_service.publish_queue_item(queue_item_approved, force=True)

        assert result.success is False
        assert queue_item_approved.publish_attempts == 1
        assert queue_item_approved.status != "failed"  # Still not failed (attempts < 3)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_third_failed_attempt_marks_as_failed(
            self, publish_service, queue_item_approved, facebook_page_account,
            mock_social_manager, sample_failed_publish_result
    ):
        """Third failed attempt should mark item as 'failed'."""
        queue_item_approved.social_account_id = facebook_page_account.id
        queue_item_approved.publish_attempts = 2  # Already 2 attempts
        mock_social_manager.publish_post.return_value = sample_failed_publish_result

        publish_service.get_social_account = AsyncMock(return_value=facebook_page_account)

        with patch("app.services.publish_service.social_manager", mock_social_manager):
            result = await publish_service.publish_queue_item(queue_item_approved, force=True)

        assert result.success is False
        assert queue_item_approved.publish_attempts == 3
        assert queue_item_approved.status == "failed"


class TestPrepareForManualPublish:
    """Tests for prepare_for_manual_publish method."""

    @pytest.fixture
    def publish_service(self, db_session):
        return PublishService(db_session)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_prepares_content_with_hashtags(
            self, publish_service, queue_item_pending
    ):
        """Should prepare full content with hashtags."""
        queue_item_pending.content = "Test content"
        queue_item_pending.hashtags = ["test", "postlio"]

        result = await publish_service.prepare_for_manual_publish(queue_item_pending)

        assert result["content"] == "Test content"
        assert "#test" in result["full_content"]
        assert "#postlio" in result["full_content"]
        assert result["hashtags"] == ["test", "postlio"]
        assert "#test #postlio" in result["hashtags_string"]

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_includes_platform_link(
            self, publish_service, queue_item_pending
    ):
        """Should include correct platform link."""
        queue_item_pending.platform = "facebook"

        result = await publish_service.prepare_for_manual_publish(queue_item_pending)

        assert result["platform"] == "facebook"
        assert "facebook.com" in result["platform_link"]

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_includes_instructions(
            self, publish_service, queue_item_pending
    ):
        """Should include publishing instructions."""
        queue_item_pending.platform = "instagram"

        result = await publish_service.prepare_for_manual_publish(queue_item_pending)

        assert "instructions" in result
        assert "Instagram" in result["instructions"]
        assert "Skopiuj" in result["instructions"]

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_handles_no_hashtags(
            self, publish_service, queue_item_pending
    ):
        """Should handle item without hashtags."""
        queue_item_pending.hashtags = None
        queue_item_pending.content = "Just content"

        result = await publish_service.prepare_for_manual_publish(queue_item_pending)

        assert result["hashtags"] == []
        assert result["hashtags_string"] == ""
        assert result["full_content"] == "Just content"

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_includes_image_url(
            self, publish_service, queue_item_with_image
    ):
        """Should include image URL if present."""
        result = await publish_service.prepare_for_manual_publish(queue_item_with_image)

        assert result["image_url"] == "https://example.com/image.jpg"


class TestGetManualPublishInstructions:
    """Tests for _get_manual_publish_instructions method."""

    @pytest.fixture
    def publish_service(self, db_session):
        return PublishService(db_session)

    @pytest.mark.unit
    @pytest.mark.parametrize("platform,expected_keywords", [
        ("facebook", ["Facebook", "Opublikuj"]),
        ("instagram", ["Instagram", "zdjęcie", "Udostępnij"]),
        ("linkedin", ["LinkedIn", "Opublikuj"]),
    ])
    def test_instructions_contain_platform_specific_keywords(
            self, publish_service, platform, expected_keywords
    ):
        """Each platform should have appropriate instructions."""
        instructions = publish_service._get_manual_publish_instructions(platform)

        for keyword in expected_keywords:
            assert keyword in instructions

    @pytest.mark.unit
    def test_unknown_platform_returns_generic_instructions(self, publish_service):
        """Unknown platform should return generic instructions."""
        instructions = publish_service._get_manual_publish_instructions("tiktok")

        assert "Skopiuj" in instructions
        assert "ręcznie" in instructions