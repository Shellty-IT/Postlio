"""
Facebook Graph API integration.

Automatycznie wykrywa typ konta:
- facebook_page: Użytkownik ma strony Facebook (pełny dostęp)
- facebook_personal: Brak stron (ograniczony dostęp, ręczna publikacja)

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
)


class FacebookService(BaseSocialService):
    """
    Serwis do integracji z Facebook Graph API.

    Automatyczne wykrywanie typu konta:
    - Sprawdza /me/accounts po autoryzacji
    - Jeśli użytkownik ma strony → facebook_page (pełny dostęp)
    - Jeśli nie ma stron → facebook_personal (Share Dialog)
    """

    platform = SocialPlatform.FACEBOOK

    # API endpoints
    GRAPH_URL = "https://graph.facebook.com"
    OAUTH_URL = "https://www.facebook.com"

    # Wymagane uprawnienia
    # UWAGA: bez pages_show_list, /me/accounts (patrz _get_user_pages) zawsze
    # zwraca pustą listę, wiec KAZDE konto FB - takze administratora Strony -
    # zostaje sklasyfikowane jako facebook_personal. Te trzy scope'y wymagaja
    # App Review w Meta (poza kontami testowymi/deweloperskimi) - dopoki
    # aplikacja go nie przejdzie, dziala to tylko dla testerow dodanych w
    # Meta for Developers.
    REQUIRED_SCOPES = [
        "public_profile",
        "email",
        "pages_show_list",
        "pages_read_engagement",
        "pages_manage_posts",
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
        """Generuje URL do autoryzacji Facebook OAuth."""
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
        Automatycznie wykrywa typ konta (page vs personal).
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
                expires_in = long_lived_result.get("expires_in", 5184000)

                # 3. Pobierz informacje o użytkowniku
                user_info = await self._get_user_info(client, access_token)

                # 4. === KLUCZOWE: Wykryj typ konta ===
                pages = await self._get_user_pages(client, access_token)

                if pages:
                    # Ma strony → facebook_page
                    # Wybierz pierwszą stronę jako domyślną
                    first_page = pages[0]

                    return OAuthResult(
                        success=True,
                        platform=self.platform,
                        access_token=access_token,
                        expires_at=datetime.utcnow() + timedelta(seconds=expires_in),
                        platform_user_id=user_info.get("id"),
                        platform_username=user_info.get("name"),
                        profile_data={
                            **user_info,
                            "pages": pages,
                        },
                        # Typ konta
                        account_type="facebook_page",
                        is_business_account=True,
                        supports_auto_publish=True,
                        supports_autopilot=True,
                        # Dane strony
                        page_id=first_page.get("id"),
                        page_name=first_page.get("name"),
                        page_access_token=first_page.get("access_token"),
                    )
                else:
                    # Brak stron → facebook_personal
                    return OAuthResult(
                        success=True,
                        platform=self.platform,
                        access_token=access_token,
                        expires_at=datetime.utcnow() + timedelta(seconds=expires_in),
                        platform_user_id=user_info.get("id"),
                        platform_username=user_info.get("name"),
                        profile_data=user_info,
                        # Typ konta - osobiste
                        account_type="facebook_personal",
                        is_business_account=False,
                        supports_auto_publish=False,
                        supports_autopilot=False,
                        # Komunikat dla UI
                        upgrade_message=(
                            "Wykryto profil osobisty Facebook. "
                            "Automatyczna publikacja wymaga Strony Facebook. "
                            "Możesz publikować przez okno udostępniania."
                        ),
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
                "fields": "id,name,email,picture.width(200)"
            }
        )

        self._log_api_call("GET", "/me", response.status_code)

        if response.status_code == 200:
            return response.json()
        return {}

    async def _get_user_pages(
            self,
            client: httpx.AsyncClient,
            access_token: str
    ) -> List[Dict[str, Any]]:
        """
        Pobiera listę stron Facebook użytkownika.
        Używane do wykrycia czy to konto firmowe.
        """
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

    async def refresh_access_token(self, refresh_token: str) -> OAuthResult:
        """
        Facebook nie używa refresh tokenów w tradycyjny sposób.
        Long-lived tokeny można tylko ponownie wymienić przed wygaśnięciem.
        """
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
                    "access_token": f"{self.app_id}|{self.app_secret}"
                }
            )

            if response.status_code == 200:
                data = response.json().get("data", {})
                return data.get("is_valid", False)
            return False

    # ==================== Account Info ====================

    async def get_account_info(self, access_token: str) -> Optional[AccountInfo]:
        """Pobiera informacje o koncie Facebook z wykryciem typu."""
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

            # Wykryj typ konta
            pages = await self._get_user_pages(client, access_token)
            has_pages = len(pages) > 0

            if has_pages:
                first_page = pages[0]
                return AccountInfo(
                    platform=self.platform,
                    platform_user_id=user_data.get("id", ""),
                    username=user_data.get("name", ""),
                    name=user_data.get("name"),
                    avatar_url=user_data.get("picture", {}).get("data", {}).get("url"),
                    permissions=self.REQUIRED_SCOPES,
                    # Typ konta
                    account_type="facebook_page",
                    is_business=True,
                    supports_auto_publish=True,
                    supports_autopilot=True,
                    # Dane strony
                    page_id=first_page.get("id"),
                    page_name=first_page.get("name"),
                    available_pages=pages,
                )
            else:
                return AccountInfo(
                    platform=self.platform,
                    platform_user_id=user_data.get("id", ""),
                    username=user_data.get("name", ""),
                    name=user_data.get("name"),
                    avatar_url=user_data.get("picture", {}).get("data", {}).get("url"),
                    permissions=self.REQUIRED_SCOPES,
                    # Typ konta - osobiste
                    account_type="facebook_personal",
                    is_business=False,
                    supports_auto_publish=False,
                    supports_autopilot=False,
                )

    async def get_user_pages(self, access_token: str) -> List[Dict[str, Any]]:
        """
        Publiczna metoda do pobierania stron użytkownika.
        """
        async with httpx.AsyncClient(timeout=30.0) as client:
            return await self._get_user_pages(client, access_token)

    # ==================== Publishing ====================

    async def publish_post(
            self,
            access_token: str,
            content: str,
            image_url: Optional[str] = None,
            link_url: Optional[str] = None,
            page_id: Optional[str] = None,
            account_type: Optional[str] = None,
            **kwargs
    ) -> PublishResult:
        """
        Publikuje post na stronie Facebook.

        Dla facebook_page: Automatyczna publikacja przez API
        Dla facebook_personal: Zwraca instrukcje ręcznej publikacji

        Args:
            access_token: Page Access Token (dla stron) lub User Token
            content: Treść posta
            image_url: URL do obrazka (opcjonalnie)
            link_url: URL linku (opcjonalnie)
            page_id: ID strony (wymagane dla facebook_page)
            account_type: Typ konta ("facebook_page" lub "facebook_personal")
        """
        # Sprawdź czy to konto osobiste
        if account_type == "facebook_personal":
            return self._generate_manual_publish_result(content, image_url, link_url)

        # Standardowa publikacja dla stron
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
                    result = await self._publish_photo_post(
                        client, access_token, page_id, content, image_url
                    )
                elif link_url:
                    result = await self._publish_link_post(
                        client, access_token, page_id, content, link_url
                    )
                else:
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

    def _generate_manual_publish_result(
            self,
            content: str,
            image_url: Optional[str] = None,
            link_url: Optional[str] = None
    ) -> PublishResult:
        """
        Generuje wynik dla ręcznej publikacji (konta osobiste).
        """
        from urllib.parse import quote

        # Share Dialog URL
        share_url = f"https://www.facebook.com/sharer/sharer.php?quote={quote(content[:500])}"
        if link_url:
            share_url += f"&u={quote(link_url)}"

        return PublishResult(
            success=True,  # "Sukces" w sensie przygotowania do publikacji
            platform=self.platform,
            requires_manual_publish=True,
            share_dialog_url=share_url,
            deeplink_url="fb://feed",
            manual_instructions=[
                "1. Kliknij 'Otwórz Facebook' lub skopiuj treść",
                "2. Wklej treść w nowy post",
                "3. Dodaj zdjęcie jeśli potrzebujesz" if image_url else None,
                "4. Opublikuj post",
            ],
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
                "url": image_url,
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