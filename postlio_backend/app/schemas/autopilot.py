# app/schemas/autopilot.py
"""
Autopilot Schemas
Pydantic models dla API Autopilota
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator
from enum import Enum


# === Enums ===

class AutopilotStatusEnum(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    PUBLISHED = "published"
    FAILED = "failed"
    SCHEDULED = "scheduled"


class PostLengthEnum(str, Enum):
    SHORT = "short"
    MEDIUM = "medium"
    LONG = "long"


class DayOfWeek(str, Enum):
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"


# === Config Schemas ===

class AutopilotConfigBase(BaseModel):
    """Bazowe pola konfiguracji"""
    posts_per_week: int = Field(default=3, ge=1, le=14)
    schedule_days: List[str] = Field(default=["monday", "wednesday", "friday"])
    schedule_time: str = Field(default="10:00", pattern=r"^\d{2}:\d{2}$")
    timezone: str = Field(default="Europe/Warsaw")

    platforms: List[str] = Field(default=["facebook", "instagram"])
    categories: List[str] = Field(default=["lifestyle"])

    creativity_level: int = Field(default=50, ge=0, le=100)
    post_length: PostLengthEnum = Field(default=PostLengthEnum.MEDIUM)
    include_images: bool = True
    include_hashtags: bool = True
    include_emoji: bool = True

    text_provider: str = Field(default="gemini")
    image_provider: str = Field(default="pollinations")
    image_style: str = Field(default="realistic")

    @field_validator('schedule_days')
    @classmethod
    def validate_days(cls, v):
        valid_days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        for day in v:
            if day.lower() not in valid_days:
                raise ValueError(f'Invalid day: {day}')
        return [d.lower() for d in v]

    @field_validator('platforms')
    @classmethod
    def validate_platforms(cls, v):
        valid_platforms = ['facebook', 'instagram', 'linkedin']
        for platform in v:
            if platform.lower() not in valid_platforms:
                raise ValueError(f'Invalid platform: {platform}')
        return [p.lower() for p in v]


class AutopilotConfigCreate(AutopilotConfigBase):
    """Schema do tworzenia konfiguracji"""
    brand_id: int


class AutopilotConfigUpdate(BaseModel):
    """Schema do aktualizacji konfiguracji"""
    is_active: Optional[bool] = None
    is_paused: Optional[bool] = None
    posts_per_week: Optional[int] = Field(default=None, ge=1, le=14)
    schedule_days: Optional[List[str]] = None
    schedule_time: Optional[str] = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    timezone: Optional[str] = None
    platforms: Optional[List[str]] = None
    categories: Optional[List[str]] = None
    creativity_level: Optional[int] = Field(default=None, ge=0, le=100)
    post_length: Optional[PostLengthEnum] = None
    include_images: Optional[bool] = None
    include_hashtags: Optional[bool] = None
    include_emoji: Optional[bool] = None
    text_provider: Optional[str] = None
    image_provider: Optional[str] = None
    image_style: Optional[str] = None
    # Nowe pola
    social_account_mapping: Optional[Dict[str, int]] = None
    auto_publish_on_approve: Optional[bool] = None


class AutopilotConfigResponse(AutopilotConfigBase):
    """Schema odpowiedzi dla konfiguracji"""
    id: int
    user_id: int
    brand_id: int
    is_active: bool
    is_paused: bool

    # Nowe pola social
    social_account_mapping: Dict[str, int] = Field(default={})
    auto_publish_on_approve: bool = False

    # Stats
    total_generated: int
    total_approved: int
    total_rejected: int
    total_published: int
    streak_days: int
    last_generation_at: Optional[datetime]
    last_published_at: Optional[datetime]

    created_at: datetime
    updated_at: datetime

    # Computed fields
    health_score: Optional[int] = None
    next_generation_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# === Queue Item Schemas ===

class QueueItemBase(BaseModel):
    """Bazowe pola elementu kolejki"""
    platform: str
    content: str
    image_url: Optional[str] = None
    hashtags: List[str] = Field(default=[])
    category: Optional[str] = None


class QueueItemCreate(BaseModel):
    """Schema do ręcznego tworzenia elementu kolejki"""
    config_id: int
    platform: str
    content: str
    image_url: Optional[str] = None
    hashtags: List[str] = Field(default=[])
    scheduled_for: datetime


class QueueItemUpdate(BaseModel):
    """Schema do aktualizacji elementu kolejki"""
    content: Optional[str] = None
    image_url: Optional[str] = None
    hashtags: Optional[List[str]] = None
    status: Optional[AutopilotStatusEnum] = None
    scheduled_for: Optional[datetime] = None
    user_notes: Optional[str] = None
    social_account_id: Optional[int] = None  # ← DODANE


class QueueItemResponse(QueueItemBase):
    """Schema odpowiedzi dla elementu kolejki"""
    id: int
    config_id: int
    user_id: int
    brand_id: int

    status: str
    scheduled_for: datetime
    published_at: Optional[datetime]

    topic_used: Optional[str]
    text_provider_used: Optional[str]
    image_provider_used: Optional[str]
    generation_params: dict

    # Pola publikacji
    social_account_id: Optional[int] = None
    platform_post_id: Optional[str] = None
    platform_post_url: Optional[str] = None
    publish_error: Optional[str] = None
    publish_attempts: int = 0

    user_notes: Optional[str]
    edit_count: int

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# === Action Schemas ===

class GenerateQueueRequest(BaseModel):
    """Request do wygenerowania postów do kolejki"""
    count: int = Field(default=1, ge=1, le=10, description="Liczba postów do wygenerowania")
    topics: Optional[List[str]] = Field(
        default=None,
        description="Opcjonalne tematy - jeśli puste, AI wybierze automatycznie"
    )
    platforms: Optional[List[str]] = Field(
        default=None,
        description="Opcjonalne platformy - jeśli puste, użyje z konfiguracji"
    )


class GenerateQueueResponse(BaseModel):
    """Response po wygenerowaniu postów"""
    success: bool
    generated_count: int
    failed_count: int
    items: List[QueueItemResponse]
    errors: List[str] = Field(default=[])


class BulkActionRequest(BaseModel):
    """Request do akcji na wielu elementach"""
    item_ids: List[int]
    action: str  # approve/reject/delete/publish


class QueueStatsResponse(BaseModel):
    """Statystyki kolejki"""
    pending_count: int
    approved_count: int
    scheduled_count: int
    published_today: int
    published_this_week: int
    failed_count: int = 0  # ← DODANE - brakujące pole
    rejection_rate: float
    average_edit_count: float


# === Dashboard Schemas ===

class AutopilotDashboardResponse(BaseModel):
    """Dane dla dashboardu Autopilota"""
    config: Optional[AutopilotConfigResponse]
    queue_stats: QueueStatsResponse
    pending_items: List[QueueItemResponse]
    upcoming_items: List[QueueItemResponse]
    recent_published: List[QueueItemResponse]
    failed_items: List[QueueItemResponse] = Field(default=[])

    # Health metrics
    health_score: int
    streak_days: int
    next_post_at: Optional[datetime]

    # Social accounts status
    social_accounts_status: Dict[str, Any] = Field(default={})  # ← Zmienione na Any dla nested dict

    # Recommendations
    recommendations: List[str] = []


# === Publication Schemas ===

class PublishRequest(BaseModel):
    """Request do publikacji pojedynczego posta"""
    publish_now: bool = Field(default=True, description="Publikuj natychmiast (ignoruj scheduled_for)")
    social_account_id: Optional[int] = Field(default=None, description="Opcjonalnie nadpisz konto social")


class PublishResponse(BaseModel):
    """Response po publikacji"""
    success: bool
    item_id: int
    platform: str
    published_at: Optional[datetime] = None
    platform_post_id: Optional[str] = None
    platform_post_url: Optional[str] = None
    error: Optional[str] = None
    requires_manual: bool = False  # ← DODANE - kluczowe pole!


class BulkPublishResponse(BaseModel):
    """Response po masowej publikacji"""
    total: int
    published: int
    failed: int
    results: List[PublishResponse]


class SocialAccountStatus(BaseModel):
    """Status konta social media"""
    platform: str
    account_id: Optional[int] = None
    account_name: Optional[str] = None
    account_type: Optional[str] = None  # ← DODANE
    is_connected: bool
    is_valid: bool
    can_auto_publish: bool = False  # ← DODANE
    error: Optional[str] = None
    message: Optional[str] = None  # ← DODANE


class SocialStatusResponse(BaseModel):
    """Status połączonych kont dla konfiguracji"""
    config_id: int
    platforms: List[str] = Field(default=[])
    social_accounts_status: Dict[str, Any] = Field(default={})  # ← Zmienione na Any
    all_connected: bool = False


# === Manual Publish Schema ===

class ManualPublishDataResponse(BaseModel):
    """Dane do ręcznej publikacji (dla kont osobistych)"""
    item_id: int
    content: str
    full_content: str
    hashtags: List[str]
    hashtags_string: str
    image_url: Optional[str]
    platform: str
    platform_link: str
    instructions: str