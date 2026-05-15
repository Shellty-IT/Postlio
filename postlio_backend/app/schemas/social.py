"""
Schematy Pydantic dla Social Media API.
Obsługuje zarówno konta firmowe (auto-publish) jak i osobiste (manual publish).
"""

from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any, Set
from pydantic import BaseModel, Field


# ==================== Enums ====================

class SocialPlatform(str, Enum):
    """Obsługiwane platformy."""
    FACEBOOK = "facebook"
    INSTAGRAM = "instagram"
    LINKEDIN = "linkedin"


class AccountType(str, Enum):
    """
    Typ konta social media.

    FIRMOWE (supports_auto_publish=True):
    - facebook_page: Strona Facebook
    - instagram_business: Konto biznesowe Instagram
    - instagram_creator: Konto twórcy Instagram
    - linkedin_company: Strona firmowa LinkedIn

    OSOBISTE (supports_auto_publish=False):
    - facebook_personal: Profil osobisty Facebook
    - instagram_personal: Konto osobiste Instagram
    - linkedin_personal: Profil osobisty LinkedIn
    """
    # Facebook
    FACEBOOK_PAGE = "facebook_page"
    FACEBOOK_PERSONAL = "facebook_personal"

    # Instagram
    INSTAGRAM_BUSINESS = "instagram_business"
    INSTAGRAM_CREATOR = "instagram_creator"
    INSTAGRAM_PERSONAL = "instagram_personal"

    # LinkedIn
    LINKEDIN_COMPANY = "linkedin_company"
    LINKEDIN_PERSONAL = "linkedin_personal"
    # Zachowujemy dla kompatybilności wstecznej (alias dla linkedin_personal)
    LINKEDIN_PROFILE = "linkedin_profile"


class ConnectionStatus(str, Enum):
    """Status połączenia konta."""
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    EXPIRED = "expired"
    ERROR = "error"


class AccessLevel(str, Enum):
    """
    Poziom dostępu użytkownika na podstawie podłączonych kont.
    """
    FULL = "full"  # Ma konto firmowe - pełny dostęp
    LIMITED = "limited"  # Ma tylko konto osobiste - ograniczony dostęp
    DEMO = "demo"  # Brak kont - tryb demo


# ==================== Account Type Sets ====================

# Konta firmowe - wspierają automatyczną publikację
BUSINESS_ACCOUNT_TYPES: Set[AccountType] = {
    AccountType.FACEBOOK_PAGE,
    AccountType.INSTAGRAM_BUSINESS,
    AccountType.INSTAGRAM_CREATOR,
    AccountType.LINKEDIN_COMPANY,
}

# Konta osobiste - wymagają ręcznej publikacji
PERSONAL_ACCOUNT_TYPES: Set[AccountType] = {
    AccountType.FACEBOOK_PERSONAL,
    AccountType.INSTAGRAM_PERSONAL,
    AccountType.LINKEDIN_PERSONAL,
    AccountType.LINKEDIN_PROFILE,  # Alias
}

# Mapowanie platform na typy firmowe
PLATFORM_BUSINESS_TYPES: Dict[SocialPlatform, Set[AccountType]] = {
    SocialPlatform.FACEBOOK: {AccountType.FACEBOOK_PAGE},
    SocialPlatform.INSTAGRAM: {AccountType.INSTAGRAM_BUSINESS, AccountType.INSTAGRAM_CREATOR},
    SocialPlatform.LINKEDIN: {AccountType.LINKEDIN_COMPANY},
}

# Mapowanie platform na typy osobiste
PLATFORM_PERSONAL_TYPES: Dict[SocialPlatform, Set[AccountType]] = {
    SocialPlatform.FACEBOOK: {AccountType.FACEBOOK_PERSONAL},
    SocialPlatform.INSTAGRAM: {AccountType.INSTAGRAM_PERSONAL},
    SocialPlatform.LINKEDIN: {AccountType.LINKEDIN_PERSONAL, AccountType.LINKEDIN_PROFILE},
}

# ==================== Account Capabilities ====================

ACCOUNT_CAPABILITIES: Dict[AccountType, Dict[str, Any]] = {
    # === FACEBOOK ===
    AccountType.FACEBOOK_PAGE: {
        "platform": SocialPlatform.FACEBOOK,
        "is_business": True,
        "supports_auto_publish": True,
        "supports_images": True,
        "supports_videos": True,
        "supports_links": True,
        "supports_scheduling": True,
        "supports_autopilot": True,
        "max_text_length": 63206,
        "display_name": "Strona Facebook",
        "description": "Pełny dostęp do automatycznej publikacji",
        "icon": "facebook-page",
    },
    AccountType.FACEBOOK_PERSONAL: {
        "platform": SocialPlatform.FACEBOOK,
        "is_business": False,
        "supports_auto_publish": False,
        "supports_images": True,
        "supports_videos": True,
        "supports_links": True,
        "supports_scheduling": False,  # Tylko przypomnienia
        "supports_autopilot": False,
        "supports_share_dialog": True,  # Może używać Share Dialog
        "max_text_length": 63206,
        "display_name": "Profil Facebook",
        "description": "Publikacja przez okno udostępniania",
        "icon": "facebook-profile",
        "publish_method": "share_dialog",
    },

    # === INSTAGRAM ===
    AccountType.INSTAGRAM_BUSINESS: {
        "platform": SocialPlatform.INSTAGRAM,
        "is_business": True,
        "supports_auto_publish": True,
        "supports_images": True,
        "supports_videos": True,
        "supports_links": False,
        "supports_scheduling": True,
        "supports_autopilot": True,
        "max_text_length": 2200,
        "max_hashtags": 30,
        "requires_image": True,
        "display_name": "Instagram Business",
        "description": "Pełny dostęp do automatycznej publikacji",
        "icon": "instagram-business",
    },
    AccountType.INSTAGRAM_CREATOR: {
        "platform": SocialPlatform.INSTAGRAM,
        "is_business": True,
        "supports_auto_publish": True,
        "supports_images": True,
        "supports_videos": True,
        "supports_links": False,
        "supports_scheduling": True,
        "supports_autopilot": True,
        "max_text_length": 2200,
        "max_hashtags": 30,
        "requires_image": True,
        "display_name": "Instagram Creator",
        "description": "Pełny dostęp do automatycznej publikacji",
        "icon": "instagram-creator",
    },
    AccountType.INSTAGRAM_PERSONAL: {
        "platform": SocialPlatform.INSTAGRAM,
        "is_business": False,
        "supports_auto_publish": False,
        "supports_images": True,
        "supports_videos": True,
        "supports_links": False,
        "supports_scheduling": False,
        "supports_autopilot": False,
        "supports_share_dialog": False,  # IG nie ma Share Dialog
        "supports_deeplink": True,  # Może otwierać aplikację IG
        "max_text_length": 2200,
        "max_hashtags": 30,
        "requires_image": True,
        "display_name": "Instagram (osobiste)",
        "description": "Kopiuj treść i opublikuj ręcznie w aplikacji",
        "icon": "instagram-personal",
        "publish_method": "manual_copy",
    },

    # === LINKEDIN ===
    AccountType.LINKEDIN_COMPANY: {
        "platform": SocialPlatform.LINKEDIN,
        "is_business": True,
        "supports_auto_publish": True,
        "supports_images": True,
        "supports_videos": False,
        "supports_links": True,
        "supports_scheduling": True,
        "supports_autopilot": True,
        "max_text_length": 3000,
        "display_name": "Strona firmowa LinkedIn",
        "description": "Pełny dostęp do automatycznej publikacji",
        "icon": "linkedin-company",
    },
    AccountType.LINKEDIN_PERSONAL: {
        "platform": SocialPlatform.LINKEDIN,
        "is_business": False,
        "supports_auto_publish": False,
        "supports_images": True,
        "supports_videos": False,
        "supports_links": True,
        "supports_scheduling": False,
        "supports_autopilot": False,
        "supports_share_dialog": True,
        "max_text_length": 3000,
        "display_name": "Profil LinkedIn",
        "description": "Publikacja przez okno udostępniania",
        "icon": "linkedin-profile",
        "publish_method": "share_dialog",
    },
    # Alias dla kompatybilności wstecznej
    AccountType.LINKEDIN_PROFILE: {
        "platform": SocialPlatform.LINKEDIN,
        "is_business": False,
        "supports_auto_publish": False,
        "supports_images": True,
        "supports_videos": False,
        "supports_links": True,
        "supports_scheduling": False,
        "supports_autopilot": False,
        "supports_share_dialog": True,
        "max_text_length": 3000,
        "display_name": "Profil LinkedIn",
        "description": "Publikacja przez okno udostępniania",
        "icon": "linkedin-profile",
        "publish_method": "share_dialog",
    },
}


# ==================== Helper Functions ====================

def is_business_account(account_type: AccountType) -> bool:
    """Sprawdza czy typ konta jest kontem firmowym."""
    return account_type in BUSINESS_ACCOUNT_TYPES


def is_personal_account(account_type: AccountType) -> bool:
    """Sprawdza czy typ konta jest kontem osobistym."""
    return account_type in PERSONAL_ACCOUNT_TYPES


def supports_auto_publish(account_type: AccountType) -> bool:
    """Sprawdza czy typ konta wspiera automatyczną publikację."""
    caps = ACCOUNT_CAPABILITIES.get(account_type, {})
    return caps.get("supports_auto_publish", False)


def supports_autopilot(account_type: AccountType) -> bool:
    """Sprawdza czy typ konta wspiera Autopilot AI."""
    caps = ACCOUNT_CAPABILITIES.get(account_type, {})
    return caps.get("supports_autopilot", False)


def supports_scheduling(account_type: AccountType) -> bool:
    """Sprawdza czy typ konta wspiera harmonogram (auto lub przypomnienia)."""
    # Konta firmowe - pełny scheduling
    # Konta osobiste - tylko przypomnienia
    caps = ACCOUNT_CAPABILITIES.get(account_type, {})
    return caps.get("supports_scheduling", False)


def requires_image(account_type: AccountType) -> bool:
    """Sprawdza czy typ konta wymaga obrazka (Instagram)."""
    caps = ACCOUNT_CAPABILITIES.get(account_type, {})
    return caps.get("requires_image", False)


def get_account_capabilities(account_type: AccountType) -> Dict[str, Any]:
    """Zwraca pełne możliwości dla typu konta."""
    return ACCOUNT_CAPABILITIES.get(account_type, {})


def get_display_name(account_type: AccountType) -> str:
    """Zwraca przyjazną nazwę typu konta."""
    caps = ACCOUNT_CAPABILITIES.get(account_type, {})
    return caps.get("display_name", str(account_type.value))


def get_publish_method(account_type: AccountType) -> str:
    """
    Zwraca metodę publikacji dla typu konta.

    Returns:
        - "auto": Automatyczna publikacja przez API
        - "share_dialog": Publikacja przez Share Dialog platformy
        - "manual_copy": Ręczne kopiowanie i publikacja
    """
    if supports_auto_publish(account_type):
        return "auto"
    caps = ACCOUNT_CAPABILITIES.get(account_type, {})
    return caps.get("publish_method", "manual_copy")


def get_platform_for_account_type(account_type: AccountType) -> SocialPlatform:
    """Zwraca platformę dla typu konta."""
    caps = ACCOUNT_CAPABILITIES.get(account_type, {})
    return caps.get("platform", SocialPlatform.FACEBOOK)


def get_business_account_types_for_platform(platform: SocialPlatform) -> Set[AccountType]:
    """Zwraca typy kont firmowych dla platformy."""
    return PLATFORM_BUSINESS_TYPES.get(platform, set())


def get_personal_account_type_for_platform(platform: SocialPlatform) -> Optional[AccountType]:
    """Zwraca typ konta osobistego dla platformy."""
    types = PLATFORM_PERSONAL_TYPES.get(platform, set())
    # Zwróć pierwszy (główny) typ, pomijając aliasy
    for t in types:
        if t != AccountType.LINKEDIN_PROFILE:  # Pomiń alias
            return t
    return None


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

    # Dodatkowe info o typie konta
    is_business_account: bool = False
    supports_auto_publish: bool = False
    supports_autopilot: bool = False
    display_name: Optional[str] = None

    # Info dla onboardingu
    upgrade_message: Optional[str] = None  # Komunikat jeśli konto osobiste

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
    connected_page_id: Optional[str] = None


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

    # Capabilities (z ACCOUNT_CAPABILITIES)
    is_business_account: bool = False
    supports_auto_publish: bool = False
    supports_autopilot: bool = False
    supports_images: bool = True
    supports_videos: bool = False
    supports_links: bool = True
    supports_scheduling: bool = False
    max_text_length: int = 5000
    requires_image: bool = False
    display_name: str = ""
    publish_method: str = "manual_copy"

    class Config:
        from_attributes = True


class ListAccountsResponse(BaseModel):
    """Lista połączonych kont użytkownika."""
    accounts: List[ConnectedAccountResponse]
    total: int

    # Podsumowanie możliwości
    has_business_account: bool = False
    has_personal_account: bool = False
    access_level: AccessLevel = AccessLevel.DEMO


# ==================== User Capabilities ====================

class UserCapabilities(BaseModel):
    """
    Możliwości użytkownika na podstawie podłączonych kont.
    Używane przez frontend do pokazywania/ukrywania funkcji.
    """
    # Poziom dostępu
    access_level: AccessLevel = AccessLevel.DEMO

    # Funkcje
    can_use_creator: bool = True  # Zawsze dostępne
    can_use_materials: bool = True  # Zawsze dostępne
    can_use_brands: bool = True  # Zawsze dostępne
    can_use_calendar: bool = False  # Wymaga jakiegokolwiek konta
    can_use_autopilot: bool = False  # Wymaga konta firmowego
    can_auto_publish: bool = False  # Wymaga konta firmowego

    # Szczegóły
    connected_platforms: List[SocialPlatform] = Field(default_factory=list)
    business_platforms: List[SocialPlatform] = Field(default_factory=list)
    personal_platforms: List[SocialPlatform] = Field(default_factory=list)

    # Komunikaty dla UI
    calendar_lock_message: Optional[str] = None
    autopilot_lock_message: Optional[str] = None


def compute_user_capabilities(accounts: List[ConnectedAccountResponse]) -> UserCapabilities:
    """
    Oblicza możliwości użytkownika na podstawie podłączonych kont.
    """
    if not accounts:
        return UserCapabilities(
            access_level=AccessLevel.DEMO,
            can_use_calendar=False,
            can_use_autopilot=False,
            can_auto_publish=False,
            calendar_lock_message="Podłącz konto social media aby korzystać z kalendarza",
            autopilot_lock_message="Podłącz konto firmowe aby korzystać z Autopilota",
        )

    connected_platforms = set()
    business_platforms = set()
    personal_platforms = set()
    has_business = False
    has_personal = False

    for account in accounts:
        if not account.is_active:
            continue

        platform = account.platform
        connected_platforms.add(platform)

        if account.is_business_account:
            has_business = True
            business_platforms.add(platform)
        else:
            has_personal = True
            personal_platforms.add(platform)

    # Określ poziom dostępu
    if has_business:
        access_level = AccessLevel.FULL
    elif has_personal:
        access_level = AccessLevel.LIMITED
    else:
        access_level = AccessLevel.DEMO

    # Komunikaty dla ograniczonych funkcji
    calendar_message = None
    autopilot_message = None

    if access_level == AccessLevel.LIMITED:
        autopilot_message = (
            "Autopilot wymaga konta firmowego. "
            "Podłącz Stronę Facebook, Instagram Business/Creator lub Stronę LinkedIn."
        )
    elif access_level == AccessLevel.DEMO:
        calendar_message = "Podłącz konto social media aby korzystać z kalendarza"
        autopilot_message = "Podłącz konto firmowe aby korzystać z Autopilota"

    return UserCapabilities(
        access_level=access_level,
        can_use_calendar=access_level != AccessLevel.DEMO,
        can_use_autopilot=access_level == AccessLevel.FULL,
        can_auto_publish=access_level == AccessLevel.FULL,
        connected_platforms=list(connected_platforms),
        business_platforms=list(business_platforms),
        personal_platforms=list(personal_platforms),
        calendar_lock_message=calendar_message,
        autopilot_lock_message=autopilot_message,
    )


# ==================== Publishing ====================

class PublishPostRequest(BaseModel):
    """Request publikacji posta."""
    account_id: int
    content: str = Field(..., min_length=1, max_length=10000)
    image_url: Optional[str] = None
    link_url: Optional[str] = None

    # Platform-specific
    page_id: Optional[str] = None
    instagram_account_id: Optional[str] = None

    # Scheduling
    scheduled_for: Optional[datetime] = None


class PublishPostResponse(BaseModel):
    """Response po publikacji."""
    success: bool
    platform: SocialPlatform
    post_id: Optional[str] = None
    post_url: Optional[str] = None
    published_at: Optional[datetime] = None

    # Dla kont osobistych - instrukcje ręcznej publikacji
    requires_manual_publish: bool = False
    share_dialog_url: Optional[str] = None
    deeplink_url: Optional[str] = None
    manual_instructions: Optional[str] = None

    error: Optional[str] = None
    error_code: Optional[str] = None


# ==================== Account Management ====================

class RefreshTokenResponse(BaseModel):
    """Response po odświeżeniu tokena."""
    success: bool
    expires_at: Optional[datetime] = None
    error: Optional[str] = None


# ==================== Manual Publish Helpers ====================

class ManualPublishInfo(BaseModel):
    """Informacje do ręcznej publikacji dla kont osobistych."""
    platform: SocialPlatform
    account_type: AccountType

    # Treść do skopiowania
    content: str
    hashtags: Optional[str] = None

    # URLs
    share_dialog_url: Optional[str] = None
    deeplink_url: Optional[str] = None
    web_url: Optional[str] = None  # Fallback - otwórz stronę

    # Instrukcje
    instructions: List[str] = Field(default_factory=list)


def generate_manual_publish_info(
        platform: SocialPlatform,
        account_type: AccountType,
        content: str,
        image_url: Optional[str] = None,
) -> ManualPublishInfo:
    """
    Generuje instrukcje ręcznej publikacji dla konta osobistego.
    """
    instructions = []
    share_dialog_url = None
    deeplink_url = None
    web_url = None

    # Wyodrębnij hashtagi
    import re
    hashtags_match = re.findall(r'#\w+', content)
    hashtags = ' '.join(hashtags_match) if hashtags_match else None

    if platform == SocialPlatform.FACEBOOK:
        share_dialog_url = f"https://www.facebook.com/sharer/sharer.php?quote={content[:500]}"
        deeplink_url = "fb://feed"
        web_url = "https://www.facebook.com"
        instructions = [
            "1. Kliknij 'Otwórz Facebook' lub skopiuj treść",
            "2. Wklej treść w nowy post",
            "3. Dodaj zdjęcie jeśli potrzebujesz",
            "4. Opublikuj post",
        ]

    elif platform == SocialPlatform.INSTAGRAM:
        deeplink_url = "instagram://camera"
        web_url = "https://www.instagram.com"
        instructions = [
            "1. Skopiuj treść posta",
            "2. Otwórz aplikację Instagram",
            "3. Utwórz nowy post i wybierz zdjęcie",
            "4. Wklej skopiowaną treść jako opis",
            "5. Opublikuj post",
        ]
        if image_url:
            instructions.insert(0, "0. Pobierz zdjęcie z aplikacji")

    elif platform == SocialPlatform.LINKEDIN:
        # LinkedIn Share URL
        share_dialog_url = f"https://www.linkedin.com/sharing/share-offsite/?url=&text={content[:500]}"
        deeplink_url = "linkedin://feed"
        web_url = "https://www.linkedin.com/feed"
        instructions = [
            "1. Kliknij 'Otwórz LinkedIn' lub skopiuj treść",
            "2. Wklej treść w nowy post",
            "3. Dodaj zdjęcie jeśli potrzebujesz",
            "4. Opublikuj post",
        ]

    return ManualPublishInfo(
        platform=platform,
        account_type=account_type,
        content=content,
        hashtags=hashtags,
        share_dialog_url=share_dialog_url,
        deeplink_url=deeplink_url,
        web_url=web_url,
        instructions=instructions,
    )