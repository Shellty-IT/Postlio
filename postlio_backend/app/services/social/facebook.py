# postlio_backend/app/services/social/facebook.py
"""
Facebook Graph API integration.

Dokumentacja: https://developers.facebook.com/docs/graph-api/
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
    MediaUploadResult,
)


class FacebookService(BaseSocialService):
    """
    Serwis do integracji z Facebook Graph API.

    Obsługuje:
    - OAuth 2.0 flow
    - Publikację na strony Facebook
    - Pobieranie informacji o koncie
    - Zarządzanie tokenami

    WAŻNE:
    - Do publikacji potrzebny jest Page Access Token (nie User Access Token)
    - User Access Token służy do uzyskania Page Access Token
    """

    platform = SocialPlatform.FACEBOOK

    # API endpoints
    GRAPH_URL = "https://graph.facebook.com"
    OAUTH_URL = "https://www.facebook.com"

    # Wymagane uprawnienia
    # https://developers.facebook.com/docs/permissions/reference
    REQUIRED_SCOPES = [
        "public_profile",  # Podstawowe info o użytkowniku
        "email",  # Email użytkownika
        "pages_show_list",  # Lista stron użytkownika
        "pages_read_engagement",  # Odczyt statystyk strony
        "pages_manage_posts",  # Publikacja na stronach
        "pages_read_user_content",  # Odczyt treści strony
    ]

    def __init__(self):
        super().__init__()
        self.api_version = settings.FACEBOOK_API_VERSION
        self.app_id = settings.FACEBOOK_APP_ID
        self.app_secret = settings.FACEBOOK_APP_SECRET
        self.redirect_uri = settings.facebook_redirect_uri

        if not self.app_id or not self.app_secret:
            self.logger.warning(
                "Facebook App ID or Secret not configured. "
                "Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET in .env"
            )

    @property
    def _graph_base(self) -> str:
        """Bazowy URL dla Graph API z wersją."""
        return f"{self.GRAPH_URL}/{self.api_version}"

    # ==================== OAuth ====================

    def get_authorization_url(self, state: str) -> str:
        """
        Generuje URL do autoryzacji Facebook OAuth.

        Args:
            state: CSRF token

        Returns:
            URL do przekierowania użytkownika
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
        """
        if not self.app_id or not self.app_secret:
            return OAuthResult(
                success=False,
                platform=self.platform,
                error="configuration_error",
                error_description="Facebook App not configured"
            )

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                # 1. Wymiana kodu na short-lived token
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

                # 2. Wymiana na long-lived token (60 dni)
                long_lived_result = await self._exchange_for_long_lived_token(client, short_lived_token)
                if not long_lived_result["success"]:
                    return OAuthResult(
                        success=False,
                        platform=self.platform,
                        error="token_exchange_failed",
                        error_description="Failed to get long-lived token"
                    )

                access_token = long_lived_result["access_token"]
                expires_in = long_lived_result.get("expires_in", 5184000)  # 60 dni domyślnie

                # 3. Pobierz informacje o użytkowniku
                user_info = await self._get_user_info(client, access_token)

                return OAuthResult(
                    success=True,
                    platform=self.platform,
                    access_token=access_token,
                    expires_at=datetime.utcnow() + timedelta(seconds=expires_in),
                    platform_user_id=user_info.get("id"),
                    platform_username=user_info.get("name"),
                    profile_data=user_info
                )

            except httpx.RequestError as e:
                self._log_error("Facebook API request failed", e)
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

    async def _exchange_for_long_lived_token(
            self,
            client: httpx.AsyncClient,
            short_lived_token: str
    ) -> Dict[str, Any]:
        """Wymienia short-lived token na long-lived (60 dni)."""
        response = await client.get(
            f"{self._graph_base}/oauth/access_token",
            params={
                "grant_type": "fb_exchange_token",
                "client_id": self.app_id,
                "client_secret": self.app_secret,
                "fb_exchange_token": short_lived_token,
            }
        )

        self._log_api_call("GET", "/oauth/access_token (long-lived)", response.status_code)

        if response.status_code == 200:
            data = response.json()
            return {"success": True, **data}
        else:
            return {"success": False}

    async def _get_user_info(
            self,
            client: httpx.AsyncClient,
            access_token: str
    ) -> Dict[str, Any]:
        """Pobiera podstawowe informacje o użytkowniku."""
        response = await client.get(
            f"{self._graph_base}/me",
            params={
                "access_token": access_token,
                "fields": "id,name,email,picture"
            }
        )

        self._log_api_call("GET", "/me", response.status_code)

        if response.status_code == 200:
            return response.json()
        return {}

    async def refresh_access_token(self, refresh_token: str) -> OAuthResult:
        """
        Facebook nie używa refresh tokenów w tradycyjny sposób.
        Long-lived tokeny można tylko ponownie wymienić przed wygaśnięciem.
        """
        # Dla Facebook, "refresh" oznacza wymianę istniejącego ważnego tokena
        # na nowy long-lived token
        async with httpx.AsyncClient(timeout=30.0) as client:
            result = await self._exchange_for_long_lived_token(client, refresh_token)

            if result["success"]:
                return OAuthResult(
                    success=True,
                    platform=self.platform,
                    access_token=result["access_token"],
                    expires_at=datetime.utcnow() + timedelta(seconds=result.get("expires_in", 5184000))
                )
            else:
                return OAuthResult(
                    success=False,
                    platform=self.platform,
                    error="refresh_failed",
                    error_description="Token refresh failed - user may need to re-authorize"
                )

    async def validate_token(self, access_token: str) -> bool:
        """Sprawdza czy token jest wciąż ważny."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{self._graph_base}/debug_token",
                params={
                    "input_token": access_token,
                    "access_token": f"{self.app_id}|{self.app_secret}"  # App token
                }
            )

            if response.status_code == 200:
                data = response.json().get("data", {})
                return data.get("is_valid", False)
            return False

    # ==================== Account Info ====================

    async def get_account_info(self, access_token: str) -> Optional[AccountInfo]:
        """Pobiera informacje o koncie Facebook."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Pobierz info o użytkowniku
            user_response = await client.get(
                f"{self._graph_base}/me",
                params={
                    "access_token": access_token,
                    "fields": "id,name,email,picture.width(200)"
                }
            )

            if user_response.status_code != 200:
                return None

            user_data = user_response.json()

            # Pobierz listę stron użytkownika
            pages = await self.get_user_pages(access_token)

            return AccountInfo(
                platform=self.platform,
                platform_user_id=user_data.get("id", ""),
                username=user_data.get("name", ""),
                name=user_data.get("name"),
                avatar_url=user_data.get("picture", {}).get("data", {}).get("url"),
                is_business=len(pages) > 0,
                permissions=self.REQUIRED_SCOPES
            )

    async def get_user_pages(self, access_token: str) -> List[Dict[str, Any]]:
        """
        Pobiera listę stron Facebook, którymi użytkownik zarządza.

        Returns:
            Lista stron z ich access tokenami
        """
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{self._graph_base}/me/accounts",
                params={
                    "access_token": access_token,
                    "fields": "id,name,access_token,picture,fan_count,category"
                }
            )

            self._log_api_call("GET", "/me/accounts", response.status_code)

            if response.status_code == 200:
                return response.json().get("data", [])
            return []

    # ==================== Publishing ====================

    async def publish_post(
            self,
            access_token: str,
            content: str,
            image_url: Optional[str] = None,
            link_url: Optional[str] = None,
            page_id: Optional[str] = None,
            **kwargs
    ) -> PublishResult:
        """
        Publikuje post na stronie Facebook.

        WAŻNE: access_token musi być Page Access Token, nie User Access Token!

        Args:
            access_token: Page Access Token
            content: Treść posta
            image_url: URL do obrazka (opcjonalnie)
            link_url: URL linku (opcjonalnie)
            page_id: ID strony (wymagane)
        """
        if not page_id:
            return PublishResult(
                success=False,
                platform=self.platform,
                error="missing_page_id",
                error_code="VALIDATION_ERROR"
            )

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                if image_url:
                    # Post ze zdjęciem
                    result = await self._publish_photo_post(
                        client, access_token, page_id, content, image_url
                    )
                elif link_url:
                    # Post z linkiem
                    result = await self._publish_link_post(
                        client, access_token, page_id, content, link_url
                    )
                else:
                    # Zwykły post tekstowy
                    result = await self._publish_text_post(
                        client, access_token, page_id, content
                    )

                return result

            except httpx.RequestError as e:
                self._log_error("Publish request failed", e)
                return PublishResult(
                    success=False,
                    platform=self.platform,
                    error=str(e),
                    error_code="REQUEST_ERROR"
                )

    async def _publish_text_post(
            self,
            client: httpx.AsyncClient,
            access_token: str,
            page_id: str,
            content: str
    ) -> PublishResult:
        """Publikuje post tekstowy."""
        response = await client.post(
            f"{self._graph_base}/{page_id}/feed",
            data={
                "message": content,
                "access_token": access_token
            }
        )

        self._log_api_call("POST", f"/{page_id}/feed", response.status_code)

        return self._parse_publish_response(response)

    async def _publish_photo_post(
            self,
            client: httpx.AsyncClient,
            access_token: str,
            page_id: str,
            content: str,
            image_url: str
    ) -> PublishResult:
        """Publikuje post ze zdjęciem."""
        response = await client.post(
            f"{self._graph_base}/{page_id}/photos",
            data={
                "url": image_url,  # URL do zdjęcia
                "caption": content,
                "access_token": access_token
            }
        )

        self._log_api_call("POST", f"/{page_id}/photos", response.status_code)

        return self._parse_publish_response(response)

    async def _publish_link_post(
            self,
            client: httpx.AsyncClient,
            access_token: str,
            page_id: str,
            content: str,
            link_url: str
    ) -> PublishResult:
        """Publikuje post z linkiem."""
        response = await client.post(
            f"{self._graph_base}/{page_id}/feed",
            data={
                "message": content,
                "link": link_url,
                "access_token": access_token
            }
        )

        self._log_api_call("POST", f"/{page_id}/feed (link)", response.status_code)

        return self._parse_publish_response(response)

    def _parse_publish_response(self, response: httpx.Response) -> PublishResult:
        """Parsuje odpowiedź z publikacji."""
        data = response.json()

        if response.status_code == 200:
            post_id = data.get("id") or data.get("post_id")
            return PublishResult(
                success=True,
                platform=self.platform,
                post_id=post_id,
                post_url=f"https://facebook.com/{post_id}" if post_id else None,
                raw_response=data
            )
        else:
            error = data.get("error", {})
            return PublishResult(
                success=False,
                platform=self.platform,
                error=error.get("message", "Unknown error"),
                error_code=str(error.get("code", "UNKNOWN")),
                raw_response=data
            )


# Globalna instancja
facebook_service = FacebookService()