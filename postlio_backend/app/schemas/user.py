"""
Schematy Pydantic dla użytkownika.
"""
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional


# === REQUEST SCHEMAS ===

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    full_name: Optional[str] = Field(None, max_length=255)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class OnboardingComplete(BaseModel):
    """Request do oznaczenia onboardingu jako ukończonego."""
    skipped: bool = False


# === RESPONSE SCHEMAS ===

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    is_active: bool
    is_verified: bool
    created_at: datetime

    # Trial & Onboarding
    trial_ends_at: Optional[datetime] = None
    is_trial_active: bool = True
    trial_days_remaining: int = 14
    onboarding_completed_at: Optional[datetime] = None
    onboarding_skipped: bool = False
    needs_onboarding: bool = True

    class Config:
        from_attributes = True


class UserBasicResponse(BaseModel):
    """Uproszczona odpowiedź użytkownika (bez pól onboardingu)."""
    id: int
    email: str
    full_name: Optional[str]
    is_active: bool
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: int  # user_id
    exp: datetime
    type: str  # "access" or "refresh"