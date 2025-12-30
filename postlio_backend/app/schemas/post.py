from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from enum import Enum


class Platform(str, Enum):
    FACEBOOK = "facebook"
    INSTAGRAM = "instagram"
    LINKEDIN = "linkedin"


class PostStatus(str, Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    PUBLISHING = "publishing"
    PUBLISHED = "published"
    FAILED = "failed"


# ============ Request Schemas ============

class PostCreate(BaseModel):
    """Schema for creating a new post."""
    content: str = Field(..., min_length=1, max_length=5000)
    platform: Platform
    brand_id: Optional[int] = None
    image_url: Optional[str] = None
    image_prompt: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    ai_generated: bool = False
    ai_model: Optional[str] = None
    generation_params: Optional[dict] = None


class PostUpdate(BaseModel):
    """Schema for updating a post."""
    content: Optional[str] = Field(None, min_length=1, max_length=5000)
    platform: Optional[Platform] = None
    brand_id: Optional[int] = None
    image_url: Optional[str] = None
    image_prompt: Optional[str] = None
    status: Optional[PostStatus] = None
    scheduled_at: Optional[datetime] = None


class PostSchedule(BaseModel):
    """Schema for scheduling a post."""
    scheduled_at: datetime


# ============ Response Schemas ============

class PostResponse(BaseModel):
    """Single post response."""
    id: int
    user_id: int
    brand_id: Optional[int] = None
    content: str
    image_url: Optional[str] = None
    image_prompt: Optional[str] = None
    platform: str
    platform_post_id: Optional[str] = None
    status: str
    scheduled_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    ai_generated: bool
    ai_model: Optional[str] = None
    generation_params: Optional[dict] = None
    likes: int
    comments: int
    shares: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PostsListResponse(BaseModel):
    """List of posts response."""
    posts: List[PostResponse]
    count: int


# ============ Calendar Schemas ============

class CalendarEventResponse(BaseModel):
    """Calendar event representation of a post."""
    id: str
    post_id: str
    title: str
    date: str  # Format: YYYY-MM-DD
    time: str  # Format: HH:MM
    platforms: List[str]
    status: str
    preview: Optional[str] = None
    image_url: Optional[str] = None
    brand_id: Optional[int] = None


class CalendarEventsResponse(BaseModel):
    """List of calendar events."""
    events: List[CalendarEventResponse]
    count: int