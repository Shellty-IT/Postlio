# postlio_backend/app/schemas/ai.py

from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


# === ENUMS ===

class TextProviderEnum(str, Enum):
    GEMINI = "gemini"
    GROQ = "groq"


class ImageProviderEnum(str, Enum):
    POLLINATIONS = "pollinations"
    GEMINI = "gemini"  # NOWY - Gemini Image (Nano Banana)
    HUGGINGFACE = "huggingface"
    CLIPDROP = "clipdrop"  # Płatny


class CategoryEnum(str, Enum):
    FITNESS = "fitness"
    HEALTH = "health"
    BEAUTY = "beauty"
    COOKING = "cooking"
    BUSINESS = "business"
    TECHNOLOGY = "technology"
    TRAVEL = "travel"
    LIFESTYLE = "lifestyle"
    EDUCATION = "education"
    ENTERTAINMENT = "entertainment"


class ToneEnum(str, Enum):
    PROFESSIONAL = "professional"
    CASUAL = "casual"
    HUMOROUS = "humorous"
    INSPIRATIONAL = "inspirational"
    EDUCATIONAL = "educational"
    FRIENDLY = "friendly"


class PlatformEnum(str, Enum):
    FACEBOOK = "facebook"
    INSTAGRAM = "instagram"
    LINKEDIN = "linkedin"


class ImageStyleEnum(str, Enum):
    REALISTIC = "realistic"
    ARTISTIC = "artistic"
    CARTOON = "cartoon"
    MINIMALIST = "minimalist"
    VIBRANT = "vibrant"
    PROFESSIONAL = "professional"


# === TEXT REQUEST SCHEMAS ===

class GenerateTextRequest(BaseModel):
    topic: str = Field(..., min_length=3, max_length=500)
    platform: PlatformEnum
    provider: Optional[TextProviderEnum] = None
    model: Optional[str] = None
    category: Optional[CategoryEnum] = None
    tone: ToneEnum = Field(default=ToneEnum.PROFESSIONAL)
    language: str = Field(default="pl")
    include_hashtags: bool = Field(default=True)
    include_emoji: bool = Field(default=True)
    max_length: Optional[int] = None


class GenerateVariationsRequest(BaseModel):
    content: str = Field(..., min_length=10)
    platform: PlatformEnum
    provider: Optional[TextProviderEnum] = None
    model: Optional[str] = None
    variations_count: int = Field(default=3, ge=1, le=5)


class ImproveTextRequest(BaseModel):
    content: str = Field(..., min_length=10)
    platform: PlatformEnum
    provider: Optional[TextProviderEnum] = None
    model: Optional[str] = None
    instructions: Optional[str] = None


class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str


class AIChatRequest(BaseModel):
    messages: List[ChatMessage]
    provider: Optional[TextProviderEnum] = None
    model: Optional[str] = None
    category: Optional[CategoryEnum] = None
    platform: Optional[PlatformEnum] = None


# === IMAGE REQUEST SCHEMAS ===

class GenerateImageRequest(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=1000)
    provider: Optional[ImageProviderEnum] = None
    model: Optional[str] = None
    style: Optional[ImageStyleEnum] = None
    width: int = Field(default=1024, ge=256, le=2048)
    height: int = Field(default=1024, ge=256, le=2048)


# === RESPONSE SCHEMAS ===

class GeneratedTextContent(BaseModel):
    content: str
    platform: str
    provider: str
    model: Optional[str] = None
    hashtags: Optional[List[str]] = None


class GenerateTextResponse(BaseModel):
    success: bool
    data: GeneratedTextContent
    tokens_used: Optional[int] = None


class GenerateVariationsResponse(BaseModel):
    success: bool
    variations: List[str]
    provider: str


class AIChatResponse(BaseModel):
    success: bool
    message: str
    provider: str


class GeneratedImageContent(BaseModel):
    image_url: Optional[str] = None
    image_data: Optional[str] = None  # base64
    prompt: str
    prompt_translated: Optional[str] = None  # NOWE - dla auto-tłumaczenia
    prompt_enhanced: Optional[str] = None  # NOWE
    provider: str
    model: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None


class GenerateImageResponse(BaseModel):
    success: bool
    data: Optional[GeneratedImageContent] = None
    error: Optional[str] = None


class ProviderInfo(BaseModel):
    name: str
    display_name: Optional[str] = None  # NOWE
    available: bool
    is_free: Optional[bool] = True  # NOWE
    models: List[str]
    is_default: bool
    description: Optional[str] = None  # NOWE


class ProvidersListResponse(BaseModel):
    text_providers: List[ProviderInfo]
    image_providers: List[ProviderInfo]

