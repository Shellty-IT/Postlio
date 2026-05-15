# postlio_backend/app/services/social/__init__.py
"""
Social Media Integration Services.

Obsługuje:
- OAuth flow dla Facebook, Instagram, LinkedIn
- Publikację postów
- Pobieranie insights
- Zarządzanie tokenami
"""

from .encryption import TokenEncryption, token_encryption
from .base import (
    BaseSocialService,
    SocialPlatform,
    OAuthResult,
    PublishResult,
    AccountInfo,
    MediaUploadResult,
)
from .facebook import FacebookService, facebook_service
from .instagram import InstagramService, instagram_service
from .linkedin import LinkedInService, linkedin_service
from .manager import SocialManager, social_manager

__all__ = [
    # Encryption
    "TokenEncryption",
    "token_encryption",

    # Base
    "BaseSocialService",
    "SocialPlatform",
    "OAuthResult",
    "PublishResult",
    "AccountInfo",
    "MediaUploadResult",

    # Services
    "FacebookService",
    "facebook_service",
    "InstagramService",
    "instagram_service",
    "LinkedInService",
    "linkedin_service",

    # Manager
    "SocialManager",
    "social_manager",
]