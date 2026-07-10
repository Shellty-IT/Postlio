import logging
from typing import Optional, List

from app.models.social_account import SocialAccount
from app.services.publishers.types import PublishResult
from app.services.social.manager import social_manager
from app.services.social.base import SocialPlatform

logger = logging.getLogger(__name__)


class BusinessPublisher:
    """Direct API publishing for business accounts (Facebook Page, Instagram Business/Creator, LinkedIn Company)."""

    async def publish(
        self,
        social_account: SocialAccount,
        content: str,
        image_url: Optional[str],
        hashtags: List[str],
    ) -> PublishResult:
        platform = social_account.platform
        full_content = content
        if hashtags:
            hashtag_str = " ".join(f"#{tag.lstrip('#')}" for tag in hashtags)
            full_content = f"{content}\n\n{hashtag_str}"

        try:
            if platform == "facebook":
                return await self._publish_to_facebook(social_account, full_content, image_url)
            elif platform == "instagram":
                return await self._publish_to_instagram(social_account, full_content, image_url)
            elif platform == "linkedin":
                return await self._publish_to_linkedin(social_account, full_content, image_url)
            else:
                return PublishResult(success=False, error=f"Unsupported platform: {platform}", platform=platform)
        except Exception as e:
            logger.error("Platform publish error: %s", e)
            return PublishResult(success=False, error=str(e), platform=platform)

    async def _publish_to_facebook(
        self, account: SocialAccount, content: str, image_url: Optional[str]
    ) -> PublishResult:
        if account.account_type != "facebook_page":
            return PublishResult(
                success=False,
                error=f"Facebook auto-publish wymaga Facebook Page, nie {account.account_type}",
                platform="facebook",
                requires_manual_publish=True,
                account_type=account.account_type,
                is_business_account=False,
            )
        if not account.page_id:
            return PublishResult(success=False, error="Brak page_id - połącz ponownie stronę Facebook", platform="facebook")
        if not account.page_access_token:
            return PublishResult(success=False, error="Brak page_access_token - połącz ponownie stronę Facebook", platform="facebook")

        logger.info("Publishing to Facebook Page: %s (ID: %s)", account.page_name, account.page_id)

        result = await social_manager.publish_post(
            platform=SocialPlatform.FACEBOOK,
            access_token=account.page_access_token,
            content=content,
            image_url=image_url,
            page_id=account.page_id,
            account_type=account.account_type,
        )
        return PublishResult(
            success=result.success,
            post_id=result.post_id,
            post_url=result.post_url,
            error=result.error,
            platform="facebook",
            account_type=account.account_type,
            is_business_account=True,
        )

    async def _publish_to_instagram(
        self, account: SocialAccount, content: str, image_url: Optional[str]
    ) -> PublishResult:
        if account.account_type not in ("instagram_business", "instagram_creator"):
            return PublishResult(
                success=False,
                error=f"Instagram auto-publish wymaga Business/Creator account, nie {account.account_type}",
                platform="instagram",
                requires_manual_publish=True,
                account_type=account.account_type,
                is_business_account=False,
            )
        if not image_url:
            return PublishResult(success=False, error="Instagram wymaga obrazka w każdym poście", platform="instagram")
        if not account.instagram_account_id:
            return PublishResult(success=False, error="Brak instagram_account_id - połącz ponownie konto Instagram", platform="instagram")
        if not account.access_token:
            return PublishResult(success=False, error="Brak access_token - połącz ponownie konto Instagram", platform="instagram")

        logger.info("Publishing to Instagram: @%s (ID: %s)", account.platform_username, account.instagram_account_id)

        result = await social_manager.publish_post(
            platform=SocialPlatform.INSTAGRAM,
            access_token=account.access_token,
            content=content,
            image_url=image_url,
            instagram_account_id=account.instagram_account_id,
            account_type=account.account_type,
        )
        return PublishResult(
            success=result.success,
            post_id=result.post_id,
            post_url=result.post_url,
            error=result.error,
            platform="instagram",
            account_type=account.account_type,
            is_business_account=True,
        )

    async def _publish_to_linkedin(
        self, account: SocialAccount, content: str, image_url: Optional[str]
    ) -> PublishResult:
        if account.account_type != "linkedin_company":
            return PublishResult(
                success=False,
                error=f"LinkedIn auto-publish wymaga strony firmowej, nie {account.account_type}",
                platform="linkedin",
                requires_manual_publish=True,
                account_type=account.account_type,
                is_business_account=False,
            )
        if not account.platform_user_id:
            return PublishResult(success=False, error="Brak platform_user_id - połącz ponownie konto LinkedIn", platform="linkedin")
        if not account.access_token:
            return PublishResult(success=False, error="Brak access_token - połącz ponownie konto LinkedIn", platform="linkedin")

        logger.info("Publishing to LinkedIn Company: %s", account.platform_username)

        author_urn = f"urn:li:organization:{account.platform_user_id}"
        result = await social_manager.publish_post(
            platform=SocialPlatform.LINKEDIN,
            access_token=account.access_token,
            content=content,
            image_url=image_url,
            author_urn=author_urn,
            organization_id=account.platform_user_id,
            account_type=account.account_type,
        )
        return PublishResult(
            success=result.success,
            post_id=result.post_id,
            post_url=result.post_url,
            error=result.error,
            platform="linkedin",
            account_type=account.account_type,
            is_business_account=True,
        )
