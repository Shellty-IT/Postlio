# postlio_backend/app/services/social/manager.py
"""
Manager do zarządzania serwisami social media.
Wzorzec podobny do AI manager.
"""

from typing import Dict, Optional, List
from datetime import datetime
import logging

from .base import (
    BaseSocialService,
    SocialPlatform,
    OAuthResult,
    PublishResult,
    AccountInfo,
)
from .facebook import FacebookService, facebook_service
from .instagram import InstagramService, instagram_service
from .linkedin import LinkedInService, linkedin_service
from .encryption import token_encryption

logger = logging.getLogger(__name__)


class SocialManager:
    """
    Centralny manager do obsługi wszystkich platform social media.

    Zapewnia:
    - Jednolity interfejs dla wszystkich platform
    - Wybór platformy na podstawie enum
    - Szyfrowanie/deszyfrowanie tokenów
    - Walidację i odświeżanie tokenów
    """

    def __init__(self):
        self._services: Dict[SocialPlatform, BaseSocialService] = {
            SocialPlatform.FACEBOOK: facebook_service,
            SocialPlatform.INSTAGRAM: instagram_service,
            SocialPlatform.LINKEDIN: linkedin_service,
        }
        self.logger = logging.getLogger(f"{__name__}.SocialManager")

    def get_service(self, platform: SocialPlatform) -> BaseSocialService:
        """Pobiera serwis dla danej platformy."""
        service = self._services.get(platform)
        if not service:
            raise ValueError(f"Unsupported platform: {platform}")
        return service

    def get_available_platforms(self) -> List[Dict[str, str]]:
        """Zwraca listę dostępnych platform z konfiguracją."""
        platforms = []

        for platform, service in self._services.items():
            is_configured = False

            if platform == SocialPlatform.FACEBOOK:
                is_configured = bool(service.app_id and service.app_secret)
            elif platform == SocialPlatform.INSTAGRAM:
                is_configured = bool(service.app_id and service.app_secret)
            elif platform == SocialPlatform.LINKEDIN:
                is_configured = bool(service.client_id and service.client_secret)

            platforms.append({
                "platform": platform.value,
                "name": platform.value.title(),
                "is_configured": is_configured
            })

        return platforms

    # ==================== OAuth ====================

    def get_authorization_url(self, platform: SocialPlatform, state: str) -> str:
        """Generuje URL autoryzacji dla platformy."""
        service = self.get_service(platform)
        return service.get_authorization_url(state)

    async def exchange_code_for_token(
            self,
            platform: SocialPlatform,
            code: str
    ) -> OAuthResult:
        """Wymienia kod autoryzacji na token."""
        service = self.get_service(platform)
        return await service.exchange_code_for_token(code)

    async def refresh_token(
            self,
            platform: SocialPlatform,
            refresh_token: str
    ) -> OAuthResult:
        """Odświeża access token."""
        service = self.get_service(platform)

        # Odszyfruj token jeśli zaszyfrowany
        decrypted_token = self.decrypt_token(refresh_token)

        result = await service.refresh_access_token(decrypted_token)

        # Zaszyfruj nowy token przed zwróceniem
        if result.success and result.access_token:
            result.access_token = self.encrypt_token(result.access_token)
            if result.refresh_token:
                result.refresh_token = self.encrypt_token(result.refresh_token)

        return result

    async def validate_token(
            self,
            platform: SocialPlatform,
            access_token: str
    ) -> bool:
        """Sprawdza czy token jest ważny."""
        service = self.get_service(platform)
        decrypted_token = self.decrypt_token(access_token)
        return await service.validate_token(decrypted_token)

    # ==================== Account Info ====================

    async def get_account_info(
            self,
            platform: SocialPlatform,
            access_token: str
    ) -> Optional[AccountInfo]:
        """Pobiera informacje o koncie."""
        service = self.get_service(platform)
        decrypted_token = self.decrypt_token(access_token)
        return await service.get_account_info(decrypted_token)

    # ==================== Publishing ====================

    async def publish_post(
            self,
            platform: SocialPlatform,
            access_token: str,
            content: str,
            image_url: Optional[str] = None,
            link_url: Optional[str] = None,
            **kwargs
    ) -> PublishResult:
        """
        Publikuje post na platformie.

        Args:
            platform: Platforma docelowa
            access_token: Zaszyfrowany access token
            content: Treść posta
            image_url: URL do obrazka
            link_url: URL linku
            **kwargs: Dodatkowe parametry per platforma
                - page_id: dla Facebook
                - instagram_account_id: dla Instagram
                - author_urn: dla LinkedIn
        """
        service = self.get_service(platform)
        decrypted_token = self.decrypt_token(access_token)

        self.logger.info(f"Publishing to {platform.value}")

        result = await service.publish_post(
            access_token=decrypted_token,
            content=content,
            image_url=image_url,
            link_url=link_url,
            **kwargs
        )

        if result.success:
            self.logger.info(f"Published successfully to {platform.value}: {result.post_id}")
        else:
            self.logger.error(f"Publish failed to {platform.value}: {result.error}")

        return result

    # ==================== Token Encryption ====================

    def encrypt_token(self, token: str) -> str:
        """Szyfruje token do przechowywania w bazie."""
        if not token:
            return ""
        try:
            return token_encryption.encrypt(token)
        except Exception as e:
            self.logger.error(f"Failed to encrypt token: {e}")
            # W dev mode zwróć niezaszyfrowany (NIGDY w produkcji!)
            return token

    def decrypt_token(self, encrypted_token: str) -> str:
        """Deszyfruje token z bazy."""
        if not encrypted_token:
            return ""
        try:
            return token_encryption.decrypt(encrypted_token)
        except ValueError:
            # Token może być niezaszyfrowany (stare dane lub dev mode)
            self.logger.warning("Token appears to be unencrypted")
            return encrypted_token
        except Exception as e:
            self.logger.error(f"Failed to decrypt token: {e}")
            return encrypted_token

    # ==================== Facebook Specific ====================

    async def get_facebook_pages(self, access_token: str) -> List[Dict]:
        """Pobiera strony Facebook użytkownika."""
        decrypted_token = self.decrypt_token(access_token)
        return await facebook_service.get_user_pages(decrypted_token)

    # ==================== Token Status ====================

    def get_token_status(self, expires_at: Optional[datetime]) -> str:
        """Określa status tokena na podstawie daty wygaśnięcia."""
        if not expires_at:
            return "unknown"

        now = datetime.utcnow()

        if expires_at < now:
            return "expired"
        elif expires_at < now + timedelta(days=7):
            return "expiring_soon"
        else:
            return "valid"


# Potrzebny import dla get_token_status
from datetime import timedelta

# Globalna instancja
social_manager = SocialManager()