from pydantic import BaseModel, Field, model_validator
from datetime import datetime
from typing import Optional, List, Dict, Any
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


class PlatformStatusDetail(BaseModel):
    status: str = "draft"
    published_at: Optional[datetime] = None
    platform_post_id: Optional[str] = None


class PostCreate(BaseModel):
    content: Optional[str] = Field(None, max_length=5000)
    platforms: List[Platform] = Field(default_factory=lambda: [Platform.FACEBOOK])
    platform: Optional[Platform] = None
    brand_id: Optional[int] = None
    image_url: Optional[str] = None
    image_prompt: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    ai_generated: bool = False
    ai_model: Optional[str] = None
    generation_params: Optional[dict] = None

    @model_validator(mode='after')
    def validate_content_or_image(self):
        has_content = self.content and self.content.strip()
        has_image = bool(self.image_url)
        if not has_content and not has_image:
            raise ValueError('Post musi mieć treść lub zdjęcie')
        return self

    @model_validator(mode='after')
    def handle_legacy_platform(self):
        if self.platform and not self.platforms:
            self.platforms = [self.platform]
        elif self.platform and self.platform not in self.platforms:
            self.platforms.append(self.platform)
        return self


class PostUpdate(BaseModel):
    content: Optional[str] = Field(None, max_length=5000)
    platforms: Optional[List[Platform]] = None
    platform: Optional[Platform] = None
    brand_id: Optional[int] = None
    image_url: Optional[str] = None
    image_prompt: Optional[str] = None
    status: Optional[PostStatus] = None
    scheduled_at: Optional[datetime] = None
    platform_statuses: Optional[Dict[str, Any]] = None


class PostSchedule(BaseModel):
    scheduled_at: datetime


class PostPublishPlatform(BaseModel):
    platform: Platform


class PostResponse(BaseModel):
    id: int
    user_id: int
    brand_id: Optional[int] = None
    content: str
    image_url: Optional[str] = None
    image_prompt: Optional[str] = None
    platforms: List[str] = []
    platform_statuses: Dict[str, Any] = {}
    platform: Optional[str] = None
    platform_post_id: Optional[str] = None
    status: str
    scheduled_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    ai_generated: bool
    ai_model: Optional[str] = None
    generation_params: Optional[dict] = None
    likes: int = 0
    comments: int = 0
    shares: int = 0
    created_at: datetime
    updated_at: datetime
    hashtags: List[str] = []

    class Config:
        from_attributes = True

    @model_validator(mode='before')
    @classmethod
    def compute_fields(cls, data):
        if hasattr(data, '__dict__'):
            obj_dict = {}
            for key in ['id', 'user_id', 'brand_id', 'content', 'image_url', 'image_prompt',
                        'platforms', 'platform_statuses', 'platform', 'platform_post_id',
                        'status', 'scheduled_at', 'published_at', 'ai_generated', 'ai_model',
                        'generation_params', 'likes', 'comments', 'shares', 'created_at', 'updated_at']:
                if hasattr(data, key):
                    obj_dict[key] = getattr(data, key)

            if hasattr(data, 'get_overall_status'):
                obj_dict['status'] = data.get_overall_status()

            if obj_dict.get('platforms') and not obj_dict.get('platform'):
                obj_dict['platform'] = obj_dict['platforms'][0] if obj_dict['platforms'] else None

            content = obj_dict.get('content', '')
            if content:
                import re
                hashtags = re.findall(r'#(\w+)', content)
                obj_dict['hashtags'] = hashtags
            else:
                obj_dict['hashtags'] = []

            return obj_dict
        return data


class PostsListResponse(BaseModel):
    posts: List[PostResponse]
    count: int


class CalendarEventResponse(BaseModel):
    id: str
    post_id: str
    title: str
    date: str
    time: str
    platforms: List[str]
    platform_statuses: Dict[str, Any] = {}
    status: str
    preview: Optional[str] = None
    image_url: Optional[str] = None
    brand_id: Optional[int] = None


class CalendarEventsResponse(BaseModel):
    events: List[CalendarEventResponse]
    count: int