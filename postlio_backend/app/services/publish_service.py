"""
Serwis publikacji - publikowanie postów na social media.

Obsługuje dwa tryby:
- AUTO-PUBLISH: Dla kont firmowych (Facebook Pages, Instagram Business/Creator, LinkedIn Company)
- MANUAL-ASSIST: Dla kont osobistych (przygotowanie treści, Share Dialog, instrukcje)
"""
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple
from dataclasses import dataclass, field
from urllib.parse import quote

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

    # Dla ręcznej publikacji (konta osobiste)
    requires_manual_publish: bool = False
    share_dialog_url: Optional[str] = None
    deeplink_url: Optional[str] = None
    web_url: Optional[str] = None
    manual_instructions: List[str] = field(default_factory=list)

    # Dodatkowe info
    account_type: Optional[str] = None
    is_business_account: bool = True


@dataclass
class ManualPublishData:
    """Dane do ręcznej publikacji dla kont osobistych."""
    platform: str
    account_type: str
    content: str
    full_content: str  # Z hashtagami
    hashtags: List[str]
    hashtags_string: str
    image_url: Optional[str]

    # Linki
    share_dialog_url: Optional[str]
    deeplink_url: Optional[str]
    web_url: str

    # Instrukcje
    instructions: List[str]

    # Status
    requires_image_download: bool = False


class PublishService:
    """
    Serwis do publikowania postów na platformy social media.

    Obsługuje:
    - AUTO-PUBLISH: Facebook Pages, Instagram Business/Creator, LinkedIn Company
    - MANUAL-ASSIST: Konta osobiste (przygotowanie treści do ręcznej publikacji)
    """

    # === TYPY KONT ===

    # Konta wspierające automatyczną publikację (FIRMOWE)
    AUTO_PUBLISH_ACCOUNT_TYPES = {
        "facebook_page",
        "instagram_business",
        "instagram_creator",
        "linkedin_company",
    }

    # Konta wymagające ręcznej publikacji (OSOBISTE)
    MANUAL_PUBLISH_ACCOUNT_TYPES = {
        "facebook_personal",
        "instagram_personal",
        "linkedin_personal",
        "linkedin_profile",  # Alias dla kompatybilności wstecznej
    }

    # Konta obsługujące Share Dialog
    SHARE_DIALOG_ACCOUNT_TYPES = {
        "facebook_personal",
        "linkedin_personal",
        "linkedin_profile",
    }

    # Konta wymagające deeplink (brak Share Dialog)
    DEEPLINK_ONLY_ACCOUNT_TYPES = {
        "instagram_personal",
    }

    def __init__(self, db: AsyncSession):
        self.db = db

    # ==================== ACCOUNT QUERIES ====================

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

        # Fallback - dowolne aktywne konto (w tym osobiste)
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
        """Pobierz wszystkie aktywne konta użytkownika."""
        result = await self.db.execute(
            select(SocialAccount)
            .where(SocialAccount.user_id == user_id)
            .where(SocialAccount.is_active == True)
            .order_by(SocialAccount.platform, SocialAccount.created_at.desc())
        )
        return list(result.scalars().all())

    # ==================== ACCOUNT TYPE CHECKS ====================

    def can_auto_publish(self, account: SocialAccount) -> bool:
        """Sprawdź czy konto wspiera automatyczną publikację."""
        return account.account_type in self.AUTO_PUBLISH_ACCOUNT_TYPES

    def is_personal_account(self, account: SocialAccount) -> bool:
        """Sprawdź czy to konto osobiste."""
        return account.account_type in self.MANUAL_PUBLISH_ACCOUNT_TYPES

    def supports_share_dialog(self, account: SocialAccount) -> bool:
        """Sprawdź czy konto obsługuje Share Dialog."""
        return account.account_type in self.SHARE_DIALOG_ACCOUNT_TYPES

    def requires_deeplink_only(self, account: SocialAccount) -> bool:
        """Sprawdź czy konto wymaga tylko deeplink (Instagram osobisty)."""
        return account.account_type in self.DEEPLINK_ONLY_ACCOUNT_TYPES

    def get_account_capabilities(self, account: SocialAccount) -> Dict[str, Any]:
        """Pobierz możliwości konta."""
        is_business = self.can_auto_publish(account)
        return {
            "is_business_account": is_business,
            "supports_auto_publish": is_business,
            "supports_autopilot": is_business,
            "supports_scheduling": is_business,
            "supports_share_dialog": self.supports_share_dialog(account),
            "requires_manual_publish": not is_business,
            "requires_image": account.requires_image,
            "publish_method": "auto" if is_business else self._get_publish_method(account),
        }

    def _get_publish_method(self, account: SocialAccount) -> str:
        """Określ metodę publikacji dla konta osobistego."""
        if self.supports_share_dialog(account):
            return "share_dialog"
        elif self.requires_deeplink_only(account):
            return "manual_copy"
        return "manual_copy"

    # ==================== VALIDATION ====================

    async def validate_social_accounts_for_config(
            self,
            config: AutopilotConfig
    ) -> Dict[str, Dict[str, Any]]:
        """
        Sprawdź status kont social dla wszystkich platform w konfiguracji.

        WAŻNE: Autopilot wymaga kont firmowych!
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
                    "is_business_account": False,
                    "account_type": None,
                    "message": f"Brak połączonego konta {platform}"
                }
            elif not account.is_active:
                result[platform] = {
                    "status": "inactive",
                    "can_auto_publish": False,
                    "is_business_account": False,
                    "account_type": account.account_type,
                    "message": "Konto jest nieaktywne"
                }
            elif account.is_token_expired:
                result[platform] = {
                    "status": "expired",
                    "can_auto_publish": False,
                    "is_business_account": self.can_auto_publish(account),
                    "account_type": account.account_type,
                    "message": "Token wygasł - połącz ponownie"
                }
            elif self.is_personal_account(account):
                # Konto osobiste - nie może być używane w Autopilot
                result[platform] = {
                    "status": "personal_account",
                    "can_auto_publish": False,
                    "is_business_account": False,
                    "account_type": account.account_type,
                    "account_name": account.page_name or account.platform_username,
                    "message": self._get_upgrade_message(platform),
                }
            else:
                # Konto firmowe - pełny dostęp
                result[platform] = {
                    "status": "connected",
                    "can_auto_publish": True,
                    "is_business_account": True,
                    "account_type": account.account_type,
                    "account_name": account.page_name or account.platform_username,
                    "message": "Gotowe do automatycznej publikacji"
                }

        return result

    def _get_upgrade_message(self, platform: str) -> str:
        """Komunikat o potrzebie konta firmowego."""
        messages = {
            "facebook": "Autopilot wymaga Strony Facebook. Podłącz stronę, którą zarządzasz.",
            "instagram": "Autopilot wymaga konta Instagram Business lub Creator połączonego ze Stroną Facebook.",
            "linkedin": "Autopilot wymaga Strony firmowej LinkedIn.",
        }
        return messages.get(platform, "Autopilot wymaga konta firmowego.")

    # ==================== MAIN PUBLISH METHOD ====================

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
            return PublishResult(
                success=False,
                error="Already published",
                platform=item.platform
            )

        if item.status not in ("approved", "scheduled"):
            return PublishResult(
                success=False,
                error=f"Invalid status: {item.status}",
                platform=item.platform
            )

        if not force and item.scheduled_for and item.scheduled_for > now:
            return PublishResult(
                success=False,
                error="Not yet scheduled",
                platform=item.platform
            )

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

        # === KLUCZOWE: Sprawdź typ konta ===
        if self.is_personal_account(social_account):
            # Konto osobiste - NIE można auto-publish z Autopilota
            return PublishResult(
                success=False,
                error=f"Konto osobiste ({social_account.account_type}) nie wspiera automatycznej publikacji",
                platform=item.platform,
                requires_manual_publish=True,
                account_type=social_account.account_type,
                is_business_account=False,
                **self._generate_manual_publish_urls(
                    platform=item.platform,
                    account_type=social_account.account_type,
                    content=item.content,
                    hashtags=item.hashtags,
                )
            )

        if not social_account.is_active:
            item.publish_attempts = (item.publish_attempts or 0) + 1
            item.publish_error = f"Account {item.platform} is inactive"
            item.last_publish_attempt_at = now
            await self.db.flush()
            return PublishResult(
                success=False,
                error=item.publish_error,
                platform=item.platform
            )

        if social_account.is_token_expired:
            item.publish_attempts = (item.publish_attempts or 0) + 1
            item.publish_error = f"Token expired for {item.platform}"
            item.last_publish_attempt_at = now
            await self.db.flush()
            return PublishResult(
                success=False,
                error=item.publish_error,
                platform=item.platform
            )

        # Instagram wymaga obrazka
        if social_account.requires_image and not item.image_url:
            item.publish_attempts = (item.publish_attempts or 0) + 1
            item.publish_error = "Instagram requires an image"
            item.last_publish_attempt_at = now
            await self.db.flush()
            return PublishResult(
                success=False,
                error=item.publish_error,
                platform=item.platform
            )

        # === PUBLIKACJA (tylko dla kont firmowych) ===
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
            return PublishResult(
                success=False,
                error=str(e),
                platform=item.platform
            )

    # ==================== MANUAL PUBLISH HELPERS ====================

    def _generate_manual_publish_urls(
            self,
            platform: str,
            account_type: str,
            content: str,
            hashtags: Optional[List[str]] = None,
            image_url: Optional[str] = None,
            link_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generuj URLs i instrukcje dla ręcznej publikacji."""

        # Przygotuj pełną treść
        full_content = content
        if hashtags:
            hashtag_str = " ".join(f"#{tag.lstrip('#')}" for tag in hashtags)
            full_content = f"{content}\n\n{hashtag_str}"

        result = {
            "share_dialog_url": None,
            "deeplink_url": None,
            "web_url": None,
            "manual_instructions": [],
        }

        if platform == "facebook":
            # Facebook Share Dialog
            result["share_dialog_url"] = (
                f"https://www.facebook.com/sharer/sharer.php"
                f"?quote={quote(full_content[:500])}"
            )
            if link_url:
                result["share_dialog_url"] += f"&u={quote(link_url)}"
            result["deeplink_url"] = "fb://feed"
            result["web_url"] = "https://www.facebook.com"
            result["manual_instructions"] = [
                "1. Kliknij 'Otwórz Facebook' lub skopiuj treść",
                "2. Wklej treść w nowy post",
                "3. Dodaj zdjęcie jeśli potrzebujesz",
                "4. Opublikuj post",
            ]

        elif platform == "instagram":
            # Instagram - tylko deeplink (brak Share Dialog)
            result["deeplink_url"] = "instagram://camera"
            result["web_url"] = "https://www.instagram.com"
            result["manual_instructions"] = [
                "1. Skopiuj treść posta",
                "2. Otwórz aplikację Instagram",
                "3. Utwórz nowy post i wybierz zdjęcie",
                "4. Wklej skopiowaną treść jako opis",
                "5. Opublikuj post",
            ]
            if image_url:
                result["manual_instructions"].insert(0, "0. Pobierz zdjęcie z aplikacji Postlio")

        elif platform == "linkedin":
            # LinkedIn Share Dialog
            result["share_dialog_url"] = (
                f"https://www.linkedin.com/sharing/share-offsite/"
                f"?text={quote(full_content[:500])}"
            )
            if link_url:
                result["share_dialog_url"] += f"&url={quote(link_url)}"
            result["deeplink_url"] = "linkedin://feed"
            result["web_url"] = "https://www.linkedin.com/feed"
            result["manual_instructions"] = [
                "1. Kliknij 'Otwórz LinkedIn' lub skopiuj treść",
                "2. Wklej treść w nowy post",
                "3. Dodaj zdjęcie jeśli potrzebujesz",
                "4. Opublikuj post",
            ]

        return result

    async def prepare_for_manual_publish(
            self,
            item: AutopilotQueueItem,
            account: Optional[SocialAccount] = None
    ) -> ManualPublishData:
        """
        Przygotuj kompletne dane do ręcznej publikacji.
        """
        # Pobierz konto jeśli nie podano
        if not account:
            if item.social_account_id:
                account = await self.get_social_account(item.social_account_id, item.user_id)
            if not account:
                account = await self.get_social_account_for_platform(item.user_id, item.platform)

        account_type = account.account_type if account else f"{item.platform}_personal"

        # Przygotuj treść
        hashtags = item.hashtags or []
        hashtags_string = " ".join(f"#{tag.lstrip('#')}" for tag in hashtags) if hashtags else ""

        full_content = item.content
        if hashtags_string:
            full_content = f"{item.content}\n\n{hashtags_string}"

        # Generuj URLs
        urls = self._generate_manual_publish_urls(
            platform=item.platform,
            account_type=account_type,
            content=item.content,
            hashtags=hashtags,
            image_url=item.image_url,
        )

        return ManualPublishData(
            platform=item.platform,
            account_type=account_type,
            content=item.content,
            full_content=full_content,
            hashtags=hashtags,
            hashtags_string=hashtags_string,
            image_url=item.image_url,
            share_dialog_url=urls["share_dialog_url"],
            deeplink_url=urls["deeplink_url"],
            web_url=urls["web_url"] or "",
            instructions=urls["manual_instructions"],
            requires_image_download=bool(item.image_url) and item.platform == "instagram",
        )

    async def mark_as_manually_published(
            self,
            item: AutopilotQueueItem,
            post_url: Optional[str] = None
    ) -> None:
        """
        Oznacz element jako opublikowany ręcznie.
        Wywoływane gdy użytkownik kliknie "Opublikowałem".
        """
        now = datetime.utcnow()

        item.status = "published"
        item.published_at = now
        item.platform_post_url = post_url
        item.publish_error = None

        # Aktualizuj statystyki (bez post_id bo to ręczna publikacja)
        if item.social_account_id:
            account = await self.get_social_account(item.social_account_id, item.user_id)
            if account:
                account.last_used_at = now

        await self.db.flush()
        logger.info(f"✅ Marked item {item.id} as manually published")

    # ==================== PLATFORM PUBLISHING ====================

    async def _publish_to_platform(
            self,
            social_account: SocialAccount,
            content: str,
            image_url: Optional[str],
            hashtags: List[str]
    ) -> PublishResult:
        """
        Publikuj na konkretną platformę używając prawdziwych API.
        Tylko dla kont firmowych!
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
                return PublishResult(
                    success=False,
                    error=f"Unsupported platform: {platform}",
                    platform=platform
                )

        except Exception as e:
            logger.error(f"Platform publish error: {e}")
            return PublishResult(
                success=False,
                error=str(e),
                platform=platform
            )

    # ==================== FACEBOOK ====================

    async def _publish_to_facebook(
            self,
            account: SocialAccount,
            content: str,
            image_url: Optional[str]
    ) -> PublishResult:
        """Publikuj na Facebook Page używając Graph API."""

        # Walidacja - tylko Facebook Page
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

    # ==================== INSTAGRAM ====================

    async def _publish_to_instagram(
            self,
            account: SocialAccount,
            content: str,
            image_url: Optional[str]
    ) -> PublishResult:
        """Publikuj na Instagram Business/Creator używając Graph API."""

        # Walidacja typu konta
        if account.account_type not in ("instagram_business", "instagram_creator"):
            return PublishResult(
                success=False,
                error=f"Instagram auto-publish wymaga Business/Creator account, nie {account.account_type}",
                platform="instagram",
                requires_manual_publish=True,
                account_type=account.account_type,
                is_business_account=False,
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

    # ==================== LINKEDIN ====================

    async def _publish_to_linkedin(
            self,
            account: SocialAccount,
            content: str,
            image_url: Optional[str]
    ) -> PublishResult:
        """Publikuj na LinkedIn Company Page."""

        # Walidacja typu konta - tylko linkedin_company
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

        logger.info(f"💼 Publishing to LinkedIn Company: {account.platform_username}")

        # URN dla strony firmowej
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

    # ==================== BULK OPERATIONS ====================

    async def publish_approved_items(
            self,
            config_id: Optional[int] = None,
            user_id: Optional[int] = None,
            limit: int = 10
    ) -> Tuple[int, int, List[Dict[str, Any]]]:
        """
        Opublikuj zatwierdzone elementy, których scheduled_for minął.
        Pomija konta osobiste - one wymagają ręcznej publikacji.
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
            self,
            config_id: int,
            user_id: int,
            max_attempts: int = 3
    ) -> Tuple[int, int]:
        """Ponów próbę publikacji dla nieudanych postów."""
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

    async def get_items_requiring_manual_publish(
            self,
            user_id: int,
            limit: int = 20
    ) -> List[AutopilotQueueItem]:
        """
        Pobierz elementy wymagające ręcznej publikacji.
        (Zaplanowane posty dla kont osobistych)
        """
        now = datetime.utcnow()

        # Pobierz elementy scheduled/approved dla kont osobistych
        result = await self.db.execute(
            select(AutopilotQueueItem)
            .join(SocialAccount, AutopilotQueueItem.social_account_id == SocialAccount.id)
            .where(AutopilotQueueItem.user_id == user_id)
            .where(AutopilotQueueItem.status.in_(["scheduled", "approved"]))
            .where(AutopilotQueueItem.scheduled_for <= now)
            .where(SocialAccount.account_type.in_(self.MANUAL_PUBLISH_ACCOUNT_TYPES))
            .order_by(AutopilotQueueItem.scheduled_for.asc())
            .limit(limit)
        )
        return list(result.scalars().all())


def get_publish_service(db: AsyncSession) -> PublishService:
    """Factory function dla PublishService."""
    return PublishService(db)