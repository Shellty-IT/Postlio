from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
from enum import Enum


class ImageProvider(str, Enum):
    POLLINATIONS = "pollinations"
    CLIPDROP = "clipdrop"
    HUGGINGFACE = "huggingface"


class ImageStyle(str, Enum):
    REALISTIC = "realistic"
    ARTISTIC = "artistic"
    CARTOON = "cartoon"
    MINIMALIST = "minimalist"
    VIBRANT = "vibrant"
    PROFESSIONAL = "professional"


class BaseImageProvider(ABC):
    """Abstract base class for image AI providers."""

    name: str = "base"
    models: List[str] = []

    @property
    @abstractmethod
    def is_available(self) -> bool:
        """Check if provider is available."""
        pass

    @abstractmethod
    async def generate_image(
            self,
            prompt: str,
            style: Optional[str] = None,
            width: int = 1024,
            height: int = 1024,
            model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate an image from prompt."""
        pass

    def _enhance_prompt(
            self,
            prompt: str,
            style: Optional[str] = None,
            platform: Optional[str] = None,
    ) -> str:
        """Enhance prompt for better results."""

        style_additions = {
            "realistic": "photorealistic, high quality, detailed, 8k",
            "artistic": "artistic, creative, beautiful composition",
            "cartoon": "cartoon style, colorful, fun",
            "minimalist": "minimalist, clean, simple, modern",
            "vibrant": "vibrant colors, eye-catching, dynamic",
            "professional": "professional, corporate, clean, modern",
        }

        platform_sizes = {
            "instagram": "square format, instagram-ready",
            "facebook": "landscape format, facebook-ready",
            "linkedin": "professional style, linkedin-ready",
        }

        enhanced = prompt

        if style and style in style_additions:
            enhanced += f", {style_additions[style]}"

        if platform and platform in platform_sizes:
            enhanced += f", {platform_sizes[platform]}"

        return enhanced