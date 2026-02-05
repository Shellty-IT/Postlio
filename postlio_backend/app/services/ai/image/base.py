# postlio_backend/app/services/ai/image/base.py

from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
from enum import Enum


class ImageProvider(str, Enum):
    """Available image generation providers."""
    POLLINATIONS = "pollinations"  # Flux, Nanobanana
    HUGGINGFACE = "huggingface"    # Stable Diffusion XL


class ImageStyle(str, Enum):
    """Available image styles."""
    REALISTIC = "realistic"
    ARTISTIC = "artistic"
    CARTOON = "cartoon"
    MINIMALIST = "minimalist"
    VIBRANT = "vibrant"
    PROFESSIONAL = "professional"


class BaseImageProvider(ABC):
    """Base class for all image providers."""

    name: str
    models: List[str] = []
    is_free: bool = True

    @property
    @abstractmethod
    def is_available(self) -> bool:
        """Check if the provider is available (API key configured, etc.)."""
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
        """Generate an image from a text prompt."""
        pass

    def _enhance_prompt(self, prompt: str, style: Optional[str] = None) -> str:
        """Enhance the prompt with style modifiers."""
        style_modifiers = {
            ImageStyle.REALISTIC.value: "photorealistic, highly detailed, 8k, professional photography",
            ImageStyle.ARTISTIC.value: "artistic, painterly, creative, expressive, fine art",
            ImageStyle.CARTOON.value: "cartoon style, animated, colorful, fun, illustration",
            ImageStyle.MINIMALIST.value: "minimalist, clean, simple, modern, elegant design",
            ImageStyle.VIBRANT.value: "vibrant colors, dynamic, energetic, bold, eye-catching",
            ImageStyle.PROFESSIONAL.value: "professional, clean, corporate, polished, business",
        }

        if style and style in style_modifiers:
            return f"{prompt}, {style_modifiers[style]}"
        return prompt