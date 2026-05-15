# postlio_backend/app/api/v1/__init__.py
"""
API v1 endpoints.
"""
from . import auth, posts, brands, ai, autopilot, social  # ← DODANE: social

__all__ = ["auth", "posts", "brands", "ai", "autopilot", "social"]  # ← DODANE: social