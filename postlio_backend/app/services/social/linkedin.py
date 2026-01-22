# postlio_backend/app/services/social/linkedin.py
"""
LinkedIn API integration.

Dokumentacja: https://docs.microsoft.com/en-us/linkedin/marketing/
"""

import httpx
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from urllib.parse import urlencode

from app.config import settings
from .base import (
    BaseSocialService,
    SocialPlatform,
    OAuthResult,
    PublishResult,
    AccountInfo,
)


class LinkedInService(BaseSocialService):
    """
    Serwis do integracji z LinkedIn API.

    LinkedIn używa OAuth 2.0 z następującymi endpointami:
    - Authorization: https://www.linkedin.com/oauth/v2/authorization
    - Token: https://www.linkedin.com/oauth/v2/accessToken
    - API: https://api.linkedin.com/v2/

    WAŻNE:
    - Access token ważny 60 dni
    - Refresh token ważny 365 dni
    - Do publikacji używamy UGC Posts API lub Shares API
    """

    platform = SocialPlatform.LINKEDIN

    # API endpoints
    AUTH_URL = "https://www.linkedin.com/oauth/v2"
    API_URL = "https://api.linkedin.com/v2"

    # Wymagane uprawnienia
    # https://docs.microsoft.com/en-us/linkedin/shared/references/v2/profile/lite-profile
    REQUIRED_SCOPES = [
        "openid",  # OpenID Connect
        "profile",  # Podstawowy profil
        "email",  # Email
        "w_member_social",  # Publikacja postów
    ]

    def __init__(self):
        super().__init__()
        self.client_id = settings.LINKEDIN_CLIENT_ID
        self.client_secret = settings.LINKEDIN_CLIENT_SECRET
        self.redirect_uri = settings.linkedin_redirect_uri

        if not self.client_id or not self.client_secret:
            self.logger.warning(
                "LinkedIn Client ID or Secret not configured. "
                "Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET in .env"
            )

    # ==================== OAuth ====================

    def get_authorization_url(self, state: str) -> str:
        """Generuje URL do autoryzacji LinkedIn OAuth."""
        if not self.client_id:
            raise ValueError("LinkedIn Client ID not configured")

        params = {
            "response_type": "code",
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "state": state,
            "scope": " ".join(self.REQUIRED_SCOPES),
        }

        return f"{self.AUTH_URL}/authorization?{urlencode(params)}"

    async def exchange_code_for_token(self, code: str) -> OAuthResult:
        """Wymienia authorization code na access token."""
        if not self.client_id or not self.client_secret:
            return OAuthResult(
                success=False,
                platform=self.platform,
                error="configuration_error",
                error_description="LinkedIn App not configured"
            )

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                # 1. Wymiana kodu na token
                response = await client.post(
                    f"{self.AUTH_URL}/accessToken",
                    data={
                        "grant_type": "authorization_code",
                        "code": code,
                        "redirect_uri": self.redirect_uri,
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                    },
                    headers={
                        "Content-Type": "application/x-www-form-urlencoded"
                    }
                )

                self._log_api_call("POST", "/accessToken", response.status_code)

                if response.status_code != 200:
                    error_data = response.json()
                    return OAuthResult(
                        success=False,
                        platform=self.platform,
                        error=error_data.get("error", "unknown"),
                        error_description=error_data.get("error_description", "Token exchange failed")
                    )

                token_data = response.json()
                access_token = token_data.get("access_token")
                expires_in = token_data.get("expires_in", 5184000)  # 60 dni
                refresh_token = token_data.get("refresh_token")

                # 2. Pobierz profil użytkownika
                profile = await self._get_user_profile(client, access_token)

                return OAuthResult(
                    success=True,
                    platform=self.platform,
                    access_token=access_token,
                    refresh_token=refresh_token,
                    expires_at=datetime.utcnow() + timedelta(seconds=expires_in),
                    platform_user_id=profile.get("sub") or profile.get("id"),
                    platform_username=profile.get("name") or profile.get("localizedFirstName"),
                    profile_data=profile
                )

            except httpx.RequestError as e:
                self._log_error("LinkedIn API request failed", e)
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

    async def _get_user_profile(
            self,
            client: httpx.AsyncClient,
            access_token: str
    ) -> Dict[str, Any]:
        """Pobiera profil użytkownika z LinkedIn (OpenID Connect)."""
        # Używamy OpenID Connect userinfo endpoint
        response = await client.get(
            "https://api.linkedin.com/v2/userinfo",
            headers={
                "Authorization": f"Bearer {access_token}"
            }
        )

        self._log_api_call("GET", "/userinfo", response.status_code)

        if response.status_code == 200:
            return response.json()

        # Fallback: stare API
        response = await client.get(
            f"{self.API_URL}/me",
            headers={
                "Authorization": f"Bearer {access_token}"
            }
        )

        if response.status_code == 200:
            return response.json()

        return {}

    async def refresh_access_token(self, refresh_token: str) -> OAuthResult:
        """Odświeża access token używając refresh token."""
        if not self.client_id or not self.client_secret:
            return OAuthResult(
                success=False,
                platform=self.platform,
                error="configuration_error",
                error_description="LinkedIn App not configured"
            )

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.AUTH_URL}/accessToken",
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token,
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                },
                headers={
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            )

            self._log_api_call("POST", "/accessToken (refresh)", response.status_code)

            if response.status_code == 200:
                data = response.json()
                return OAuthResult(
                    success=True,
                    platform=self.platform,
                    access_token=data.get("access_token"),
                    refresh_token=data.get("refresh_token"),
                    expires_at=datetime.utcnow() + timedelta(seconds=data.get("expires_in", 5184000))
                )
            else:
                error_data = response.json()
                return OAuthResult(
                    success=False,
                    platform=self.platform,
                    error=error_data.get("error", "refresh_failed"),
                    error_description=error_data.get("error_description", "Token refresh failed")
                )

    async def validate_token(self, access_token: str) -> bool:
        """Sprawdza czy token jest ważny przez próbę pobrania profilu."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                "https://api.linkedin.com/v2/userinfo",
                headers={
                    "Authorization": f"Bearer {access_token}"
                }
            )
            return response.status_code == 200

    # ==================== Account Info ====================

    async def get_account_info(self, access_token: str) -> Optional[AccountInfo]:
        """Pobiera informacje o koncie LinkedIn."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            profile = await self._get_user_profile(client, access_token)

            if not profile:
                return None

            # OpenID Connect format
            user_id = profile.get("sub") or profile.get("id")
            name = profile.get("name")

            if not name:
                first_name = profile.get("given_name") or profile.get("localizedFirstName", "")
                last_name = profile.get("family_name") or profile.get("localizedLastName", "")
                name = f"{first_name} {last_name}".strip()

            return AccountInfo(
                platform=self.platform,
                platform_user_id=user_id or "",
                username=name or "LinkedIn User",
                name=name,
                avatar_url=profile.get("picture"),
                is_business=False,
                permissions=self.REQUIRED_SCOPES
            )

    # ==================== Publishing ====================

    async def publish_post(
            self,
            access_token: str,
            content: str,
            image_url: Optional[str] = None,
            link_url: Optional[str] = None,
            author_urn: Optional[str] = None,
            **kwargs
    ) -> PublishResult:
        """
        Publikuje post na LinkedIn.

        LinkedIn używa UGC Posts API:
        https://docs.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/ugc-post-api

        Args:
            access_token: Access token
            content: Treść posta
            image_url: URL do obrazka (opcjonalnie)
            link_url: URL linku (opcjonalnie)
            author_urn: URN autora (np. "urn:li:person:ABC123")
        """
        if not author_urn:
            # Pobierz URN z profilu
            async with httpx.AsyncClient(timeout=30.0) as client:
                profile = await self._get_user_profile(client, access_token)
                user_id = profile.get("sub") or profile.get("id")
                if user_id:
                    author_urn = f"urn:li:person:{user_id}"
                else:
                    return PublishResult(
                        success=False,
                        platform=self.platform,
                        error="missing_author_urn",
                        error_code="VALIDATION_ERROR"
                    )

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                if image_url:
                    # Post ze zdjęciem wymaga upload przez LinkedIn API
                    # Na razie nie obsługujemy - używamy linku do zdjęcia
                    return await self._publish_text_post(client, access_token, author_urn, content)
                elif link_url:
                    return await self._publish_link_post(client, access_token, author_urn, content, link_url)
                else:
                    return await self._publish_text_post(client, access_token, author_urn, content)

            except httpx.RequestError as e:
                self._log_error("LinkedIn publish request failed", e)
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
            author_urn: str,
            content: str
    ) -> PublishResult:
        """Publikuje post tekstowy na LinkedIn."""
        payload = {
            "author": author_urn,
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {
                        "text": content
                    },
                    "shareMediaCategory": "NONE"
                }
            },
            "visibility": {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
            }
        }

        response = await client.post(
            f"{self.API_URL}/ugcPosts",
            json=payload,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
                "X-Restli-Protocol-Version": "2.0.0"
            }
        )

        self._log_api_call("POST", "/ugcPosts", response.status_code)

        return self._parse_publish_response(response)

    async def _publish_link_post(
            self,
            client: httpx.AsyncClient,
            access_token: str,
            author_urn: str,
            content: str,
            link_url: str
    ) -> PublishResult:
        """Publikuje post z linkiem na LinkedIn."""
        payload = {
            "author": author_urn,
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {
                        "text": content
                    },
                    "shareMediaCategory": "ARTICLE",
                    "media": [
                        {
                            "status": "READY",
                            "originalUrl": link_url
                        }
                    ]
                }
            },
            "visibility": {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
            }
        }

        response = await client.post(
            f"{self.API_URL}/ugcPosts",
            json=payload,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
                "X-Restli-Protocol-Version": "2.0.0"
            }
        )

        self._log_api_call("POST", "/ugcPosts (link)", response.status_code)

        return self._parse_publish_response(response)

    def _parse_publish_response(self, response: httpx.Response) -> PublishResult:
        """Parsuje odpowiedź z publikacji LinkedIn."""
        if response.status_code == 201:
            # Sukces - LinkedIn zwraca ID w headerze
            post_id = response.headers.get("x-restli-id", "")

            # Dekoduj URN do ID
            if post_id.startswith("urn:li:share:"):
                share_id = post_id.replace("urn:li:share:", "")
                post_url = f"https://www.linkedin.com/feed/update/{post_id}"
            elif post_id.startswith("urn:li:ugcPost:"):
                share_id = post_id.replace("urn:li:ugcPost:", "")
                post_url = f"https://www.linkedin.com/feed/update/{post_id}"
            else:
                share_id = post_id
                post_url = None

            return PublishResult(
                success=True,
                platform=self.platform,
                post_id=share_id,
                post_url=post_url,
                raw_response={"id": post_id}
            )
        else:
            try:
                error_data = response.json()
            except:
                error_data = {"message": response.text}

            return PublishResult(
                success=False,
                platform=self.platform,
                error=error_data.get("message", "Unknown error"),
                error_code=str(response.status_code),
                raw_response=error_data
            )


# Globalna instancja
linkedin_service = LinkedInService()