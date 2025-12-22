from typing import Dict, List, Optional
from app.config import settings
from app.services.ai.image.base import BaseImageProvider, ImageProvider
from app.services.ai.image.pollinations import PollinationsProvider
from app.services.ai.image.clipdrop import ClipdropProvider
from app.services.ai.image.huggingface import HuggingFaceProvider


class ImageAIManager:
    """Manages image AI providers."""

    def __init__(self):
        self._providers: Dict[str, BaseImageProvider] = {}
        self._initialize_providers()

    def _initialize_providers(self):
        self._providers = {
            ImageProvider.POLLINATIONS.value: PollinationsProvider(),
            ImageProvider.CLIPDROP.value: ClipdropProvider(),
            ImageProvider.HUGGINGFACE.value: HuggingFaceProvider(),
        }

    def get_provider(self, provider_name: Optional[str] = None) -> BaseImageProvider:
        """Get a specific provider or the default one."""
        name = provider_name or settings.DEFAULT_IMAGE_PROVIDER

        if name not in self._providers:
            raise ValueError(f"Unknown provider: {name}. Available: {list(self._providers.keys())}")

        return self._providers[name]

    def list_providers(self) -> List[Dict]:
        """List all providers with their availability status."""
        return [
            {
                "name": name,
                "available": provider.is_available,
                "models": provider.models,
                "is_default": name == settings.DEFAULT_IMAGE_PROVIDER,
            }
            for name, provider in self._providers.items()
        ]

    def get_available_providers(self) -> List[str]:
        """Get list of available providers."""
        return [
            name for name, provider in self._providers.items()
            if provider.is_available
        ]


image_ai_manager = ImageAIManager()