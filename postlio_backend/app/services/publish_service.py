# postlio_backend/app/services/publish_service.py
"""
Serwis publikacji - publikowanie postów na social media.
Integracja z prawdziwymi API: Facebook, Instagram, LinkedIn.
"""
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.autopilot import AutopilotConfig, AutopilotQueueItem
from app.models.social_account import SocialAccount
from app.services.social.manager import social_manager
from app.services.social.base import SocialPlatform, PublishResult as SocialPublishResult

logger = logging.getLogger(__name__)


@dataclass
class PublishResult:
    """Wynik publikacji."""
    success: bool
    post_id: Optional[str] = None
    post_url: Optional[str] = None
    error: Optional[str] = None
    platform: Optional[str] = None
    requires_manual: bool = False  # True jeśli wymaga ręcznej publikacji


class PublishService:
    """
    Serwis do publikowania postów na platformy social media.

    Obsługuje:
    - AUTO-PUBLISH: Facebook Pages, Instagram Business/Creator, LinkedIn
    - MANUAL-ASSIST: Konta osobiste (przygotowanie treści do ręcznej publikacji)
    """

    # Typy kont wspierające automatyczną publikację
    AUTO_PUBLISH_ACCOUNT_TYPES = {
        "facebook_page",
        "instagram_business",
        "instagram_creator",
        "linkedin_profile",
        "linkedin_company",
    }

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_social_account(self, account_id: int, user_id: int) -> Optional[SocialAccount]:
        """Pobierz konto social media."""
        result = await self.db.execute(
            select(SocialAccount)
            .where(SocialAccount.id == account_id)
            .where(SocialAccount.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_social_account_for_platform(
            self,
            user_id: int,
            platform: str
    ) -> Optional[SocialAccount]:
        """Pobierz aktywne konto dla platformy (preferuj auto-publish accounts)."""
        # Najpierw szukaj kont z auto-publish
        result = await self.db.execute(
            select(SocialAccount)
            .where(SocialAccount.user_id == user_id)
            .where(SocialAccount.platform == platform)
            .where(SocialAccount.is_active == True)
            .where(SocialAccount.account_type.in_(self.AUTO_PUBLISH_ACCOUNT_TYPES))
            .order_by(SocialAccount.last_used_at.desc().nullsfirst())
            .limit(1)
        )
        account = result.scalar_one_or_none()

        if account:
            return account

        # Fallback - dowolne aktywne konto
        result = await self.db.execute(
            select(SocialAccount)
            .where(SocialAccount.user_id == user_id)
            .where(SocialAccount.platform == platform)
            .where(SocialAccount.is_active == True)
            .order_by(SocialAccount.last_used_at.desc().nullsfirst())
            .limit(1)
        )
        return result.scalar_one_or_none()

    def can_auto_publish(self, account: SocialAccount) -> bool:
        """Sprawdź czy konto wspiera automatyczną publikację."""
        return account.account_type in self.AUTO_PUBLISH_ACCOUNT_TYPES

    async def validate_social_accounts_for_config(
            self,
            config: AutopilotConfig
    ) -> Dict[str, Dict[str, Any]]:
        """
        Sprawdź status kont social dla wszystkich platform w konfiguracji.

        Zwraca dict: {platform: {status, can_auto_publish, account_type}}
        """
        platforms = config.platforms or []
        social_mapping = config.social_account_mapping or {}
        result = {}

        for platform in platforms:
            account_id = social_mapping.get(platform)

            if not account_id:
                account = await self.get_social_account_for_platform(
                    config.user_id,
                    platform
                )
            else:
                account = await self.get_social_account(account_id, config.user_id)

            if not account:
                result[platform] = {
                    "status": "missing",
                    "can_auto_publish": False,
                    "account_type": None,
                    "message": f"Brak połączonego konta {platform}"
                }
            elif not account.is_active:
                result[platform] = {
                    "status": "inactive",
                    "can_auto_publish": False,
                    "account_type": account.account_type,
                    "message": "Konto jest nieaktywne"
                }
            elif account.is_token_expired:
                result[platform] = {
                    "status": "expired",
                    "can_auto_publish": False,
                    "account_type": account.account_type,
                    "message": "Token wygasł - połącz ponownie"
                }
            else:
                can_auto = self.can_auto_publish(account)
                result[platform] = {
                    "status": "connected",
                    "can_auto_publish": can_auto,
                    "account_type": account.account_type,
                    "account_name": account.page_name or account.platform_username,
                    "message": "Gotowe do publikacji" if can_auto else "Tylko ręczna publikacja"
                }

        return result

    async def publish_queue_item(
            self,
            item: AutopilotQueueItem,
            force: bool = False
    ) -> PublishResult:
        """
        Opublikuj pojedynczy element z kolejki.

        Args:
            item: Element kolejki do publikacji
            force: Jeśli True, publikuj nawet jeśli scheduled_for > now
        """
        now = datetime.utcnow()

        # Sprawdź czy można publikować
        if item.status == "published":
            return PublishResult(success=False, error="Already published", platform=item.platform)

        if item.status not in ("approved", "scheduled"):
            return PublishResult(success=False, error=f"Invalid status: {item.status}", platform=item.platform)

        if not force and item.scheduled_for and item.scheduled_for > now:
            return PublishResult(success=False, error="Not yet scheduled", platform=item.platform)

        # Pobierz konto social
        social_account = None

        if item.social_account_id:
            social_account = await self.get_social_account(
                item.social_account_id,
                item.user_id
            )

        if not social_account:
            social_account = await self.get_social_account_for_platform(
                item.user_id,
                item.platform
            )

        if not social_account:
            item.publish_attempts = (item.publish_attempts or 0) + 1
            item.publish_error = f"No connected {item.platform} account found"
            item.last_publish_attempt_at = now
            item.status = "failed" if item.publish_attempts >= 3 else item.status
            await self.db.flush()
            return PublishResult(
                success=False,
                error=item.publish_error,
                platform=item.platform
            )

        # Sprawdź czy można auto-publish
        if not self.can_auto_publish(social_account):
            return PublishResult(
                success=False,
                error=f"Account type '{social_account.account_type}' requires manual publishing",
                platform=item.platform,
                requires_manual=True
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

        # Instagram wymaga obrazka
        if social_account.requires_image and not item.image_url:
            item.publish_attempts = (item.publish_attempts or 0) + 1
            item.publish_error = "Instagram requires an image"
            item.last_publish_attempt_at = now
            await self.db.flush()
            return PublishResult(success=False, error=item.publish_error, platform=item.platform)

        # === PUBLIKACJA ===
        try:
            logger.info(f"📤 Publishing item {item.id} to {item.platform} ({social_account.account_type})...")

            result = await self._publish_to_platform(
                social_account=social_account,
                content=item.content,
                image_url=item.image_url,
                hashtags=item.hashtags or []
            )

            if result.success:
                # Sukces!
                item.status = "published"
                item.published_at = now
                item.platform_post_id = result.post_id
                item.platform_post_url = result.post_url
                item.publish_error = None
                item.social_account_id = social_account.id

                # Aktualizuj statystyki
                social_account.posts_published = (social_account.posts_published or 0) + 1
                social_account.last_used_at = now
                social_account.last_error = None

                # Aktualizuj config
                config_result = await self.db.execute(
                    select(AutopilotConfig)
                    .where(AutopilotConfig.id == item.config_id)
                )
                config = config_result.scalar_one_or_none()
                if config:
                    config.total_published = (config.total_published or 0) + 1
                    config.last_published_at = now

                logger.info(f"✅ Published item {item.id} to {item.platform}: {result.post_id}")

            else:
                # Błąd
                item.publish_attempts = (item.publish_attempts or 0) + 1
                item.publish_error = result.error
                item.last_publish_attempt_at = now

                if item.publish_attempts >= 3:
                    item.status = "failed"

                social_account.last_error = result.error

                logger.warning(f"❌ Failed to publish item {item.id}: {result.error}")

            await self.db.flush()
            return result

        except Exception as e:
            logger.error(f"Exception publishing item {item.id}: {e}")
            item.publish_attempts = (item.publish_attempts or 0) + 1
            item.publish_error = str(e)
            item.last_publish_attempt_at = now

            if item.publish_attempts >= 3:
                item.status = "failed"

            await self.db.flush()
            return PublishResult(success=False, error=str(e), platform=item.platform)

    async def _publish_to_platform(
            self,
            social_account: SocialAccount,
            content: str,
            image_url: Optional[str],
            hashtags: List[str]
    ) -> PublishResult:
        """
        Publikuj na konkretną platformę używając prawdziwych API.
        """
        platform = social_account.platform

        # Dodaj hashtagi do treści jeśli są
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
            logger.error(f"Platform publish error: {e}")
            return PublishResult(success=False, error=str(e), platform=platform)

    # ==================== FACEBOOK ====================

    async def _publish_to_facebook(
            self,
            account: SocialAccount,
            content: str,
            image_url: Optional[str]
    ) -> PublishResult:
        """
        Publikuj na Facebook Page używając Graph API.

        Wymaga:
        - page_id: ID strony Facebook
        - page_access_token: Page Access Token (zaszyfrowany)
        """
        # Walidacja
        if account.account_type != "facebook_page":
            return PublishResult(
                success=False,
                error=f"Facebook auto-publish wymaga Facebook Page, nie {account.account_type}",
                platform="facebook",
                requires_manual=True
            )

        if not account.page_id:
            return PublishResult(
                success=False,
                error="Brak page_id - połącz ponownie stronę Facebook",
                platform="facebook"
            )

        if not account.page_access_token:
            return PublishResult(
                success=False,
                error="Brak page_access_token - połącz ponownie stronę Facebook",
                platform="facebook"
            )

        logger.info(f"📘 Publishing to Facebook Page: {account.page_name} (ID: {account.page_id})")

        # Użyj social_manager który obsługuje deszyfrowanie
        result = await social_manager.publish_post(
            platform=SocialPlatform.FACEBOOK,
            access_token=account.page_access_token,  # Zaszyfrowany - manager odszyfruje
            content=content,
            image_url=image_url,
            page_id=account.page_id
        )

        return PublishResult(
            success=result.success,
            post_id=result.post_id,
            post_url=result.post_url,
            error=result.error,
            platform="facebook"
        )

    # ==================== INSTAGRAM ====================

    async def _publish_to_instagram(
            self,
            account: SocialAccount,
            content: str,
            image_url: Optional[str]
    ) -> PublishResult:
        """
        Publikuj na Instagram Business/Creator używając Graph API.

        WAŻNE: Instagram ZAWSZE wymaga obrazka!

        Wymaga:
        - instagram_account_id: ID konta Instagram Business
        - access_token: User Access Token (zaszyfrowany)
        """
        # Walidacja typu konta
        if account.account_type not in ("instagram_business", "instagram_creator"):
            return PublishResult(
                success=False,
                error=f"Instagram auto-publish wymaga Business/Creator account, nie {account.account_type}",
                platform="instagram",
                requires_manual=True
            )

        # Instagram WYMAGA obrazka
        if not image_url:
            return PublishResult(
                success=False,
                error="Instagram wymaga obrazka w każdym poście",
                platform="instagram"
            )

        if not account.instagram_account_id:
            return PublishResult(
                success=False,
                error="Brak instagram_account_id - połącz ponownie konto Instagram",
                platform="instagram"
            )

        if not account.access_token:
            return PublishResult(
                success=False,
                error="Brak access_token - połącz ponownie konto Instagram",
                platform="instagram"
            )

        logger.info(f"📸 Publishing to Instagram: @{account.platform_username} (ID: {account.instagram_account_id})")

        # Użyj social_manager
        result = await social_manager.publish_post(
            platform=SocialPlatform.INSTAGRAM,
            access_token=account.access_token,  # Zaszyfrowany - manager odszyfruje
            content=content,
            image_url=image_url,
            instagram_account_id=account.instagram_account_id
        )

        return PublishResult(
            success=result.success,
            post_id=result.post_id,
            post_url=result.post_url,
            error=result.error,
            platform="instagram"
        )

    # ==================== LINKEDIN ====================

    async def _publish_to_linkedin(
            self,
            account: SocialAccount,
            content: str,
            image_url: Optional[str]
    ) -> PublishResult:
        """
        Publikuj na LinkedIn Profile lub Company Page.

        Wymaga:
        - platform_user_id: URN użytkownika lub firmy
        - access_token: Access Token (zaszyfrowany)
        """
        # Walidacja typu konta
        if account.account_type not in ("linkedin_profile", "linkedin_company"):
            return PublishResult(
                success=False,
                error=f"LinkedIn auto-publish wymaga profile/company, nie {account.account_type}",
                platform="linkedin",
                requires_manual=True
            )

        if not account.platform_user_id:
            return PublishResult(
                success=False,
                error="Brak platform_user_id - połącz ponownie konto LinkedIn",
                platform="linkedin"
            )

        if not account.access_token:
            return PublishResult(
                success=False,
                error="Brak access_token - połącz ponownie konto LinkedIn",
                platform="linkedin"
            )

        logger.info(f"💼 Publishing to LinkedIn: {account.platform_username} ({account.account_type})")

        # Przygotuj author URN
        if account.account_type == "linkedin_company":
            author_urn = f"urn:li:organization:{account.platform_user_id}"
        else:
            author_urn = f"urn:li:person:{account.platform_user_id}"

        # Użyj social_manager
        result = await social_manager.publish_post(
            platform=SocialPlatform.LINKEDIN,
            access_token=account.access_token,  # Zaszyfrowany - manager odszyfruje
            content=content,
            image_url=image_url,
            author_urn=author_urn
        )

        return PublishResult(
            success=result.success,
            post_id=result.post_id,
            post_url=result.post_url,
            error=result.error,
            platform="linkedin"
        )

    # ==================== BULK OPERATIONS ====================

    async def publish_approved_items(
            self,
            config_id: Optional[int] = None,
            user_id: Optional[int] = None,
            limit: int = 10
    ) -> Tuple[int, int, List[Dict[str, Any]]]:
        """
        Opublikuj zatwierdzone elementy, których scheduled_for minął.

        Returns:
            (published_count, failed_count, results)
        """
        now = datetime.utcnow()

        query = (
            select(AutopilotQueueItem)
            .where(AutopilotQueueItem.status == "approved")
            .where(AutopilotQueueItem.scheduled_for <= now)
            .order_by(AutopilotQueueItem.scheduled_for.asc())
            .limit(limit)
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
                "requires_manual": pub_result.requires_manual,
            })

            if pub_result.success:
                published += 1
            else:
                failed += 1

        return published, failed, results

    async def retry_failed_items(
            self,
            config_id: int,
            user_id: int,
            max_attempts: int = 3
    ) -> Tuple[int, int]:
        """
        Ponów próbę publikacji dla nieudanych postów.

        Returns:
            (success_count, still_failed_count)
        """
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
            # Reset status do approved
            item.status = "approved"

            pub_result = await self.publish_queue_item(item, force=True)

            if pub_result.success:
                success += 1
            else:
                failed += 1

        return success, failed

    async def get_failed_items(
            self,
            config_id: int,
            user_id: int,
            limit: int = 20
    ) -> List[AutopilotQueueItem]:
        """Pobierz nieudane publikacje."""
        result = await self.db.execute(
            select(AutopilotQueueItem)
            .where(AutopilotQueueItem.config_id == config_id)
            .where(AutopilotQueueItem.user_id == user_id)
            .where(AutopilotQueueItem.status == "failed")
            .order_by(AutopilotQueueItem.updated_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    # ==================== MANUAL PUBLISH HELPERS ====================

    async def prepare_for_manual_publish(
            self,
            item: AutopilotQueueItem
    ) -> Dict[str, Any]:
        """
        Przygotuj dane do ręcznej publikacji (dla kont osobistych).

        Zwraca dict z treścią, hashtagami i linkami do platform.
        """
        hashtags_str = ""
        if item.hashtags:
            hashtags_str = " ".join(f"#{tag.lstrip('#')}" for tag in item.hashtags)

        full_content = item.content
        if hashtags_str:
            full_content = f"{item.content}\n\n{hashtags_str}"

        # Linki do platform
        platform_links = {
            "facebook": "https://www.facebook.com/",
            "instagram": "https://www.instagram.com/",
            "linkedin": "https://www.linkedin.com/feed/",
        }

        return {
            "content": item.content,
            "full_content": full_content,
            "hashtags": item.hashtags or [],
            "hashtags_string": hashtags_str,
            "image_url": item.image_url,
            "platform": item.platform,
            "platform_link": platform_links.get(item.platform, ""),
            "instructions": self._get_manual_publish_instructions(item.platform),
        }

    def _get_manual_publish_instructions(self, platform: str) -> str:
        """Instrukcje do ręcznej publikacji."""
        instructions = {
            "facebook": (
                "1. Kliknij 'Skopiuj treść'\n"
                "2. Otwórz Facebook\n"
                "3. Kliknij 'Co słychać?' na swoim profilu\n"
                "4. Wklej skopiowaną treść\n"
                "5. Dodaj zdjęcie jeśli potrzebne\n"
                "6. Kliknij 'Opublikuj'"
            ),
            "instagram": (
                "1. Kliknij 'Skopiuj treść'\n"
                "2. Otwórz aplikację Instagram\n"
                "3. Kliknij + aby dodać nowy post\n"
                "4. Wybierz zdjęcie\n"
                "5. Wklej skopiowaną treść jako opis\n"
                "6. Kliknij 'Udostępnij'"
            ),
            "linkedin": (
                "1. Kliknij 'Skopiuj treść'\n"
                "2. Otwórz LinkedIn\n"
                "3. Kliknij 'Rozpocznij post'\n"
                "4. Wklej skopiowaną treść\n"
                "5. Dodaj zdjęcie jeśli potrzebne\n"
                "6. Kliknij 'Opublikuj'"
            ),
        }
        return instructions.get(platform, "Skopiuj treść i opublikuj ręcznie na platformie.")


def get_publish_service(db: AsyncSession) -> PublishService:
    """Factory function dla PublishService."""
    return PublishService(db)