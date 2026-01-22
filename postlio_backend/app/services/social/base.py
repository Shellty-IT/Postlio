# postlio_backend/app/services/social/base.py
"""
Bazowa klasa dla serwisów social media.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
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


@dataclass
class PublishResult:
    """Wynik publikacji posta."""
    success: bool
    platform: SocialPlatform
    post_id: Optional[str] = None  # ID posta na platformie
    post_url: Optional[str] = None  # URL do posta
    error: Optional[str] = None
    error_code: Optional[str] = None
    raw_response: Optional[Dict[str, Any]] = None


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
    is_business: bool = False
    page_id: Optional[str] = None  # Dla FB Pages
    page_name: Optional[str] = None
    permissions: List[str] = None

    def __post_init__(self):
        if self.permissions is None:
            self.permissions = []


class BaseSocialService(ABC):
    """
    Bazowa klasa abstrakcyjna dla serwisów social media.

    Każda platforma (Facebook, Instagram, LinkedIn) dziedziczy z tej klasy
    i implementuje specyficzne metody.
    """

    platform: SocialPlatform

    def __init__(self):
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")

    # ==================== OAuth ====================

    @abstractmethod
    def get_authorization_url(self, state: str) -> str:
        """
        Generuje URL do autoryzacji OAuth.

        Args:
            state: Unikalny state token (CSRF protection)

        Returns:
            URL do przekierowania użytkownika
        """
        pass

    @abstractmethod
    async def exchange_code_for_token(self, code: str) -> OAuthResult:
        """
        Wymienia authorization code na access token.

        Args:
            code: Authorization code z callback URL

        Returns:
            OAuthResult z tokenami lub błędem
        """
        pass

    @abstractmethod
    async def refresh_access_token(self, refresh_token: str) -> OAuthResult:
        """
        Odświeża access token używając refresh token.

        Args:
            refresh_token: Refresh token

        Returns:
            OAuthResult z nowym access token
        """
        pass

    @abstractmethod
    async def validate_token(self, access_token: str) -> bool:
        """
        Sprawdza czy token jest wciąż ważny.

        Args:
            access_token: Token do sprawdzenia

        Returns:
            True jeśli token jest ważny
        """
        pass

    # ==================== Account Info ====================

    @abstractmethod
    async def get_account_info(self, access_token: str) -> Optional[AccountInfo]:
        """
        Pobiera informacje o koncie.

        Args:
            access_token: Access token użytkownika

        Returns:
            AccountInfo lub None jeśli błąd
        """
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
        """
        Publikuje post na platformie.

        Args:
            access_token: Access token
            content: Treść posta
            image_url: URL do obrazka (opcjonalnie)
            link_url: URL linku (opcjonalnie)
            **kwargs: Dodatkowe parametry per platforma

        Returns:
            PublishResult z ID posta lub błędem
        """
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