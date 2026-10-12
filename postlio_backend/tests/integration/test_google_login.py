from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

from app.api.v1.auth import generate_login_state_token
from app.services.social.base import OAuthResult, SocialPlatform


def google_identity(email: str = "new-google@test.com", provider_id: str = "google-123", verified: bool = True) -> OAuthResult:
    return OAuthResult(
        success=True,
        platform=SocialPlatform.GOOGLE,
        platform_user_id=provider_id,
        platform_username="Google User",
        profile_data={"name": "Google User", "picture": "https://example.com/avatar.png"},
        email=email,
        email_verified=verified,
    )


async def callback(client: AsyncClient, result: OAuthResult, platform: str = "google"):
    with patch(
        "app.api.v1.auth.social_manager.exchange_code_for_token",
        new_callable=AsyncMock,
        return_value=result,
    ):
        return await client.post(
            f"/api/v1/auth/oauth/{platform}/callback",
            json={"platform": platform, "code": "code", "state": generate_login_state_token(platform)},
        )


@pytest.mark.asyncio
async def test_google_creates_account_and_logs_in_again(client: AsyncClient):
    first = await callback(client, google_identity())
    assert first.status_code == 200
    assert first.json()["success"] is True
    assert first.json()["is_new_user"] is True
    assert first.json()["user"]["is_verified"] is True
    assert first.cookies.get("refresh_token")

    second = await callback(client, google_identity(email="changed@test.com"))
    assert second.json()["success"] is True
    assert second.json()["is_new_user"] is False
    assert second.json()["user"]["id"] == first.json()["user"]["id"]


@pytest.mark.asyncio
async def test_google_rejects_unverified_email(client: AsyncClient):
    response = await callback(client, google_identity(verified=False))
    assert response.json()["error"] == "email_unverified"
    assert response.json()["access_token"] is None


@pytest.mark.asyncio
async def test_google_does_not_take_over_password_account(client: AsyncClient, integration_user):
    response = await callback(client, google_identity(email=integration_user.email))
    assert response.json()["error"] == "account_exists"
    assert response.json()["access_token"] is None


@pytest.mark.asyncio
async def test_google_does_not_match_email_with_different_identity(client: AsyncClient):
    await callback(client, google_identity())
    response = await callback(client, google_identity(provider_id="google-456"))
    assert response.json()["error"] == "account_exists"


@pytest.mark.asyncio
async def test_google_rejects_missing_provider_id(client: AsyncClient):
    response = await callback(client, google_identity(provider_id=""))
    assert response.json()["error"] == "identity_incomplete"


@pytest.mark.asyncio
async def test_google_rejects_mismatched_platform_in_body(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/oauth/google/callback",
        json={"platform": "facebook", "code": "code", "state": generate_login_state_token("google")},
    )
    assert response.json()["error"] == "platform_mismatch"
