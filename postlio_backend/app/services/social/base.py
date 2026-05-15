# app/services/social/base.py
"""
Bazowa klasa dla serwisów social media.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any, List
import logging

logger = logging.getLogger(__name__)


class SocialPlatform(str, Enum):
    """Obsługiwane platformy social media."""
    FACEBOOK = "facebook"
    INSTAGRAM = "instagram"
    LINKEDIN = "linkedin"
    GOOGLE = "google"  # Tylko do logowania, nie do publikacji


@dataclass
class OAuthResult:
    """Wynik OAuth flow."""
    success: bool
    platform: SocialPlatform
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    expires_at: Optional[datetime] = None
    platform_user_id: Optional[str] = None
    platform_username: Optional[str] = None
    profile_data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    error_description: Optional[str] = None

    # === NOWE POLA - Typ konta ===
    account_type: Optional[str] = None
    is_business_account: bool = False
    supports_auto_publish: bool = False
    supports_autopilot: bool = False

    # Dla kont firmowych - dodatkowe dane
    page_id: Optional[str] = None
    page_name: Optional[str] = None
    page_access_token: Optional[str] = None

    # Dla Instagram
    instagram_account_id: Optional[str] = None
    instagram_account_type: Optional[str] = None

    # Dla LinkedIn Company
    organization_id: Optional[str] = None
    organization_name: Optional[str] = None

    # Komunikat dla UI
    upgrade_message: Optional[str] = None

    # Dla OAuth Login (Google/Facebook)
    email: Optional[str] = None
    email_verified: bool = False


@dataclass
class PublishResult:
    """Wynik publikacji posta."""
    success: bool
    platform: SocialPlatform
    post_id: Optional[str] = None
    post_url: Optional[str] = None
    error: Optional[str] = None
    error_code: Optional[str] = None
    raw_response: Optional[Dict[str, Any]] = None

    # Dla kont osobistych - instrukcje ręcznej publikacji
    requires_manual_publish: bool = False
    share_dialog_url: Optional[str] = None
    deeplink_url: Optional[str] = None
    manual_instructions: Optional[List[str]] = None


@dataclass
class MediaUploadResult:
    """Wynik uploadu mediów."""
    success: bool
    media_id: Optional[str] = None
    media_url: Optional[str] = None
    error: Optional[str] = None


@dataclass
class AccountInfo:
    """Informacje o koncie social media."""
    platform: SocialPlatform
    platform_user_id: str
    username: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    followers_count: Optional[int] = None
    permissions: List[str] = field(default_factory=list)
    email: Optional[str] = None

    # === NOWE POLA - Typ konta ===
    account_type: Optional[str] = None
    is_business: bool = False
    supports_auto_publish: bool = False
    supports_autopilot: bool = False

    # Dla FB Pages
    page_id: Optional[str] = None
    page_name: Optional[str] = None

    # Dla Instagram
    instagram_account_id: Optional[str] = None
    instagram_account_type: Optional[str] = None
    connected_fb_page_id: Optional[str] = None

    # Dla LinkedIn Company
    organization_id: Optional[str] = None
    organization_name: Optional[str] = None

    # Lista dostępnych stron/organizacji
    available_pages: List[Dict[str, Any]] = field(default_factory=list)
    available_organizations: List[Dict[str, Any]] = field(default_factory=list)


class BaseSocialService(ABC):
    """
    Bazowa klasa abstrakcyjna dla serwisów social media.
    """

    platform: SocialPlatform

    def __init__(self):
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")

    # ==================== OAuth ====================

    @abstractmethod
    def get_authorization_url(self, state: str) -> str:
        """Generuje URL do autoryzacji OAuth."""
        pass

    @abstractmethod
    async def exchange_code_for_token(self, code: str) -> OAuthResult:
        """Wymienia authorization code na access token."""
        pass

    @abstractmethod
    async def refresh_access_token(self, refresh_token: str) -> OAuthResult:
        """Odświeża access token."""
        pass

    @abstractmethod
    async def validate_token(self, access_token: str) -> bool:
        """Sprawdza czy token jest ważny."""
        pass

    # ==================== Account Info ====================

    @abstractmethod
    async def get_account_info(self, access_token: str) -> Optional[AccountInfo]:
        """Pobiera informacje o koncie."""
        pass

    # ==================== Publishing ====================

    @abstractmethod
    async def publish_post(
            self,
            access_token: str,
            content: str,
            image_url: Optional[str] = None,
            link_url: Optional[str] = None,
            **kwargs
    ) -> PublishResult:
        """Publikuje post na platformie."""
        pass

    # ==================== Helpers ====================

    def _log_api_call(self, method: str, endpoint: str, status: int):
        """Loguje wywołanie API."""
        self.logger.debug(f"{method} {endpoint} -> {status}")

    def _log_error(self, message: str, error: Optional[Exception] = None):
        """Loguje błąd."""
        if error:
            self.logger.error(f"{message}: {error}")
        else:
            self.logger.error(message)