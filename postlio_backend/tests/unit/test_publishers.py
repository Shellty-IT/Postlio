"""
Unit tests for BusinessPublisher and ManualAssistPublisher.

Tests cover:
- BusinessPublisher routing by platform
- BusinessPublisher guard conditions (no page_id, expired token, etc.)
- ManualAssistPublisher URL generation per platform
- ManualAssistPublisher.prepare_data returns correct ManualPublishData
"""
import pytest
from unittest.mock import AsyncMock

from app.services.publishers.business import BusinessPublisher
from app.services.publishers.manual import ManualAssistPublisher
from app.services.publishers.types import ManualPublishData
from app.models.social_account import SocialAccount


# ==================== BusinessPublisher ====================

class TestBusinessPublisherFacebook:
    """BusinessPublisher._publish_to_facebook guards and success path."""

    @pytest.fixture
    def publisher(self):
        return BusinessPublisher()

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_non_page_account_returns_manual_required(
            self, publisher, facebook_page_account
    ):
        """Non-page account type should return requires_manual_publish=True."""
        facebook_page_account.account_type = "facebook_personal"

        result = await publisher.publish(
            social_account=facebook_page_account,
            content="Test",
            image_url=None,
            hashtags=[],
        )

        assert result.success is False
        assert result.requires_manual_publish is True

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_missing_page_id_returns_error(
            self, publisher, facebook_page_account
    ):
        facebook_page_account.page_id = None

        result = await publisher.publish(
            social_account=facebook_page_account,
            content="Test",
            image_url=None,
            hashtags=[],
        )

        assert result.success is False
        assert "page_id" in result.error

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_missing_page_access_token_returns_error(
            self, publisher, facebook_page_account
    ):
        facebook_page_account.page_access_token = None

        result = await publisher.publish(
            social_account=facebook_page_account,
            content="Test",
            image_url=None,
            hashtags=[],
        )

        assert result.success is False
        assert "page_access_token" in result.error

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_successful_facebook_publish(
            self, publisher, facebook_page_account, mock_social_manager
    ):
        """Successful publish should wrap social_manager result."""
        from app.services.social.base import PublishResult as SocialPublishResult, SocialPlatform
        mock_social_manager.publish_post = AsyncMock(return_value=SocialPublishResult(
            success=True,
            platform=SocialPlatform.FACEBOOK,
            post_id="fb_post_1",
            post_url="https://facebook.com/fb_post_1",
        ))

        result = await publisher.publish(
            social_account=facebook_page_account,
            content="Hello world",
            image_url=None,
            hashtags=["test"],
        )

        assert result.success is True
        assert result.post_id == "fb_post_1"
        assert result.platform == "facebook"
        mock_social_manager.publish_post.assert_called_once()

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_hashtags_appended_to_content(
            self, publisher, facebook_page_account, mock_social_manager
    ):
        """Hashtags should be appended to the content before publishing."""
        from app.services.social.base import PublishResult as SocialPublishResult, SocialPlatform
        mock_social_manager.publish_post = AsyncMock(return_value=SocialPublishResult(
            success=True, platform=SocialPlatform.FACEBOOK,
        ))

        await publisher.publish(
            social_account=facebook_page_account,
            content="Post content",
            image_url=None,
            hashtags=["hello", "world"],
        )

        call_args = mock_social_manager.publish_post.call_args
        sent_content = call_args.kwargs.get("content") or call_args.args[1] if call_args.args else None
        if sent_content is None:
            sent_content = call_args.kwargs.get("content", "")
        assert "#hello" in sent_content or "#world" in sent_content


class TestBusinessPublisherInstagram:
    """BusinessPublisher._publish_to_instagram guards."""

    @pytest.fixture
    def publisher(self):
        return BusinessPublisher()

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_personal_account_returns_manual_required(
            self, publisher, instagram_personal_account
    ):
        result = await publisher.publish(
            social_account=instagram_personal_account,
            content="Test",
            image_url="https://example.com/img.jpg",
            hashtags=[],
        )

        assert result.success is False
        assert result.requires_manual_publish is True

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_missing_image_returns_error(
            self, publisher, instagram_business_account
    ):
        result = await publisher.publish(
            social_account=instagram_business_account,
            content="Test",
            image_url=None,
            hashtags=[],
        )

        assert result.success is False
        assert "obrazka" in result.error or "image" in result.error.lower()

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_missing_instagram_account_id_returns_error(
            self, publisher, instagram_business_account
    ):
        instagram_business_account.instagram_account_id = None

        result = await publisher.publish(
            social_account=instagram_business_account,
            content="Test",
            image_url="https://example.com/img.jpg",
            hashtags=[],
        )

        assert result.success is False
        assert "instagram_account_id" in result.error


class TestBusinessPublisherUnsupportedPlatform:
    """BusinessPublisher rejects unknown platforms."""

    @pytest.fixture
    def publisher(self):
        return BusinessPublisher()

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_unknown_platform_returns_error(self, publisher, test_user, db_session):
        account = SocialAccount(
            user_id=test_user.id,
            platform="tiktok",
            account_type="tiktok_personal",
            platform_user_id="tt_123",
            is_active=True,
        )

        result = await publisher.publish(
            social_account=account,
            content="Test",
            image_url=None,
            hashtags=[],
        )

        assert result.success is False
        assert "tiktok" in result.error.lower() or "Unsupported" in result.error


# ==================== ManualAssistPublisher ====================

class TestManualAssistPublisherGenerateUrls:
    """ManualAssistPublisher.generate_urls URL generation."""

    @pytest.fixture
    def publisher(self):
        return ManualAssistPublisher()

    @pytest.mark.unit
    def test_facebook_returns_share_dialog_url(self, publisher):
        result = publisher.generate_urls(
            platform="facebook", account_type="facebook_personal",
            content="Hello", hashtags=[],
        )
        assert result["share_dialog_url"] is not None
        assert "facebook.com" in result["share_dialog_url"]

    @pytest.mark.unit
    def test_instagram_returns_deeplink(self, publisher):
        result = publisher.generate_urls(
            platform="instagram", account_type="instagram_personal",
            content="Hello", hashtags=[],
        )
        assert result["deeplink_url"] is not None
        assert "instagram" in result["deeplink_url"]

    @pytest.mark.unit
    def test_linkedin_returns_share_dialog_url(self, publisher):
        result = publisher.generate_urls(
            platform="linkedin", account_type="linkedin_profile",
            content="Hello", hashtags=[],
        )
        assert result["share_dialog_url"] is not None
        assert "linkedin.com" in result["share_dialog_url"]

    @pytest.mark.unit
    def test_unknown_platform_returns_empty_instructions(self, publisher):
        result = publisher.generate_urls(
            platform="tiktok", account_type="tiktok_personal",
            content="Hello", hashtags=[],
        )
        assert result["manual_instructions"] == []

    @pytest.mark.unit
    def test_hashtags_included_in_share_dialog_url(self, publisher):
        result = publisher.generate_urls(
            platform="facebook", account_type="facebook_personal",
            content="Hello", hashtags=["test", "postlio"],
        )
        assert "%23" in result["share_dialog_url"] or "#test" in result["share_dialog_url"]


class TestManualAssistPublisherPrepareData:
    """ManualAssistPublisher.prepare_data returns correct ManualPublishData."""

    @pytest.fixture
    def publisher(self):
        return ManualAssistPublisher()

    @pytest.mark.unit
    def test_returns_manual_publish_data_instance(self, publisher):
        result = publisher.prepare_data(
            platform="facebook", account_type="facebook_personal",
            content="Hello world", hashtags=["test"],
        )
        assert isinstance(result, ManualPublishData)

    @pytest.mark.unit
    def test_content_and_hashtags_stored_separately(self, publisher):
        result = publisher.prepare_data(
            platform="facebook", account_type="facebook_personal",
            content="Base content", hashtags=["one", "two"],
        )
        assert result.content == "Base content"
        assert result.hashtags == ["one", "two"]
        assert result.hashtags_string == "#one #two"

    @pytest.mark.unit
    def test_full_content_combines_text_and_hashtags(self, publisher):
        result = publisher.prepare_data(
            platform="instagram", account_type="instagram_personal",
            content="Great photo", hashtags=["photo"],
        )
        assert "#photo" in result.full_content
        assert "Great photo" in result.full_content

    @pytest.mark.unit
    def test_no_hashtags_means_clean_full_content(self, publisher):
        result = publisher.prepare_data(
            platform="facebook", account_type="facebook_personal",
            content="Just text", hashtags=None,
        )
        assert result.full_content == "Just text"
        assert result.hashtags_string == ""

    @pytest.mark.unit
    def test_image_url_passed_through(self, publisher):
        result = publisher.prepare_data(
            platform="instagram", account_type="instagram_personal",
            content="With image", hashtags=[],
            image_url="https://example.com/img.jpg",
        )
        assert result.image_url == "https://example.com/img.jpg"

    @pytest.mark.unit
    def test_instagram_image_requires_download(self, publisher):
        result = publisher.prepare_data(
            platform="instagram", account_type="instagram_personal",
            content="With image", hashtags=[],
            image_url="https://example.com/img.jpg",
        )
        assert result.requires_image_download is True

    @pytest.mark.unit
    def test_facebook_image_does_not_require_download(self, publisher):
        result = publisher.prepare_data(
            platform="facebook", account_type="facebook_personal",
            content="With image", hashtags=[],
            image_url="https://example.com/img.jpg",
        )
        assert result.requires_image_download is False

    @pytest.mark.unit
    def test_instructions_is_list_of_strings(self, publisher):
        result = publisher.prepare_data(
            platform="facebook", account_type="facebook_personal",
            content="Test", hashtags=[],
        )
        assert isinstance(result.instructions, list)
        assert all(isinstance(i, str) for i in result.instructions)
