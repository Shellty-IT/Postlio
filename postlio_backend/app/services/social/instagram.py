"""
Instagram Graph API integration.

Automatycznie wykrywa typ konta:
- instagram_business: Konto biznesowe Instagram
- instagram_creator: Konto twórcy Instagram
- instagram_personal: Brak konta Business/Creator (ręczna publikacja)

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

    Automatyczne wykrywanie typu konta:
    - Sprawdza instagram_business_account dla każdej strony FB
    - Jeśli znaleziono → instagram_business lub instagram_creator
    - Jeśli nie → instagram_personal (ręczna publikacja)
    """

    platform = SocialPlatform.INSTAGRAM

    GRAPH_URL = "https://graph.facebook.com"
    OAUTH_URL = "https://www.facebook.com"

    REQUIRED_SCOPES = [
        "public_profile",
        "email",
        "pages_show_list",
        "pages_read_engagement",
        "pages_manage_posts",
        "instagram_basic",
        "instagram_content_publish",
        "instagram_manage_insights",
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
        return f"{self.GRAPH_URL}/{self.api_version}"

    # ==================== OAuth ====================

    def get_authorization_url(self, state: str) -> str:
        """Generuje URL do autoryzacji (przez Facebook OAuth)."""
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
        Automatycznie wykrywa typ konta Instagram.
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
                # 1. Wymiana kodu na token
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

                # 3. Pobierz info o użytkowniku FB
                user_info = await self._get_fb_user_info(client, access_token)

                # 4. === KLUCZOWE: Wykryj typ konta Instagram ===
                ig_account = await self._get_instagram_business_account(client, access_token)

                if ig_account:
                    # Znaleziono konto Business/Creator
                    ig_type = ig_account.get("account_type", "BUSINESS")

                    if ig_type == "CREATOR":
                        account_type = "instagram_creator"
                    else:
                        account_type = "instagram_business"

                    return OAuthResult(
                        success=True,
                        platform=self.platform,
                        access_token=access_token,
                        expires_at=datetime.utcnow() + timedelta(seconds=expires_in),
                        platform_user_id=ig_account.get("id"),
                        platform_username=ig_account.get("username"),
                        profile_data={
                            "fb_user": user_info,
                            "instagram": ig_account,
                        },
                        # Typ konta
                        account_type=account_type,
                        is_business_account=True,
                        supports_auto_publish=True,
                        supports_autopilot=True,
                        # Dane Instagram
                        instagram_account_id=ig_account.get("id"),
                        instagram_account_type=ig_type,
                        page_id=ig_account.get("connected_page_id"),
                        page_name=ig_account.get("connected_page_name"),
                    )
                else:
                    # Brak konta Business/Creator → instagram_personal
                    return OAuthResult(
                        success=True,
                        platform=self.platform,
                        access_token=access_token,
                        expires_at=datetime.utcnow() + timedelta(seconds=expires_in),
                        platform_user_id=user_info.get("id"),
                        platform_username=user_info.get("name"),
                        profile_data=user_info,
                        # Typ konta - osobiste
                        account_type="instagram_personal",
                        is_business_account=False,
                        supports_auto_publish=False,
                        supports_autopilot=False,
                        # Komunikat dla UI
                        upgrade_message=(
                            "Wykryto konto osobiste Instagram. "
                            "Automatyczna publikacja wymaga konta Instagram Business lub Creator "
                            "połączonego ze Stroną Facebook. "
                            "Możesz kopiować treść i publikować ręcznie w aplikacji Instagram."
                        ),
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

    async def _get_fb_user_info(
            self,
            client: httpx.AsyncClient,
            access_token: str
    ) -> Dict[str, Any]:
        """Pobiera info o użytkowniku Facebook."""
        response = await client.get(
            f"{self._graph_base}/me",
            params={
                "access_token": access_token,
                "fields": "id,name,email,picture.width(200)"
            }
        )

        if response.status_code == 200:
            return response.json()
        return {}

    async def _get_instagram_business_account(
            self,
            client: httpx.AsyncClient,
            access_token: str
    ) -> Optional[Dict[str, Any]]:
        """
        Pobiera Instagram Business Account ID.
        Zwraca None jeśli użytkownik nie ma konta Business/Creator.
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
                ig_id = ig_account.get("id")
                ig_response = await client.get(
                    f"{self._graph_base}/{ig_id}",
                    params={
                        "access_token": access_token,
                        "fields": "id,username,name,profile_picture_url,followers_count,media_count,account_type"
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
        """Pobiera informacje o koncie Instagram z wykryciem typu."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            ig_account = await self._get_instagram_business_account(client, access_token)

            if ig_account:
                ig_type = ig_account.get("account_type", "BUSINESS")
                account_type = "instagram_creator" if ig_type == "CREATOR" else "instagram_business"

                return AccountInfo(
                    platform=self.platform,
                    platform_user_id=ig_account.get("id", ""),
                    username=ig_account.get("username", ""),
                    name=ig_account.get("name"),
                    avatar_url=ig_account.get("profile_picture_url"),
                    followers_count=ig_account.get("followers_count"),
                    permissions=self.REQUIRED_SCOPES,
                    # Typ konta
                    account_type=account_type,
                    is_business=True,
                    supports_auto_publish=True,
                    supports_autopilot=True,
                    # Dane Instagram
                    instagram_account_id=ig_account.get("id"),
                    instagram_account_type=ig_type,
                    connected_fb_page_id=ig_account.get("connected_page_id"),
                    page_id=ig_account.get("connected_page_id"),
                    page_name=ig_account.get("connected_page_name"),
                )
            else:
                # Konto osobiste - pobierz podstawowe info z FB
                user_info = await self._get_fb_user_info(client, access_token)

                return AccountInfo(
                    platform=self.platform,
                    platform_user_id=user_info.get("id", ""),
                    username=user_info.get("name", "Instagram User"),
                    name=user_info.get("name"),
                    avatar_url=user_info.get("picture", {}).get("data", {}).get("url"),
                    permissions=self.REQUIRED_SCOPES,
                    # Typ konta - osobiste
                    account_type="instagram_personal",
                    is_business=False,
                    supports_auto_publish=False,
                    supports_autopilot=False,
                )

    # ==================== Publishing ====================

    async def publish_post(
            self,
            access_token: str,
            content: str,
            image_url: Optional[str] = None,
            link_url: Optional[str] = None,
            instagram_account_id: Optional[str] = None,
            account_type: Optional[str] = None,
            **kwargs
    ) -> PublishResult:
        """
        Publikuje post na Instagram.

        Dla instagram_business/creator: Automatyczna publikacja przez API
        Dla instagram_personal: Zwraca instrukcje ręcznej publikacji
        """
        # Sprawdź czy to konto osobiste
        if account_type == "instagram_personal":
            return self._generate_manual_publish_result(content, image_url)

        # Standardowa walidacja dla kont business
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

    def _generate_manual_publish_result(
            self,
            content: str,
            image_url: Optional[str] = None
    ) -> PublishResult:
        """
        Generuje wynik dla ręcznej publikacji (konta osobiste).
        Instagram nie ma Share Dialog - tylko deeplink do aplikacji.
        """
        instructions = [
            "1. Skopiuj treść posta",
            "2. Otwórz aplikację Instagram",
            "3. Utwórz nowy post i wybierz zdjęcie",
            "4. Wklej skopiowaną treść jako opis",
            "5. Opublikuj post",
        ]

        if image_url:
            instructions.insert(0, "0. Pobierz zdjęcie z aplikacji Postlio")

        return PublishResult(
            success=True,
            platform=self.platform,
            requires_manual_publish=True,
            deeplink_url="instagram://camera",
            manual_instructions=instructions,
        )


# Globalna instancja
instagram_service = InstagramService()