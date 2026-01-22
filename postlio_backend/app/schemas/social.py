# postlio_backend/app/schemas/social.py
"""
Schematy Pydantic dla Social Media API.
Tylko oficjalnie wspierane typy kont.
"""

from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


# ==================== Enums ====================

class SocialPlatform(str, Enum):
    """Obsługiwane platformy."""
    FACEBOOK = "facebook"
    INSTAGRAM = "instagram"
    LINKEDIN = "linkedin"


class AccountType(str, Enum):
    """
    Typ konta - tylko oficjalnie wspierane przez API.
    Wszystkie wspierają automatyczną publikację.
    """
    # Facebook - tylko Pages (profile osobiste nie mają API do publikacji)
    FACEBOOK_PAGE = "facebook_page"

    # Instagram - tylko Business/Creator (przez Facebook Graph API)
    INSTAGRAM_BUSINESS = "instagram_business"
    INSTAGRAM_CREATOR = "instagram_creator"

    # LinkedIn - oba typy wspierane
    LINKEDIN_PROFILE = "linkedin_profile"
    LINKEDIN_COMPANY = "linkedin_company"


class ConnectionStatus(str, Enum):
    """Status połączenia konta."""
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    EXPIRED = "expired"
    ERROR = "error"


# ==================== Account Capabilities ====================

ACCOUNT_CAPABILITIES: Dict[AccountType, Dict[str, Any]] = {
    AccountType.FACEBOOK_PAGE: {
        "platform": SocialPlatform.FACEBOOK,
        "supports_images": True,
        "supports_videos": True,
        "supports_links": True,
        "supports_scheduling": True,
        "max_text_length": 63206,
        "description": "Strona Facebook",
    },
    AccountType.INSTAGRAM_BUSINESS: {
        "platform": SocialPlatform.INSTAGRAM,
        "supports_images": True,
        "supports_videos": True,  # Reels
        "supports_links": False,  # IG nie wspiera linków w postach
        "supports_scheduling": True,
        "max_text_length": 2200,
        "max_hashtags": 30,
        "requires_image": True,  # IG wymaga obrazka!
        "description": "Konto biznesowe Instagram",
    },
    AccountType.INSTAGRAM_CREATOR: {
        "platform": SocialPlatform.INSTAGRAM,
        "supports_images": True,
        "supports_videos": True,
        "supports_links": False,
        "supports_scheduling": True,
        "max_text_length": 2200,
        "max_hashtags": 30,
        "requires_image": True,
        "description": "Konto twórcy Instagram",
    },
    AccountType.LINKEDIN_PROFILE: {
        "platform": SocialPlatform.LINKEDIN,
        "supports_images": True,
        "supports_videos": False,
        "supports_links": True,
        "supports_scheduling": True,
        "max_text_length": 3000,
        "description": "Profil LinkedIn",
    },
    AccountType.LINKEDIN_COMPANY: {
        "platform": SocialPlatform.LINKEDIN,
        "supports_images": True,
        "supports_videos": False,
        "supports_links": True,
        "supports_scheduling": True,
        "max_text_length": 3000,
        "description": "Strona firmowa LinkedIn",
    },
}


# ==================== OAuth ====================

class OAuthInitRequest(BaseModel):
    """Request inicjalizacji OAuth."""
    platform: SocialPlatform


class OAuthInitResponse(BaseModel):
    """Response z URL do autoryzacji."""
    authorization_url: str
    state: str


class OAuthCallbackRequest(BaseModel):
    """Request z callback OAuth."""
    platform: SocialPlatform
    code: str
    state: str


class OAuthCallbackResponse(BaseModel):
    """Response po zakończeniu OAuth."""
    success: bool
    platform: SocialPlatform
    account_id: Optional[str] = None
    account_name: Optional[str] = None
    account_type: Optional[AccountType] = None
    error: Optional[str] = None
    error_description: Optional[str] = None


# ==================== Platform-specific Info ====================

class FacebookPageInfo(BaseModel):
    """Informacje o stronie Facebook."""
    id: str
    name: str
    category: Optional[str] = None
    fan_count: Optional[int] = None
    picture_url: Optional[str] = None
    has_access_token: bool = True


class InstagramAccountInfo(BaseModel):
    """Informacje o koncie Instagram Business/Creator."""
    id: str
    username: str
    account_type: str  # BUSINESS lub CREATOR
    followers_count: Optional[int] = None
    media_count: Optional[int] = None
    profile_picture_url: Optional[str] = None
    connected_page_id: Optional[str] = None  # FB Page do którego jest podłączone


# ==================== Connected Account ====================

class ConnectedAccountResponse(BaseModel):
    """Response z informacjami o koncie."""
    id: int
    platform: SocialPlatform
    account_type: AccountType

    platform_user_id: str
    platform_username: Optional[str] = None
    avatar_url: Optional[str] = None

    is_active: bool
    status: ConnectionStatus
    connected_at: datetime
    expires_at: Optional[datetime] = None

    permissions: List[str] = Field(default_factory=list)

    # Platform-specific
    pages: Optional[List[FacebookPageInfo]] = None
    instagram_accounts: Optional[List[InstagramAccountInfo]] = None

    # Capabilities
    supports_images: bool = True
    supports_videos: bool = False
    supports_links: bool = True
    max_text_length: int = 5000
    requires_image: bool = False

    class Config:
        from_attributes = True


class ListAccountsResponse(BaseModel):
    """Lista połączonych kont użytkownika."""
    accounts: List[ConnectedAccountResponse]
    total: int


# ==================== Publishing ====================

class PublishPostRequest(BaseModel):
    """Request publikacji posta."""
    account_id: int
    content: str = Field(..., min_length=1, max_length=10000)
    image_url: Optional[str] = None
    link_url: Optional[str] = None

    # Platform-specific
    page_id: Optional[str] = None  # Dla Facebook Page
    instagram_account_id: Optional[str] = None  # Dla Instagram

    # Scheduling (opcjonalne - na przyszłość)
    scheduled_for: Optional[datetime] = None


class PublishPostResponse(BaseModel):
    """Response po publikacji."""
    success: bool
    platform: SocialPlatform
    post_id: Optional[str] = None
    post_url: Optional[str] = None
    published_at: Optional[datetime] = None
    error: Optional[str] = None
    error_code: Optional[str] = None


# ==================== Account Management ====================

class RefreshTokenResponse(BaseModel):
    """Response po odświeżeniu tokena."""
    success: bool
    expires_at: Optional[datetime] = None
    error: Optional[str] = None


# ==================== Helpers ====================

def get_account_capabilities(account_type: AccountType) -> Dict[str, Any]:
    """Zwraca możliwości dla typu konta."""
    return ACCOUNT_CAPABILITIES.get(account_type, {})


def requires_image(account_type: AccountType) -> bool:
    """Sprawdza czy typ konta wymaga obrazka (Instagram)."""
    caps = ACCOUNT_CAPABILITIES.get(account_type, {})
    return caps.get("requires_image", False)