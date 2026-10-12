from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories import user_repo
from app.services.social.base import OAuthResult


class OAuthLoginError(Exception):
    def __init__(self, code: str, description: str):
        self.code = code
        self.description = description
        super().__init__(description)


async def find_or_create_user(
    db: AsyncSession, platform: str, result: OAuthResult
) -> tuple[User, bool]:
    provider_id = result.platform_user_id
    email = result.email or (result.profile_data or {}).get("email")
    if not provider_id or not email:
        raise OAuthLoginError("identity_incomplete", "Provider did not return a user ID and email")
    if platform == "google" and not result.email_verified:
        raise OAuthLoginError("email_unverified", "Verify your Google email address before signing in")

    user = await user_repo.get_by_oauth_identity(db, platform, provider_id)
    if user is None:
        if await user_repo.get_by_email(db, email):
            raise OAuthLoginError(
                "account_exists",
                "An account with this email already exists. Sign in using its original method",
            )
        profile = result.profile_data or {}
        avatar = profile.get("picture")
        if isinstance(avatar, dict):
            avatar = avatar.get("data", {}).get("url")
        user = User(
            email=email,
            full_name=result.platform_username or profile.get("name", ""),
            hashed_password="",
            avatar_url=avatar,
            oauth_provider=platform,
            oauth_provider_id=provider_id,
            is_active=True,
            is_verified=result.email_verified,
        )
        db.add(user)
        await db.flush()
        return user, True

    if not user.is_active:
        raise OAuthLoginError("user_inactive", "User account is inactive")
    if platform == "google" and not user.is_verified:
        user.is_verified = True
    if not user.avatar_url and result.profile_data:
        avatar = result.profile_data.get("picture")
        if isinstance(avatar, dict):
            avatar = avatar.get("data", {}).get("url")
        if avatar:
            user.avatar_url = avatar
    return user, False
