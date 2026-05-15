# postlio_backend/app/schemas/brand.py
"""
Schematy Pydantic dla Brand i Voice DNA.
"""
from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, field_validator


# ============================================================
# VOICE DNA SCHEMAS
# ============================================================

class VoiceDNABase(BaseModel):
    """Podstawowy schemat Voice DNA."""
    tone_formality: int = Field(default=50, ge=0, le=100)
    tone_energy: int = Field(default=50, ge=0, le=100)
    tone_humor: int = Field(default=30, ge=0, le=100)
    tone_emotion: int = Field(default=50, ge=0, le=100)

    personality_traits: List[str] = Field(default_factory=lambda: ["professional", "friendly"])
    communication_style: str = Field(default="informative")

    keywords: List[str] = Field(default_factory=list)
    hashtags: List[str] = Field(default_factory=list)
    forbidden_words: List[str] = Field(default_factory=list)
    sample_posts: List[str] = Field(default_factory=list)

    emoji_usage: Literal["none", "minimal", "moderate", "frequent"] = "moderate"
    preferred_emojis: List[str] = Field(default_factory=list)

    @field_validator('personality_traits')
    @classmethod
    def validate_personality_traits(cls, v):
        valid_traits = [
            'innovative', 'traditional', 'friendly', 'professional',
            'bold', 'subtle', 'luxurious', 'accessible', 'playful',
            'serious', 'trustworthy', 'rebellious', 'caring', 'expert',
            'minimalist', 'expressive'
        ]
        return [t for t in v if t in valid_traits]

    @field_validator('communication_style')
    @classmethod
    def validate_communication_style(cls, v):
        valid_styles = [
            'informative', 'inspirational', 'educational',
            'entertaining', 'conversational', 'storytelling'
        ]
        return v if v in valid_styles else 'informative'


class VoiceDNAUpdate(BaseModel):
    """Częściowa aktualizacja Voice DNA."""
    tone_formality: Optional[int] = Field(default=None, ge=0, le=100)
    tone_energy: Optional[int] = Field(default=None, ge=0, le=100)
    tone_humor: Optional[int] = Field(default=None, ge=0, le=100)
    tone_emotion: Optional[int] = Field(default=None, ge=0, le=100)

    personality_traits: Optional[List[str]] = None
    communication_style: Optional[str] = None

    keywords: Optional[List[str]] = None
    hashtags: Optional[List[str]] = None
    forbidden_words: Optional[List[str]] = None
    sample_posts: Optional[List[str]] = None

    emoji_usage: Optional[Literal["none", "minimal", "moderate", "frequent"]] = None
    preferred_emojis: Optional[List[str]] = None


# ============================================================
# BRAND SCHEMAS
# ============================================================

class BrandBase(BaseModel):
    """Podstawowy schemat Brand."""
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: str = Field(default="#8B5CF6", pattern=r'^#[0-9A-Fa-f]{6}$')
    secondary_color: Optional[str] = Field(default=None, pattern=r'^#[0-9A-Fa-f]{6}$')
    industry: Optional[str] = None
    target_audience: Optional[str] = None


class BrandCreate(BrandBase):
    """Schemat tworzenia Brand."""
    voice_dna: Optional[VoiceDNABase] = None


class BrandUpdate(BaseModel):
    """Schemat aktualizacji Brand."""
    name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    description: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: Optional[str] = Field(default=None, pattern=r'^#[0-9A-Fa-f]{6}$')
    secondary_color: Optional[str] = Field(default=None, pattern=r'^#[0-9A-Fa-f]{6}$')
    industry: Optional[str] = None
    target_audience: Optional[str] = None
    voice_dna: Optional[VoiceDNAUpdate] = None
    is_active: Optional[bool] = None


class BrandResponse(BrandBase):
    """Schemat odpowiedzi Brand."""
    id: int
    voice_dna: VoiceDNABase
    is_active: bool
    is_default: bool
    posts_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BrandsListResponse(BaseModel):
    """Lista brandów."""
    brands: List[BrandResponse]
    total: int


# ============================================================
# VOICE ANALYSIS SCHEMAS
# ============================================================

class AnalyzeVoiceRequest(BaseModel):
    """Request do analizy Voice DNA."""
    sample_content: List[str] = Field(..., min_length=1, max_length=10)
    brand_id: Optional[int] = None


class VoiceAnalysisResult(BaseModel):
    """Wynik analizy Voice DNA."""
    voice_dna: VoiceDNABase
    analysis: dict = Field(default_factory=dict)
    # analysis zawiera:
    # - tone_breakdown: dict[str, float]
    # - common_phrases: list[str]
    # - vocabulary_level: str
    # - emoji_usage_detected: str
    # - hashtag_style: str


class BrandAnalytics(BaseModel):
    """Analityki brandu."""
    total_posts: int
    posts_this_month: int
    engagement_rate: float
    best_performing_platform: Optional[str]
    suggested_posting_times: List[str]