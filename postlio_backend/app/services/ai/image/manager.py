# postlio_backend/app/services/ai/image/manager.py

from typing import Dict, List, Optional, Any
from app.config import settings
from app.services.ai.image.base import BaseImageProvider, ImageProvider
from app.services.ai.image.pollinations import PollinationsProvider
from app.services.ai.image.huggingface import HuggingFaceProvider


class ImageAIManager:
    """Manages image AI providers."""

    def __init__(self):
        self._providers: Dict[str, BaseImageProvider] = {}
        self._initialize_providers()

    def _initialize_providers(self):
        """
        Inicjalizuj dostępnych providerów obrazów.

        Aktualnie aktywni:
        - Pollinations: Nowe API z modelami flux i nanobanana
        - HuggingFace: Stable Diffusion XL
        """
        self._providers = {
            ImageProvider.POLLINATIONS.value: PollinationsProvider(),
            ImageProvider.HUGGINGFACE.value: HuggingFaceProvider(),
        }

    def get_provider(self, provider_name: Optional[str] = None) -> BaseImageProvider:
        """Get a specific provider or the default one."""
        name = provider_name or settings.DEFAULT_IMAGE_PROVIDER

        if name not in self._providers:
            print(f"⚠️ Unknown provider: {name}, falling back to pollinations")
            return self._providers[ImageProvider.POLLINATIONS.value]

        provider = self._providers[name]

        if not provider.is_available:
            print(f"⚠️ Provider '{name}' not available, trying fallback...")
            for fallback_name, fallback_provider in self._providers.items():
                if fallback_provider.is_available:
                    print(f"✅ Using fallback: {fallback_name}")
                    return fallback_provider

            print(f"❌ No providers available!")
            return provider

        return provider

    def list_providers(self) -> List[Dict]:
        """List all providers with their availability status and models."""
        result = []
        for name, provider in self._providers.items():
            provider_info = {
                "name": name,
                "display_name": self._get_display_name(name),
                "available": provider.is_available,
                "models": provider.models,  # ✅ POPRAWKA: Lista stringów, nie słowników
                "is_default": name == settings.DEFAULT_IMAGE_PROVIDER,
                "description": self._get_description(name),
            }
            result.append(provider_info)
        return result

    def _get_display_name(self, name: str) -> str:
        """Zwraca przyjazną nazwę providera."""
        display_names = {
            "pollinations": "Pollinations AI",
            "huggingface": "HuggingFace",
        }
        return display_names.get(name, name.title())

    def _get_description(self, name: str) -> str:
        """Zwraca opis providera."""
        descriptions = {
            "pollinations": "Szybkie generowanie z automatycznym ulepszaniem promptu. Obsługuje polskie prompty.",
            "huggingface": "Stable Diffusion XL. Wysoka jakość, dłuższy czas generowania.",
        }
        return descriptions.get(name, "")

    def get_available_providers(self) -> List[str]:
        """Get list of available providers."""
        return [
            name for name, provider in self._providers.items()
            if provider.is_available
        ]

    async def generate_image(
            self,
            prompt: str,
            provider: Optional[str] = None,
            style: Optional[str] = None,
            width: int = 1024,
            height: int = 1024,
            model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generuje obraz używając wybranego providera."""
        provider_instance = self.get_provider(provider)

        print(f"🖼️ ImageAIManager: Using {provider_instance.name}, model={model}")

        result = await provider_instance.generate_image(
            prompt=prompt,
            style=style,
            width=width,
            height=height,
            model=model,
        )

        return result

    async def check_provider_status(self, provider_name: Optional[str] = None) -> Dict[str, Any]:
        """Sprawdza status providera (np. balance dla Pollinations)."""
        provider = self.get_provider(provider_name)

        status = {
            "provider": provider.name,
            "available": provider.is_available,
            "models": provider.models,
        }

        if provider.name == "pollinations" and hasattr(provider, 'check_balance'):
            balance_info = await provider.check_balance()
            if balance_info.get("success"):
                status["balance"] = balance_info.get("balance")

        return status


# Singleton instance
image_ai_manager = ImageAIManager()