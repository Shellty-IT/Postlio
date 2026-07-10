import logging
from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.autopilot import AutopilotConfig, AutopilotQueueItem
from app.models.social_account import SocialAccount
from app.services.publishers import PublishResult, ManualPublishData, BusinessPublisher, ManualAssistPublisher

logger = logging.getLogger(__name__)

_business_publisher = BusinessPublisher()
_manual_publisher = ManualAssistPublisher()

AUTO_PUBLISH_ACCOUNT_TYPES = {"facebook_page", "instagram_business", "instagram_creator", "linkedin_company"}
MANUAL_PUBLISH_ACCOUNT_TYPES = {"facebook_personal", "instagram_personal", "linkedin_personal", "linkedin_profile"}
SHARE_DIALOG_ACCOUNT_TYPES = {"facebook_personal", "linkedin_personal", "linkedin_profile"}
DEEPLINK_ONLY_ACCOUNT_TYPES = {"instagram_personal"}


class PublishService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ==================== ACCOUNT QUERIES ====================

    async def get_social_account(self, account_id: int, user_id: int) -> Optional[SocialAccount]:
        result = await self.db.execute(
            select(SocialAccount)
            .where(SocialAccount.id == account_id)
            .where(SocialAccount.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_social_account_for_platform(self, user_id: int, platform: str) -> Optional[SocialAccount]:
        result = await self.db.execute(
            select(SocialAccount)
            .where(SocialAccount.user_id == user_id)
            .where(SocialAccount.platform == platform)
            .where(SocialAccount.is_active == True)
            .where(SocialAccount.account_type.in_(AUTO_PUBLISH_ACCOUNT_TYPES))
            .order_by(SocialAccount.last_used_at.desc().nullsfirst())
            .limit(1)
        )
        account = result.scalar_one_or_none()
        if account:
            return account

        result = await self.db.execute(
            select(SocialAccount)
            .where(SocialAccount.user_id == user_id)
            .where(SocialAccount.platform == platform)
            .where(SocialAccount.is_active == True)
            .order_by(SocialAccount.last_used_at.desc().nullsfirst())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_all_accounts_for_user(self, user_id: int) -> List[SocialAccount]:
        result = await self.db.execute(
            select(SocialAccount)
            .where(SocialAccount.user_id == user_id)
            .where(SocialAccount.is_active == True)
            .order_by(SocialAccount.platform, SocialAccount.created_at.desc())
        )
        return list(result.scalars().all())

    # ==================== ACCOUNT TYPE CHECKS ====================

    def can_auto_publish(self, account: SocialAccount) -> bool:
        return account.account_type in AUTO_PUBLISH_ACCOUNT_TYPES

    def is_personal_account(self, account: SocialAccount) -> bool:
        return account.account_type in MANUAL_PUBLISH_ACCOUNT_TYPES

    def supports_share_dialog(self, account: SocialAccount) -> bool:
        return account.account_type in SHARE_DIALOG_ACCOUNT_TYPES

    def requires_deeplink_only(self, account: SocialAccount) -> bool:
        return account.account_type in DEEPLINK_ONLY_ACCOUNT_TYPES

    def get_account_capabilities(self, account: SocialAccount) -> Dict[str, Any]:
        is_business = self.can_auto_publish(account)
        return {
            "is_business_account": is_business,
            "supports_auto_publish": is_business,
            "supports_autopilot": is_business,
            "supports_scheduling": is_business,
            "supports_share_dialog": self.supports_share_dialog(account),
            "requires_manual_publish": not is_business,
            "requires_image": account.requires_image,
            "publish_method": "auto" if is_business else ("share_dialog" if self.supports_share_dialog(account) else "manual_copy"),
        }

    # ==================== VALIDATION ====================

    async def validate_social_accounts_for_config(self, config: AutopilotConfig) -> Dict[str, Dict[str, Any]]:
        platforms = config.platforms or []
        social_mapping = config.social_account_mapping or {}
        result = {}

        for platform in platforms:
            account_id = social_mapping.get(platform)
            account = (
                await self.get_social_account(account_id, config.user_id)
                if account_id
                else await self.get_social_account_for_platform(config.user_id, platform)
            )

            if not account:
                result[platform] = {"status": "missing", "can_auto_publish": False, "is_business_account": False, "account_type": None, "message": f"Brak połączonego konta {platform}"}
            elif not account.is_active:
                result[platform] = {"status": "inactive", "can_auto_publish": False, "is_business_account": False, "account_type": account.account_type, "message": "Konto jest nieaktywne"}
            elif account.is_token_expired:
                result[platform] = {"status": "expired", "can_auto_publish": False, "is_business_account": self.can_auto_publish(account), "account_type": account.account_type, "message": "Token wygasł - połącz ponownie"}
            elif self.is_personal_account(account):
                result[platform] = {"status": "personal_account", "can_auto_publish": False, "is_business_account": False, "account_type": account.account_type, "account_name": account.page_name or account.platform_username, "message": self._get_upgrade_message(platform)}
            else:
                result[platform] = {"status": "connected", "can_auto_publish": True, "is_business_account": True, "account_type": account.account_type, "account_name": account.page_name or account.platform_username, "message": "Gotowe do automatycznej publikacji"}

        return result

    def _get_upgrade_message(self, platform: str) -> str:
        messages = {
            "facebook": "Autopilot wymaga Strony Facebook. Podłącz stronę, którą zarządzasz.",
            "instagram": "Autopilot wymaga konta Instagram Business lub Creator połączonego ze Stroną Facebook.",
            "linkedin": "Autopilot wymaga Strony firmowej LinkedIn.",
        }
        return messages.get(platform, "Autopilot wymaga konta firmowego.")

    # ==================== PUBLISH ====================

    async def publish_queue_item(self, item: AutopilotQueueItem, force: bool = False) -> PublishResult:
        now = datetime.utcnow()

        if item.status == "published":
            return PublishResult(success=False, error="Already published", platform=item.platform)
        if item.status not in ("approved", "scheduled"):
            return PublishResult(success=False, error=f"Invalid status: {item.status}", platform=item.platform)
        if not force and item.scheduled_for and item.scheduled_for > now:
            return PublishResult(success=False, error="Not yet scheduled", platform=item.platform)

        social_account = None
        if item.social_account_id:
            social_account = await self.get_social_account(item.social_account_id, item.user_id)
        if not social_account:
            social_account = await self.get_social_account_for_platform(item.user_id, item.platform)

        if not social_account:
            item.publish_attempts = (item.publish_attempts or 0) + 1
            item.publish_error = f"No connected {item.platform} account found"
            item.last_publish_attempt_at = now
            if item.publish_attempts >= 3:
                item.status = "failed"
            await self.db.flush()
            return PublishResult(success=False, error=item.publish_error, platform=item.platform)

        if self.is_personal_account(social_account):
            urls = _manual_publisher.generate_urls(
                platform=item.platform,
                account_type=social_account.account_type,
                content=item.content,
                hashtags=item.hashtags,
            )
            return PublishResult(
                success=False,
                error=f"Konto osobiste ({social_account.account_type}) nie wspiera automatycznej publikacji",
                platform=item.platform,
                requires_manual_publish=True,
                account_type=social_account.account_type,
                is_business_account=False,
                **urls,
            )

        if not social_account.is_active:
            item.publish_attempts = (item.publish_attempts or 0) + 1
            item.publish_error = f"Account {item.platform} is inactive"
            item.last_publish_attempt_at = now
            await self.db.flush()
            return PublishResult(success=False, error=item.publish_error, platform=item.platform)

        if social_account.is_token_expired:
            item.publish_attempts = (item.publish_attempts or 0) + 1
            item.publish_error = f"Token expired for {item.platform}"
            item.last_publish_attempt_at = now
            await self.db.flush()
            return PublishResult(success=False, error=item.publish_error, platform=item.platform)

        if social_account.requires_image and not item.image_url:
            item.publish_attempts = (item.publish_attempts or 0) + 1
            item.publish_error = "Instagram requires an image"
            item.last_publish_attempt_at = now
            await self.db.flush()
            return PublishResult(success=False, error=item.publish_error, platform=item.platform)

        try:
            logger.info("Publishing item %s to %s (%s)...", item.id, item.platform, social_account.account_type)

            result = await _business_publisher.publish(
                social_account=social_account,
                content=item.content,
                image_url=item.image_url,
                hashtags=item.hashtags or [],
            )

            if result.success:
                item.status = "published"
                item.published_at = now
                item.platform_post_id = result.post_id
                item.platform_post_url = result.post_url
                item.publish_error = None
                item.social_account_id = social_account.id

                social_account.posts_published = (social_account.posts_published or 0) + 1
                social_account.last_used_at = now
                social_account.last_error = None

                config_result = await self.db.execute(
                    select(AutopilotConfig).where(AutopilotConfig.id == item.config_id)
                )
                config = config_result.scalar_one_or_none()
                if config:
                    config.total_published = (config.total_published or 0) + 1
                    config.last_published_at = now

                logger.info("Published item %s to %s: %s", item.id, item.platform, result.post_id)
            else:
                item.publish_attempts = (item.publish_attempts or 0) + 1
                item.publish_error = result.error
                item.last_publish_attempt_at = now
                if item.publish_attempts >= 3:
                    item.status = "failed"
                social_account.last_error = result.error
                logger.warning("Failed to publish item %s: %s", item.id, result.error)

            await self.db.flush()
            return result

        except Exception as e:
            logger.error("Exception publishing item %s: %s", item.id, e)
            item.publish_attempts = (item.publish_attempts or 0) + 1
            item.publish_error = str(e)
            item.last_publish_attempt_at = now
            if item.publish_attempts >= 3:
                item.status = "failed"
            await self.db.flush()
            return PublishResult(success=False, error=str(e), platform=item.platform)

    # ==================== MANUAL PUBLISH HELPERS ====================

    async def prepare_for_manual_publish(
        self, item: AutopilotQueueItem, account: Optional[SocialAccount] = None
    ) -> ManualPublishData:
        if not account:
            if item.social_account_id:
                account = await self.get_social_account(item.social_account_id, item.user_id)
            if not account:
                account = await self.get_social_account_for_platform(item.user_id, item.platform)

        account_type = account.account_type if account else f"{item.platform}_personal"

        return _manual_publisher.prepare_data(
            platform=item.platform,
            account_type=account_type,
            content=item.content,
            hashtags=item.hashtags,
            image_url=item.image_url,
        )

    async def mark_as_manually_published(
        self, item: AutopilotQueueItem, post_url: Optional[str] = None
    ) -> None:
        now = datetime.utcnow()
        item.status = "published"
        item.published_at = now
        item.platform_post_url = post_url
        item.publish_error = None

        if item.social_account_id:
            account = await self.get_social_account(item.social_account_id, item.user_id)
            if account:
                account.last_used_at = now

        await self.db.flush()
        logger.info("Marked item %s as manually published", item.id)

    # ==================== BULK OPERATIONS ====================

    async def publish_approved_items(
        self, config_id: Optional[int] = None, user_id: Optional[int] = None, limit: int = 10
    ) -> Tuple[int, int, List[Dict[str, Any]]]:
        now = datetime.utcnow()
        query = (
            select(AutopilotQueueItem)
            .where(AutopilotQueueItem.status == "approved")
            .where(AutopilotQueueItem.scheduled_for <= now)
            .order_by(AutopilotQueueItem.scheduled_for.asc())
            .limit(limit)
            .with_for_update(skip_locked=True)
        )
        if config_id:
            query = query.where(AutopilotQueueItem.config_id == config_id)
        if user_id:
            query = query.where(AutopilotQueueItem.user_id == user_id)

        result = await self.db.execute(query)
        items = list(result.scalars().all())

        published = 0
        failed = 0
        results = []

        for item in items:
            pub_result = await self.publish_queue_item(item, force=True)
            results.append({
                "item_id": item.id,
                "platform": item.platform,
                "success": pub_result.success,
                "post_id": pub_result.post_id,
                "post_url": pub_result.post_url,
                "error": pub_result.error,
                "requires_manual_publish": pub_result.requires_manual_publish,
                "account_type": pub_result.account_type,
                "is_business_account": pub_result.is_business_account,
            })
            if pub_result.success and not pub_result.requires_manual_publish:
                published += 1
            else:
                failed += 1

        return published, failed, results

    async def retry_failed_items(
        self, config_id: int, user_id: int, max_attempts: int = 3
    ) -> Tuple[int, int]:
        result = await self.db.execute(
            select(AutopilotQueueItem)
            .where(AutopilotQueueItem.config_id == config_id)
            .where(AutopilotQueueItem.user_id == user_id)
            .where(AutopilotQueueItem.status == "failed")
            .where(AutopilotQueueItem.publish_attempts < max_attempts)
        )
        items = list(result.scalars().all())

        success = 0
        failed = 0
        for item in items:
            item.status = "approved"
            pub_result = await self.publish_queue_item(item, force=True)
            if pub_result.success and not pub_result.requires_manual_publish:
                success += 1
            else:
                failed += 1

        return success, failed

    async def get_failed_items(self, config_id: int, user_id: int, limit: int = 20) -> List[AutopilotQueueItem]:
        result = await self.db.execute(
            select(AutopilotQueueItem)
            .where(AutopilotQueueItem.config_id == config_id)
            .where(AutopilotQueueItem.user_id == user_id)
            .where(AutopilotQueueItem.status == "failed")
            .order_by(AutopilotQueueItem.updated_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_items_requiring_manual_publish(
        self, user_id: int, limit: int = 20
    ) -> List[AutopilotQueueItem]:
        now = datetime.utcnow()
        result = await self.db.execute(
            select(AutopilotQueueItem)
            .join(SocialAccount, AutopilotQueueItem.social_account_id == SocialAccount.id)
            .where(AutopilotQueueItem.user_id == user_id)
            .where(AutopilotQueueItem.status.in_(["scheduled", "approved"]))
            .where(AutopilotQueueItem.scheduled_for <= now)
            .where(SocialAccount.account_type.in_(MANUAL_PUBLISH_ACCOUNT_TYPES))
            .order_by(AutopilotQueueItem.scheduled_for.asc())
            .limit(limit)
        )
        return list(result.scalars().all())


def get_publish_service(db: AsyncSession) -> PublishService:
    return PublishService(db)
