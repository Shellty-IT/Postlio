# postlio_backend/app/api/v1/social.py
"""
API endpoints dla Social Media integration.
Tylko oficjalnie wspierane typy kont (Facebook Pages, Instagram Business/Creator, LinkedIn).
"""

import secrets
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.social_account import SocialAccount
from app.services.social import social_manager, SocialPlatform
from app.schemas.social import (
    SocialPlatform as SchemaPlatform,
    AccountType,
    ConnectionStatus,
    OAuthInitRequest,
    OAuthInitResponse,
    OAuthCallbackRequest,
    OAuthCallbackResponse,
    ConnectedAccountResponse,
    ListAccountsResponse,
    PublishPostRequest,
    PublishPostResponse,
    RefreshTokenResponse,
    FacebookPageInfo,
    InstagramAccountInfo,
    ACCOUNT_CAPABILITIES,
)

router = APIRouter(prefix="/social", tags=["social"])

# Przechowywanie state tokenów (w produkcji użyj Redis)
_oauth_states: dict = {}


# ==================== OAuth Flow ====================

@router.post("/oauth/init", response_model=OAuthInitResponse)
async def init_oauth(
        request: OAuthInitRequest,
        current_user: User = Depends(get_current_user),
):
    """
    Inicjalizuje OAuth flow dla platformy.
    Zwraca URL do przekierowania użytkownika.
    """
    try:
        # Generuj bezpieczny state token
        state = secrets.token_urlsafe(32)

        # Zapisz state
        _oauth_states[state] = {
            "user_id": current_user.id,
            "platform": request.platform.value,
            "created_at": datetime.utcnow()
        }

        # Pobierz URL autoryzacji
        platform = SocialPlatform(request.platform.value)
        authorization_url = social_manager.get_authorization_url(platform, state)

        return OAuthInitResponse(
            authorization_url=authorization_url,
            state=state
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/oauth/callback", response_model=OAuthCallbackResponse)
async def oauth_callback(
        request: OAuthCallbackRequest,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    """
    Obsługuje callback z OAuth.
    Zapisuje tokeny w bazie.
    """
    # Weryfikuj state
    state_data = _oauth_states.pop(request.state, None)
    if not state_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired state token"
        )

    if state_data["user_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="State token belongs to different user"
        )

    # Wymień kod na token
    platform = SocialPlatform(request.platform.value)
    result = await social_manager.exchange_code_for_token(platform, request.code)

    if not result.success:
        return OAuthCallbackResponse(
            success=False,
            platform=request.platform,
            error=result.error,
            error_description=result.error_description
        )

    # Określ typ konta
    account_type = _determine_account_type(platform, result.profile_data)

    # Sprawdź czy konto już istnieje
    existing = await db.execute(
        select(SocialAccount).where(
            and_(
                SocialAccount.user_id == current_user.id,
                SocialAccount.platform == platform.value,
                SocialAccount.platform_user_id == result.platform_user_id
            )
        )
    )
    existing_account = existing.scalar_one_or_none()

    # Zaszyfruj tokeny
    encrypted_access = social_manager.encrypt_token(result.access_token)
    encrypted_refresh = social_manager.encrypt_token(result.refresh_token) if result.refresh_token else None

    if existing_account:
        # Aktualizuj istniejące konto
        existing_account.access_token = encrypted_access
        existing_account.refresh_token = encrypted_refresh
        existing_account.token_expires_at = result.expires_at
        existing_account.platform_username = result.platform_username
        existing_account.profile_data = result.profile_data
        existing_account.account_type = account_type.value
        existing_account.is_active = True
        existing_account.last_error = None
        existing_account.updated_at = datetime.utcnow()
        account = existing_account
    else:
        # Utwórz nowe konto
        account = SocialAccount(
            user_id=current_user.id,
            platform=platform.value,
            account_type=account_type.value,
            platform_user_id=result.platform_user_id,
            platform_username=result.platform_username,
            access_token=encrypted_access,
            refresh_token=encrypted_refresh,
            token_expires_at=result.expires_at,
            profile_data=result.profile_data,
            is_active=True
        )
        db.add(account)

    await db.commit()
    await db.refresh(account)

    return OAuthCallbackResponse(
        success=True,
        platform=request.platform,
        account_id=str(account.id),
        account_name=result.platform_username,
        account_type=account_type
    )


# ==================== Account Management ====================

@router.get("/accounts", response_model=ListAccountsResponse)
async def list_accounts(
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    """Zwraca listę połączonych kont użytkownika."""
    result = await db.execute(
        select(SocialAccount).where(SocialAccount.user_id == current_user.id)
    )
    accounts = result.scalars().all()

    response_accounts = []
    for account in accounts:
        response_accounts.append(await _build_account_response(account))

    return ListAccountsResponse(
        accounts=response_accounts,
        total=len(response_accounts)
    )


@router.get("/accounts/{account_id}", response_model=ConnectedAccountResponse)
async def get_account(
        account_id: int,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    """Pobiera szczegóły połączonego konta."""
    account = await _get_user_account(db, account_id, current_user.id)
    return await _build_account_response(account)


@router.delete("/accounts/{account_id}")
async def disconnect_account(
        account_id: int,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    """Rozłącza konto social media."""
    account = await _get_user_account(db, account_id, current_user.id)

    # Oznacz jako nieaktywne
    account.is_active = False
    account.access_token = ""
    account.refresh_token = None
    account.updated_at = datetime.utcnow()

    await db.commit()

    return {"success": True, "message": "Account disconnected"}


@router.post("/accounts/{account_id}/refresh", response_model=RefreshTokenResponse)
async def refresh_account_token(
        account_id: int,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    """Odświeża token dla konta."""
    account = await _get_user_account(db, account_id, current_user.id)

    # Dla Facebook używamy access_token do odświeżenia
    token_to_refresh = account.refresh_token or account.access_token
    if not token_to_refresh:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No token available to refresh"
        )

    platform = SocialPlatform(account.platform)
    refresh_result = await social_manager.refresh_token(platform, token_to_refresh)

    if not refresh_result.success:
        account.last_error = refresh_result.error_description or refresh_result.error
        await db.commit()
        return RefreshTokenResponse(
            success=False,
            error=refresh_result.error_description or refresh_result.error
        )

    # Aktualizuj tokeny w bazie
    account.access_token = refresh_result.access_token
    if refresh_result.refresh_token:
        account.refresh_token = refresh_result.refresh_token
    account.token_expires_at = refresh_result.expires_at
    account.last_error = None
    account.updated_at = datetime.utcnow()

    await db.commit()

    return RefreshTokenResponse(
        success=True,
        expires_at=refresh_result.expires_at
    )


# ==================== Publishing ====================

@router.post("/publish", response_model=PublishPostResponse)
async def publish_post(
        request: PublishPostRequest,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    """Publikuje post na wybranej platformie."""
    account = await _get_user_account(db, request.account_id, current_user.id)

    if not account.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is disconnected"
        )

    # Sprawdź czy token nie wygasł
    if account.token_expires_at and account.token_expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token expired. Please refresh or reconnect the account."
        )

    # Instagram wymaga obrazka
    if account.account_type in ('instagram_business', 'instagram_creator') and not request.image_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Instagram requires an image for every post"
        )

    platform = SocialPlatform(account.platform)

    # Przygotuj parametry per platforma
    kwargs = {}

    if platform == SocialPlatform.FACEBOOK:
        if not request.page_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="page_id is required for Facebook posts"
            )

        # Pobierz Page Access Token
        pages = await social_manager.get_facebook_pages(account.access_token)
        page_token = None
        for page in pages:
            if page.get("id") == request.page_id:
                page_token = page.get("access_token")
                break

        if not page_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Page not found or no access token"
            )

        kwargs["page_id"] = request.page_id
        access_token = social_manager.encrypt_token(page_token)

    elif platform == SocialPlatform.INSTAGRAM:
        ig_account_id = request.instagram_account_id or account.instagram_account_id
        if not ig_account_id:
            ig_account_id = account.profile_data.get("id") if account.profile_data else None

        if not ig_account_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Instagram account ID not found"
            )

        kwargs["instagram_account_id"] = ig_account_id
        access_token = account.access_token

    else:  # LinkedIn
        user_id = account.profile_data.get("sub") or account.profile_data.get("id") if account.profile_data else None
        if user_id:
            kwargs["author_urn"] = f"urn:li:person:{user_id}"
        access_token = account.access_token

    # Publikuj
    publish_result = await social_manager.publish_post(
        platform=platform,
        access_token=access_token,
        content=request.content,
        image_url=request.image_url,
        link_url=request.link_url,
        **kwargs
    )

    # Aktualizuj statystyki i status
    if publish_result.success:
        account.posts_published = (account.posts_published or 0) + 1
        account.last_used_at = datetime.utcnow()
        account.last_error = None
    else:
        account.last_error = publish_result.error

    await db.commit()

    return PublishPostResponse(
        success=publish_result.success,
        platform=SchemaPlatform(platform.value),
        post_id=publish_result.post_id,
        post_url=publish_result.post_url,
        published_at=datetime.utcnow() if publish_result.success else None,
        error=publish_result.error,
        error_code=publish_result.error_code
    )


# ==================== Platform Info ====================

@router.get("/platforms")
async def get_platforms():
    """Zwraca listę dostępnych platform i ich status konfiguracji."""
    return social_manager.get_available_platforms()


# ==================== Helpers ====================

async def _get_user_account(
        db: AsyncSession,
        account_id: int,
        user_id: int
) -> SocialAccount:
    """Pobiera konto użytkownika lub rzuca 404."""
    result = await db.execute(
        select(SocialAccount).where(
            and_(
                SocialAccount.id == account_id,
                SocialAccount.user_id == user_id
            )
        )
    )
    account = result.scalar_one_or_none()

    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )

    return account


def _determine_account_type(platform: SocialPlatform, profile_data: dict) -> AccountType:
    """Określa typ konta na podstawie platformy i danych profilu."""
    if platform == SocialPlatform.FACEBOOK:
        # Facebook zawsze jako Page (nie wspieramy profili osobistych)
        return AccountType.FACEBOOK_PAGE

    elif platform == SocialPlatform.INSTAGRAM:
        # Sprawdź typ konta IG
        ig_type = profile_data.get("account_type", "").upper() if profile_data else ""
        if ig_type == "CREATOR":
            return AccountType.INSTAGRAM_CREATOR
        return AccountType.INSTAGRAM_BUSINESS

    elif platform == SocialPlatform.LINKEDIN:
        # Sprawdź czy to company page czy profil
        if profile_data and profile_data.get("organization_id"):
            return AccountType.LINKEDIN_COMPANY
        return AccountType.LINKEDIN_PROFILE

    # Domyślnie
    return AccountType.FACEBOOK_PAGE


async def _build_account_response(account: SocialAccount) -> ConnectedAccountResponse:
    """Buduje response dla konta."""
    # Określ status
    if not account.is_active:
        conn_status = ConnectionStatus.DISCONNECTED
    elif account.token_expires_at and account.token_expires_at < datetime.utcnow():
        conn_status = ConnectionStatus.EXPIRED
    elif account.last_error:
        conn_status = ConnectionStatus.ERROR
    else:
        conn_status = ConnectionStatus.CONNECTED

    # Avatar z profile_data
    avatar_url = None
    if account.profile_data:
        avatar_url = (
                account.profile_data.get("picture", {}).get("data", {}).get("url") or
                account.profile_data.get("profile_picture_url") or
                account.profile_data.get("picture")
        )

    # Capabilities
    account_type = AccountType(account.account_type)
    caps = ACCOUNT_CAPABILITIES.get(account_type, {})

    # Facebook pages
    pages = None
    if account.platform == "facebook" and conn_status == ConnectionStatus.CONNECTED:
        try:
            fb_pages = await social_manager.get_facebook_pages(account.access_token)
            pages = [
                FacebookPageInfo(
                    id=p.get("id"),
                    name=p.get("name"),
                    category=p.get("category"),
                    fan_count=p.get("fan_count"),
                    picture_url=p.get("picture", {}).get("data", {}).get("url"),
                    has_access_token=bool(p.get("access_token"))
                )
                for p in fb_pages
            ]
        except Exception:
            pages = []

    # Instagram accounts
    instagram_accounts = None
    if account.platform == "instagram" and account.profile_data:
        instagram_accounts = [
            InstagramAccountInfo(
                id=account.profile_data.get("id", ""),
                username=account.profile_data.get("username", ""),
                account_type=account.account_type,
                followers_count=account.profile_data.get("followers_count"),
                media_count=account.profile_data.get("media_count"),
                profile_picture_url=account.profile_data.get("profile_picture_url"),
                connected_page_id=account.profile_data.get("connected_page_id"),
            )
        ]

    return ConnectedAccountResponse(
        id=account.id,
        platform=SchemaPlatform(account.platform),
        account_type=account_type,
        platform_user_id=account.platform_user_id,
        platform_username=account.platform_username,
        avatar_url=avatar_url,
        is_active=account.is_active,
        status=conn_status,
        connected_at=account.created_at,
        expires_at=account.token_expires_at,
        permissions=_get_platform_permissions(account.platform),
        pages=pages,
        instagram_accounts=instagram_accounts,
        supports_images=caps.get("supports_images", True),
        supports_videos=caps.get("supports_videos", False),
        supports_links=caps.get("supports_links", True),
        max_text_length=caps.get("max_text_length", 5000),
        requires_image=caps.get("requires_image", False),
    )


def _get_platform_permissions(platform: str) -> List[str]:
    """Zwraca domyślne uprawnienia dla platformy."""
    permissions = {
        "facebook": ["pages_manage_posts", "pages_read_engagement"],
        "instagram": ["instagram_basic", "instagram_content_publish"],
        "linkedin": ["w_member_social"],
    }
    return permissions.get(platform, [])