# postlio_backend/app/services/social/instagram.py
"""
Instagram Graph API integration.

WAŻNE: Instagram API działa przez Facebook Graph API.
Wymaga:
- Facebook Business/Creator account
- Instagram Business/Creator account połączone z FB Page
- Facebook App z odpowiednimi uprawnieniami

Dokumentacja: https://developers.facebook.com/docs/instagram-api/
"""

import httpx
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from urllib.parse import urlencode

from app.config import settings
from .base import (
    BaseSocialService,
    SocialPlatform,
    OAuthResult,
    PublishResult,
    AccountInfo,
)


class InstagramService(BaseSocialService):
    """
    Serwis do integracji z Instagram Graph API.

    Instagram API wymaga:
    1. Facebook Page połączonej z Instagram Business/Creator Account
    2. User Access Token z odpowiednimi uprawnieniami
    3. Instagram Business Account ID

    Flow publikacji:
    1. Upload media (zdjęcie) -> otrzymujemy creation_id
    2. Publikacja media z creation_id -> post jest widoczny
    """

    platform = SocialPlatform.INSTAGRAM

    # API endpoints (używamy Facebook Graph API)
    GRAPH_URL = "https://graph.facebook.com"
    OAUTH_URL = "https://www.facebook.com"

    # Wymagane uprawnienia (rozszerzenie FB o Instagram)
    REQUIRED_SCOPES = [
        "public_profile",
        "email",
        "pages_show_list",
        "pages_read_engagement",
        "pages_manage_posts",
        "instagram_basic",  # Podstawowy dostęp do IG
        "instagram_content_publish",  # Publikacja na IG
        "instagram_manage_insights",  # Statystyki IG
    ]

    def __init__(self):
        super().__init__()
        self.api_version = settings.FACEBOOK_API_VERSION
        self.app_id = settings.FACEBOOK_APP_ID
        self.app_secret = settings.FACEBOOK_APP_SECRET
        self.redirect_uri = settings.instagram_redirect_uri

        if not self.app_id or not self.app_secret:
            self.logger.warning(
                "Facebook App ID or Secret not configured. "
                "Instagram API requires Facebook App credentials."
            )

    @property
    def _graph_base(self) -> str:
        """Bazowy URL dla Graph API z wersją."""
        return f"{self.GRAPH_URL}/{self.api_version}"

    # ==================== OAuth ====================

    def get_authorization_url(self, state: str) -> str:
        """
        Generuje URL do autoryzacji (przez Facebook OAuth).
        Instagram nie ma osobnego OAuth - używamy Facebook z dodatkowymi scope'ami.
        """
        if not self.app_id:
            raise ValueError("Facebook App ID not configured")

        params = {
            "client_id": self.app_id,
            "redirect_uri": self.redirect_uri,
            "state": state,
            "scope": ",".join(self.REQUIRED_SCOPES),
            "response_type": "code",
        }

        return f"{self.OAUTH_URL}/{self.api_version}/dialog/oauth?{urlencode(params)}"

    async def exchange_code_for_token(self, code: str) -> OAuthResult:
        """
        Wymienia authorization code na access token.
        Następnie pobiera Instagram Business Account ID.
        """
        if not self.app_id or not self.app_secret:
            return OAuthResult(
                success=False,
                platform=self.platform,
                error="configuration_error",
                error_description="Facebook App not configured for Instagram"
            )

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                # 1. Wymiana kodu na token (jak w Facebook)
                response = await client.get(
                    f"{self._graph_base}/oauth/access_token",
                    params={
                        "client_id": self.app_id,
                        "client_secret": self.app_secret,
                        "redirect_uri": self.redirect_uri,
                        "code": code,
                    }
                )

                self._log_api_call("GET", "/oauth/access_token", response.status_code)

                if response.status_code != 200:
                    error_data = response.json()
                    return OAuthResult(
                        success=False,
                        platform=self.platform,
                        error=error_data.get("error", {}).get("type", "unknown"),
                        error_description=error_data.get("error", {}).get("message", "Token exchange failed")
                    )

                token_data = response.json()
                short_lived_token = token_data.get("access_token")

                # 2. Long-lived token
                long_lived_response = await client.get(
                    f"{self._graph_base}/oauth/access_token",
                    params={
                        "grant_type": "fb_exchange_token",
                        "client_id": self.app_id,
                        "client_secret": self.app_secret,
                        "fb_exchange_token": short_lived_token,
                    }
                )

                if long_lived_response.status_code == 200:
                    long_lived_data = long_lived_response.json()
                    access_token = long_lived_data.get("access_token")
                    expires_in = long_lived_data.get("expires_in", 5184000)
                else:
                    access_token = short_lived_token
                    expires_in = 3600

                # 3. Pobierz Instagram Business Account
                ig_account = await self._get_instagram_business_account(client, access_token)

                if not ig_account:
                    return OAuthResult(
                        success=False,
                        platform=self.platform,
                        error="no_instagram_account",
                        error_description="No Instagram Business/Creator account found. "
                                          "Make sure your Instagram is connected to a Facebook Page."
                    )

                return OAuthResult(
                    success=True,
                    platform=self.platform,
                    access_token=access_token,
                    expires_at=datetime.utcnow() + timedelta(seconds=expires_in),
                    platform_user_id=ig_account.get("id"),
                    platform_username=ig_account.get("username"),
                    profile_data=ig_account
                )

            except httpx.RequestError as e:
                self._log_error("Instagram API request failed", e)
                return OAuthResult(
                    success=False,
                    platform=self.platform,
                    error="request_error",
                    error_description=str(e)
                )
            except Exception as e:
                self._log_error("Unexpected error during token exchange", e)
                return OAuthResult(
                    success=False,
                    platform=self.platform,
                    error="unexpected_error",
                    error_description=str(e)
                )

    async def _get_instagram_business_account(
            self,
            client: httpx.AsyncClient,
            access_token: str
    ) -> Optional[Dict[str, Any]]:
        """
        Pobiera Instagram Business Account ID.

        Flow:
        1. Pobierz strony użytkownika (/me/accounts)
        2. Dla każdej strony sprawdź instagram_business_account
        3. Zwróć pierwsze znalezione konto IG
        """
        # Pobierz strony FB
        pages_response = await client.get(
            f"{self._graph_base}/me/accounts",
            params={
                "access_token": access_token,
                "fields": "id,name,instagram_business_account"
            }
        )

        self._log_api_call("GET", "/me/accounts", pages_response.status_code)

        if pages_response.status_code != 200:
            return None

        pages = pages_response.json().get("data", [])

        for page in pages:
            ig_account = page.get("instagram_business_account")
            if ig_account:
                # Pobierz szczegóły konta IG
                ig_id = ig_account.get("id")
                ig_response = await client.get(
                    f"{self._graph_base}/{ig_id}",
                    params={
                        "access_token": access_token,
                        "fields": "id,username,name,profile_picture_url,followers_count,media_count"
                    }
                )

                if ig_response.status_code == 200:
                    ig_data = ig_response.json()
                    ig_data["connected_page_id"] = page.get("id")
                    ig_data["connected_page_name"] = page.get("name")
                    return ig_data

        return None

    async def refresh_access_token(self, refresh_token: str) -> OAuthResult:
        """Odświeża token (jak w Facebook)."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{self._graph_base}/oauth/access_token",
                params={
                    "grant_type": "fb_exchange_token",
                    "client_id": self.app_id,
                    "client_secret": self.app_secret,
                    "fb_exchange_token": refresh_token,
                }
            )

            if response.status_code == 200:
                data = response.json()
                return OAuthResult(
                    success=True,
                    platform=self.platform,
                    access_token=data.get("access_token"),
                    expires_at=datetime.utcnow() + timedelta(seconds=data.get("expires_in", 5184000))
                )
            else:
                return OAuthResult(
                    success=False,
                    platform=self.platform,
                    error="refresh_failed",
                    error_description="Token refresh failed"
                )

    async def validate_token(self, access_token: str) -> bool:
        """Sprawdza czy token jest ważny."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{self._graph_base}/debug_token",
                params={
                    "input_token": access_token,
                    "access_token": f"{self.app_id}|{self.app_secret}"
                }
            )

            if response.status_code == 200:
                data = response.json().get("data", {})
                return data.get("is_valid", False)
            return False

    # ==================== Account Info ====================

    async def get_account_info(self, access_token: str) -> Optional[AccountInfo]:
        """Pobiera informacje o koncie Instagram."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            ig_account = await self._get_instagram_business_account(client, access_token)

            if not ig_account:
                return None

            return AccountInfo(
                platform=self.platform,
                platform_user_id=ig_account.get("id", ""),
                username=ig_account.get("username", ""),
                name=ig_account.get("name"),
                avatar_url=ig_account.get("profile_picture_url"),
                followers_count=ig_account.get("followers_count"),
                is_business=True,
                page_id=ig_account.get("connected_page_id"),
                page_name=ig_account.get("connected_page_name"),
                permissions=self.REQUIRED_SCOPES
            )

    # ==================== Publishing ====================

    async def publish_post(
            self,
            access_token: str,
            content: str,
            image_url: Optional[str] = None,
            link_url: Optional[str] = None,
            instagram_account_id: Optional[str] = None,
            **kwargs
    ) -> PublishResult:
        """
        Publikuje post na Instagram.

        WAŻNE: Instagram wymaga zdjęcia! Nie można opublikować samego tekstu.

        Flow:
        1. POST /{ig-user-id}/media - tworzy "container" z media
        2. POST /{ig-user-id}/media_publish - publikuje container

        Args:
            access_token: User Access Token
            content: Caption (podpis)
            image_url: URL do obrazka (WYMAGANE!)
            instagram_account_id: Instagram Business Account ID
        """
        if not instagram_account_id:
            return PublishResult(
                success=False,
                platform=self.platform,
                error="missing_instagram_account_id",
                error_code="VALIDATION_ERROR"
            )

        if not image_url:
            return PublishResult(
                success=False,
                platform=self.platform,
                error="image_required",
                error_code="VALIDATION_ERROR",
            )

        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                # Step 1: Utwórz media container
                container_response = await client.post(
                    f"{self._graph_base}/{instagram_account_id}/media",
                    data={
                        "image_url": image_url,
                        "caption": content,
                        "access_token": access_token
                    }
                )

                self._log_api_call("POST", f"/{instagram_account_id}/media", container_response.status_code)

                if container_response.status_code != 200:
                    error_data = container_response.json()
                    return PublishResult(
                        success=False,
                        platform=self.platform,
                        error=error_data.get("error", {}).get("message", "Failed to create media container"),
                        error_code=str(error_data.get("error", {}).get("code", "UNKNOWN")),
                        raw_response=error_data
                    )

                container_id = container_response.json().get("id")

                # Step 2: Opublikuj media
                publish_response = await client.post(
                    f"{self._graph_base}/{instagram_account_id}/media_publish",
                    data={
                        "creation_id": container_id,
                        "access_token": access_token
                    }
                )

                self._log_api_call("POST", f"/{instagram_account_id}/media_publish", publish_response.status_code)

                if publish_response.status_code == 200:
                    post_id = publish_response.json().get("id")
                    return PublishResult(
                        success=True,
                        platform=self.platform,
                        post_id=post_id,
                        post_url=f"https://instagram.com/p/{post_id}" if post_id else None,
                        raw_response=publish_response.json()
                    )
                else:
                    error_data = publish_response.json()
                    return PublishResult(
                        success=False,
                        platform=self.platform,
                        error=error_data.get("error", {}).get("message", "Failed to publish"),
                        error_code=str(error_data.get("error", {}).get("code", "UNKNOWN")),
                        raw_response=error_data
                    )

            except httpx.RequestError as e:
                self._log_error("Instagram publish request failed", e)
                return PublishResult(
                    success=False,
                    platform=self.platform,
                    error=str(e),
                    error_code="REQUEST_ERROR"
                )


# Globalna instancja
instagram_service = InstagramService()