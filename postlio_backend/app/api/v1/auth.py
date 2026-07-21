# app/api/v1/auth.py
"""
Auth API endpoints z OAuth login przez Facebook/Google.
"""

import hmac
import hashlib
import base64
import json
import logging
import time
import secrets
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional

from app.api.deps import get_db, get_current_user
from app.api.rate_limit import limiter
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin, UserResponse, AccessTokenResponse, OnboardingComplete
from app.utils.security import hash_password, verify_password, decode_token
from app.config import settings
from app.services.social import social_manager, SocialPlatform
from app.services import refresh_token_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])

REFRESH_COOKIE_NAME = "refresh_token"
REFRESH_COOKIE_PATH = f"{settings.API_V1_PREFIX}/auth"


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="none" if not settings.DEBUG else "lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path=REFRESH_COOKIE_PATH,
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        path=REFRESH_COOKIE_PATH,
        secure=not settings.DEBUG,
        samesite="none" if not settings.DEBUG else "lax",
    )


# ==================== Schemas ====================

class OAuthLoginInitRequest(BaseModel):
    """Request do inicjalizacji OAuth login."""
    platform: str  # "facebook" lub "google"


class OAuthLoginInitResponse(BaseModel):
    """Response z URL do OAuth."""
    authorization_url: str
    state: str


class OAuthLoginCallbackRequest(BaseModel):
    """Request z callback OAuth."""
    platform: str
    code: str
    state: str


class OAuthLoginResponse(BaseModel):
    """Response po OAuth login. Refresh token jest ustawiany jako httpOnly cookie."""
    success: bool
    access_token: Optional[str] = None
    user: Optional[UserResponse] = None
    is_new_user: bool = False
    error: Optional[str] = None
    error_description: Optional[str] = None


# ==================== State Token Helpers ====================

def generate_login_state_token(platform: str) -> str:
    """Generuje bezpieczny state token dla OAuth login."""
    data = {
        "platform": platform,
        "type": "login",
        "exp": int(time.time()) + 600,  # 10 minut
        "nonce": secrets.token_hex(8),
    }
    payload = base64.urlsafe_b64encode(json.dumps(data).encode()).decode().rstrip("=")
    signature = hmac.new(
        settings.SECRET_KEY.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()[:32]
    return f"login_{payload}.{signature}"


def verify_login_state_token(state: str) -> Optional[dict]:
    """Weryfikuje state token dla OAuth login."""
    try:
        if not state.startswith("login_"):
            return None

        state = state[6:]  # Usuń prefix "login_"

        if "." not in state:
            return None

        payload, signature = state.rsplit(".", 1)

        # Weryfikuj podpis
        expected_sig = hmac.new(
            settings.SECRET_KEY.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()[:32]

        if not hmac.compare_digest(signature, expected_sig):
            return None

        # Dekoduj payload
        padding = 4 - len(payload) % 4
        if padding != 4:
            payload += "=" * padding
        data = json.loads(base64.urlsafe_b64decode(payload))

        # Sprawdź wygaśnięcie
        if data.get("exp", 0) < time.time():
            return None

        return data
    except Exception:
        return None


# ==================== Standard Auth Endpoints ====================

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(
        request: Request,
        user_data: UserRegister,
        db: AsyncSession = Depends(get_db),
):
    """Register a new user."""
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = User(
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        full_name=user_data.full_name,
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    return user


@router.post("/login", response_model=AccessTokenResponse)
@limiter.limit("10/minute")
async def login(
        request: Request,
        response: Response,
        user_data: UserLogin,
        db: AsyncSession = Depends(get_db),
):
    """Login and get access token. Refresh token is set as an httpOnly cookie."""
    result = await db.execute(select(User).where(User.email == user_data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is inactive",
        )

    access_token, new_refresh_token = await refresh_token_service.issue_tokens(db, user.id)
    await db.commit()
    _set_refresh_cookie(response, new_refresh_token)

    return AccessTokenResponse(access_token=access_token)


@router.post("/refresh", response_model=AccessTokenResponse)
async def refresh_token(
        response: Response,
        db: AsyncSession = Depends(get_db),
        refresh_token: Optional[str] = Cookie(None, alias=REFRESH_COOKIE_NAME),
):
    """Refresh access token using the httpOnly refresh cookie. Rotates the refresh token on every call."""
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token provided",
        )

    payload = decode_token(refresh_token)
    jti = payload.get("jti") if payload else None

    if not payload or payload.get("type") != "refresh" or not jti:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    user_id = int(payload.get("sub"))

    record = await refresh_token_service.get_by_jti(db, jti)

    if record is None or record.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    if record.revoked_at is not None:
        # Reuse of an already-rotated token: the cookie may have been stolen and
        # replayed after the legitimate client already rotated past it. Revoke
        # every session for this user rather than trusting any of them.
        await refresh_token_service.revoke_all_for_user(db, user_id)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token reuse detected - all sessions revoked, please log in again",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    await refresh_token_service.revoke(record)
    new_access_token, new_refresh_token = await refresh_token_service.issue_tokens(db, user.id)
    await db.commit()
    _set_refresh_cookie(response, new_refresh_token)

    return AccessTokenResponse(access_token=new_access_token)


@router.post("/logout")
async def logout(
        response: Response,
        db: AsyncSession = Depends(get_db),
        refresh_token: Optional[str] = Cookie(None, alias=REFRESH_COOKIE_NAME),
):
    """Clear the refresh token cookie and revoke the session server-side."""
    if refresh_token:
        payload = decode_token(refresh_token)
        jti = payload.get("jti") if payload else None
        if jti:
            record = await refresh_token_service.get_by_jti(db, jti)
            if record is not None:
                await refresh_token_service.revoke(record)
                await db.commit()

    _clear_refresh_cookie(response)
    return {"success": True}


@router.get("/me", response_model=UserResponse)
async def get_me(
        current_user: User = Depends(get_current_user),
):
    """Get current user info."""
    return current_user


@router.post("/onboarding", response_model=UserResponse)
async def complete_onboarding(
        data: OnboardingComplete,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    """Complete or skip onboarding."""
    if data.skipped:
        current_user.skip_onboarding()
    else:
        current_user.complete_onboarding()

    await db.commit()
    await db.refresh(current_user)

    return current_user


# ==================== OAuth Login Endpoints ====================

@router.post("/oauth/{platform}/init", response_model=OAuthLoginInitResponse)
async def init_oauth_login(
        platform: str,
):
    """
    Inicjalizuje OAuth login dla platformy (Facebook/Google).
    NIE wymaga autoryzacji - używane do logowania.
    """
    if platform not in ["facebook", "google"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Platform {platform} does not support OAuth login. Use 'facebook' or 'google'."
        )

    try:
        state = generate_login_state_token(platform)
        social_platform = SocialPlatform(platform)
        authorization_url = social_manager.get_authorization_url(social_platform, state)

        return OAuthLoginInitResponse(
            authorization_url=authorization_url,
            state=state
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/oauth/{platform}/callback", response_model=OAuthLoginResponse)
async def oauth_login_callback(
        platform: str,
        request: OAuthLoginCallbackRequest,
        response: Response,
        db: AsyncSession = Depends(get_db),
):
    """
    Obsługuje callback OAuth login.
    NIE wymaga autoryzacji - używane do logowania/rejestracji.

    Flow:
    1. Weryfikuj state token
    2. Wymień code na token (pobierz dane użytkownika)
    3. Znajdź lub utwórz użytkownika
    4. Zwróć tokeny JWT
    """
    # Weryfikuj state
    state_data = verify_login_state_token(request.state)
    if not state_data:
        return OAuthLoginResponse(
            success=False,
            error="invalid_state",
            error_description="Invalid or expired state token"
        )

    if state_data.get("platform") != platform:
        return OAuthLoginResponse(
            success=False,
            error="platform_mismatch",
            error_description="Platform mismatch in state token"
        )

    try:
        # Wymień code na token
        social_platform = SocialPlatform(platform)
        result = await social_manager.exchange_code_for_token(social_platform, request.code)

        if not result.success:
            return OAuthLoginResponse(
                success=False,
                error=result.error or "token_exchange_failed",
                error_description=result.error_description or "Failed to authenticate with provider"
            )

        # Pobierz email z wyników OAuth
        email = result.email or (result.profile_data or {}).get("email")

        if not email:
            return OAuthLoginResponse(
                success=False,
                error="email_required",
                error_description="Email is required for login. Please grant email permission."
            )

        # Znajdź lub utwórz użytkownika
        existing_user = await db.execute(
            select(User).where(User.email == email)
        )
        user = existing_user.scalar_one_or_none()
        is_new_user = False

        if user:
            # Istniejący użytkownik - zaloguj
            if not user.is_active:
                return OAuthLoginResponse(
                    success=False,
                    error="user_inactive",
                    error_description="User account is inactive"
                )

            # Aktualizuj avatar jeśli nie ma
            if not user.avatar_url and result.profile_data:
                avatar = result.profile_data.get("picture")
                if isinstance(avatar, dict):
                    avatar = avatar.get("data", {}).get("url")
                if avatar:
                    user.avatar_url = avatar
                    await db.commit()

        else:
            # Nowy użytkownik - zarejestruj
            name = result.platform_username or result.profile_data.get("name", "") if result.profile_data else ""
            avatar = None
            if result.profile_data:
                avatar = result.profile_data.get("picture")
                if isinstance(avatar, dict):
                    avatar = avatar.get("data", {}).get("url")

            user = User(
                email=email,
                full_name=name,
                hashed_password="",  # OAuth users don't have password
                avatar_url=avatar,
                oauth_provider=platform,
                oauth_provider_id=result.platform_user_id,
                is_active=True,
            )

            db.add(user)
            await db.commit()
            await db.refresh(user)
            is_new_user = True

        # Utwórz tokeny JWT
        access_token, new_refresh_token = await refresh_token_service.issue_tokens(db, user.id)
        await db.commit()
        _set_refresh_cookie(response, new_refresh_token)

        return OAuthLoginResponse(
            success=True,
            access_token=access_token,
            user=UserResponse.model_validate(user),
            is_new_user=is_new_user,
        )

    except Exception:
        logger.exception("OAuth login callback failed for platform %s", platform)

        return OAuthLoginResponse(
            success=False,
            error="server_error",
            error_description="An unexpected error occurred during login. Please try again."
        )