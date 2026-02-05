# app/services/social/google.py
"""
Google OAuth integration dla logowania.

Dokumentacja: https://developers.google.com/identity/protocols/oauth2
"""

import httpx
from datetime import datetime, timedelta
from typing import Optional
from urllib.parse import urlencode

from app.config import settings
from .base import (
    BaseSocialService,
    SocialPlatform,
    OAuthResult,
    PublishResult,
    AccountInfo,
)


class GoogleService(BaseSocialService):
    """
    Serwis do integracji z Google OAuth.
    Używany głównie do logowania/rejestracji.
    """

    platform = SocialPlatform.GOOGLE

    # API endpoints
    OAUTH_URL = "https://accounts.google.com/o/oauth2"
    TOKEN_URL = "https://oauth2.googleapis.com/token"
    USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

    # Wymagane uprawnienia
    REQUIRED_SCOPES = [
        "openid",
        "email",
        "profile",
    ]

    def __init__(self):
        super().__init__()
        self.client_id = settings.GOOGLE_CLIENT_ID
        self.client_secret = settings.GOOGLE_CLIENT_SECRET
        self.redirect_uri = settings.google_redirect_uri

        if not self.client_id or not self.client_secret:
            self.logger.warning(
                "Google Client ID or Secret not configured. "
                "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env"
            )

    def get_authorization_url(self, state: str) -> str:
        """Generuje URL do autoryzacji Google OAuth."""
        if not self.client_id:
            raise ValueError("Google Client ID not configured")

        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": " ".join(self.REQUIRED_SCOPES),
            "state": state,
            "access_type": "offline",
            "prompt": "consent",
        }

        return f"{self.OAUTH_URL}/auth?{urlencode(params)}"

    async def exchange_code_for_token(self, code: str) -> OAuthResult:
        """Wymienia authorization code na access token."""
        if not self.client_id or not self.client_secret:
            return OAuthResult(
                success=False,
                platform=self.platform,
                error="configuration_error",
                error_description="Google OAuth not configured"
            )

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                # 1. Wymiana kodu na token
                token_response = await client.post(
                    self.TOKEN_URL,
                    data={
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "code": code,
                        "grant_type": "authorization_code",
                        "redirect_uri": self.redirect_uri,
                    }
                )

                self._log_api_call("POST", "/token", token_response.status_code)

                if token_response.status_code != 200:
                    error_data = token_response.json()
                    return OAuthResult(
                        success=False,
                        platform=self.platform,
                        error=error_data.get("error", "unknown"),
                        error_description=error_data.get("error_description", "Token exchange failed")
                    )

                token_data = token_response.json()
                access_token = token_data.get("access_token")
                refresh_token = token_data.get("refresh_token")
                expires_in = token_data.get("expires_in", 3600)

                # 2. Pobierz informacje o użytkowniku
                user_response = await client.get(
                    self.USERINFO_URL,
                    headers={"Authorization": f"Bearer {access_token}"}
                )

                self._log_api_call("GET", "/userinfo", user_response.status_code)

                if user_response.status_code != 200:
                    return OAuthResult(
                        success=False,
                        platform=self.platform,
                        error="userinfo_error",
                        error_description="Failed to get user info"
                    )

                user_data = user_response.json()

                return OAuthResult(
                    success=True,
                    platform=self.platform,
                    access_token=access_token,
                    refresh_token=refresh_token,
                    expires_at=datetime.utcnow() + timedelta(seconds=expires_in),
                    platform_user_id=user_data.get("id"),
                    platform_username=user_data.get("name"),
                    profile_data={
                        "id": user_data.get("id"),
                        "email": user_data.get("email"),
                        "name": user_data.get("name"),
                        "given_name": user_data.get("given_name"),
                        "family_name": user_data.get("family_name"),
                        "picture": user_data.get("picture"),
                        "verified_email": user_data.get("verified_email"),
                    },
                    email=user_data.get("email"),
                    email_verified=user_data.get("verified_email", False),
                )

            except httpx.RequestError as e:
                self._log_error("Google API request failed", e)
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

    async def refresh_access_token(self, refresh_token: str) -> OAuthResult:
        """Odświeża access token."""
        if not self.client_id or not self.client_secret:
            return OAuthResult(
                success=False,
                platform=self.platform,
                error="configuration_error",
                error_description="Google OAuth not configured"
            )

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(
                    self.TOKEN_URL,
                    data={
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "refresh_token": refresh_token,
                        "grant_type": "refresh_token",
                    }
                )

                if response.status_code == 200:
                    data = response.json()
                    return OAuthResult(
                        success=True,
                        platform=self.platform,
                        access_token=data.get("access_token"),
                        expires_at=datetime.utcnow() + timedelta(seconds=data.get("expires_in", 3600))
                    )
                else:
                    return OAuthResult(
                        success=False,
                        platform=self.platform,
                        error="refresh_failed",
                        error_description="Token refresh failed"
                    )
            except Exception as e:
                return OAuthResult(
                    success=False,
                    platform=self.platform,
                    error="request_error",
                    error_description=str(e)
                )

    async def validate_token(self, access_token: str) -> bool:
        """Sprawdza czy token jest ważny."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                self.USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"}
            )
            return response.status_code == 200

    async def get_account_info(self, access_token: str) -> Optional[AccountInfo]:
        """Pobiera informacje o koncie Google."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                self.USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"}
            )

            if response.status_code != 200:
                return None

            data = response.json()

            return AccountInfo(
                platform=self.platform,
                platform_user_id=data.get("id", ""),
                username=data.get("email", ""),
                name=data.get("name"),
                avatar_url=data.get("picture"),
                email=data.get("email"),
            )

    async def publish_post(self, *args, **kwargs) -> PublishResult:
        """Google nie obsługuje publikacji postów."""
        return PublishResult(
            success=False,
            platform=self.platform,
            error="not_supported",
            error_code="PUBLISH_NOT_SUPPORTED"
        )


# Globalna instancja
google_service = GoogleService()