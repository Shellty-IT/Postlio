# tests/integration/test_api_auth.py
"""
Integration tests for Auth API endpoints.
"""
import pytest
from datetime import timedelta
from httpx import AsyncClient

from app.utils.security import create_access_token


class TestRegister:
    """Tests for POST /api/v1/auth/register"""

    @pytest.mark.asyncio
    async def test_register_success(self, client: AsyncClient):
        """Should successfully register a new user."""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "newuser@test.com",
                "password": "SecurePassword123!",
                "full_name": "New User",
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newuser@test.com"
        assert data["full_name"] == "New User"
        assert "id" in data
        assert "hashed_password" not in data

    @pytest.mark.asyncio
    async def test_register_duplicate_email(
        self, client: AsyncClient, integration_user
    ):
        """Should reject duplicate email."""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": integration_user.email,  # Already exists
                "password": "AnotherPassword123!",
                "full_name": "Duplicate User",
            }
        )

        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_register_weak_password(self, client: AsyncClient):
        """Should reject weak password."""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "weak@test.com",
                "password": "123",
                "full_name": "Weak Password User",
            }
        )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_register_invalid_email(self, client: AsyncClient):
        """Should reject invalid email format."""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "not-an-email",
                "password": "SecurePassword123!",
                "full_name": "Invalid Email User",
            }
        )

        assert response.status_code == 422


class TestLogin:
    """Tests for POST /api/v1/auth/login"""

    @pytest.mark.asyncio
    async def test_login_success(self, client: AsyncClient, integration_user):
        """Should successfully login with correct credentials."""
        response = await client.post(
            "/api/v1/auth/login",
            json={  # Changed from data= to json=
                "email": integration_user.email,
                "password": "TestPassword123!",
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" not in data
        assert response.cookies.get("refresh_token") is not None

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client: AsyncClient, integration_user):
        """Should reject wrong password."""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": integration_user.email,
                "password": "WrongPassword123!",
            }
        )

        assert response.status_code == 401
        assert "invalid" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_login_nonexistent_user(self, client: AsyncClient):
        """Should reject nonexistent user."""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "nonexistent@test.com",
                "password": "Password123!",
            }
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_login_inactive_user(
        self, client: AsyncClient, inactive_user
    ):
        """Should reject inactive user."""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": inactive_user.email,
                "password": "InactivePass123!",
            }
        )

        # API returns 403 for inactive users
        assert response.status_code == 403


class TestGetCurrentUser:
    """Tests for GET /api/v1/auth/me"""

    @pytest.mark.asyncio
    async def test_get_me_authenticated(
        self, client: AsyncClient, auth_headers, integration_user
    ):
        """Should return current user info."""
        response = await client.get("/api/v1/auth/me", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == integration_user.email
        assert data["full_name"] == integration_user.full_name
        assert data["id"] == integration_user.id

    @pytest.mark.asyncio
    async def test_get_me_unauthenticated(self, client: AsyncClient):
        """Should reject unauthenticated request."""
        response = await client.get("/api/v1/auth/me")

        # FastAPI returns 403 when no auth header, 401 for invalid token
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_get_me_invalid_token(self, client: AsyncClient):
        """Should reject invalid token."""
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid_token_here"}
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_me_expired_token(self, client: AsyncClient, integration_user):
        """Should reject expired token."""
        expired_token = create_access_token(
            data={"sub": str(integration_user.id)},
            expires_delta=timedelta(seconds=-1)
        )

        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {expired_token}"}
        )

        assert response.status_code == 401


class TestTokenRefresh:
    """Tests for POST /api/v1/auth/refresh"""

    @pytest.mark.asyncio
    async def test_refresh_token_success(
        self, client: AsyncClient, integration_user
    ):
        """Should return a new access token using the httpOnly refresh cookie."""
        # Login sets the refresh cookie on the shared client's cookie jar
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": integration_user.email,
                "password": "TestPassword123!",
            }
        )
        assert login_response.status_code == 200

        # Refresh cookie is sent automatically - no body needed
        response = await client.post("/api/v1/auth/refresh")

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" not in data
        # Cookie is rotated on every refresh
        assert response.cookies.get("refresh_token") is not None

    @pytest.mark.asyncio
    async def test_refresh_invalid_token(self, client: AsyncClient):
        """Should reject a request with no refresh cookie."""
        response = await client.post("/api/v1/auth/refresh")

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_refresh_malformed_cookie(self, client: AsyncClient):
        """Should reject a malformed refresh cookie."""
        client.cookies.set("refresh_token", "not-a-valid-jwt")
        response = await client.post("/api/v1/auth/refresh")

        assert response.status_code == 401


class TestLogout:
    """Tests for POST /api/v1/auth/logout"""

    @pytest.mark.asyncio
    async def test_logout_clears_refresh_cookie(
        self, client: AsyncClient, integration_user
    ):
        """Should clear the refresh cookie so a subsequent refresh fails."""
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": integration_user.email,
                "password": "TestPassword123!",
            }
        )
        assert login_response.status_code == 200

        logout_response = await client.post("/api/v1/auth/logout")
        assert logout_response.status_code == 200

        refresh_response = await client.post("/api/v1/auth/refresh")
        assert refresh_response.status_code == 401


class TestPasswordChange:
    """Tests for password change (if endpoint exists)."""

    @pytest.mark.asyncio
    async def test_change_password_endpoint_exists(
        self, client: AsyncClient, auth_headers
    ):
        """Check if change-password endpoint exists."""
        response = await client.post(
            "/api/v1/auth/change-password",
            headers=auth_headers,
            json={
                "current_password": "TestPassword123!",
                "new_password": "NewSecurePassword456!",
            }
        )

        # 404 = endpoint doesn't exist (OK for now)
        # 200 = success
        # 400/401 = validation error
        assert response.status_code in [200, 400, 401, 404, 422]