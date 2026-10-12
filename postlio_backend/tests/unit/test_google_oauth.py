from urllib.parse import parse_qs, urlparse

import httpx
import pytest
import respx

from app.services.social.google import GoogleService


@pytest.mark.asyncio
async def test_google_oidc_returns_verified_stable_identity():
    service = GoogleService()
    service.client_id = "client-id"
    service.client_secret = "client-secret"
    service.redirect_uri = "http://localhost:3000/api/auth/callback/google"

    authorization_url = urlparse(service.get_authorization_url("state-token"))
    params = parse_qs(authorization_url.query)
    assert authorization_url.path == "/o/oauth2/v2/auth"
    assert params["scope"] == ["openid email profile"]
    assert params["state"] == ["state-token"]
    assert "access_type" not in params

    with respx.mock:
        respx.post(service.TOKEN_URL).mock(
            return_value=httpx.Response(200, json={"access_token": "google-token"})
        )
        respx.get(service.USERINFO_URL).mock(
            return_value=httpx.Response(
                200,
                json={
                    "sub": "stable-google-id",
                    "email": "person@example.com",
                    "email_verified": True,
                    "name": "Person",
                },
            )
        )
        result = await service.exchange_code_for_token("authorization-code")

    assert result.success is True
    assert result.platform_user_id == "stable-google-id"
    assert result.email == "person@example.com"
    assert result.email_verified is True
