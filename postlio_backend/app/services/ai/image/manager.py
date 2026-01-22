# postlio_backend/app/services/ai/image/manager.py

from typing import Dict, List, Optional, Any
from app.config import settings
from app.services.ai.image.base import BaseImageProvider, ImageProvider
from app.services.ai.image.pollinations import PollinationsProvider
from app.services.ai.image.huggingface import HuggingFaceProvider


# Gemini Image i ClipDrop są ukryte (wymagają billing/płatne)


class ImageAIManager:
    """Manages image AI providers."""

    def __init__(self):
        self._providers: Dict[str, BaseImageProvider] = {}
        self._initialize_providers()

    def _initialize_providers(self):
        """
        Inicjalizuj dostępnych providerów obrazów.

        Aktualnie aktywni:
        - Pollinations: darmowy, bez limitu, auto-tłumaczenie PL→EN
        - HuggingFace FLUX: darmowy, wysoka jakość, auto-tłumaczenie PL→EN

        Ukryci (wymagają płatności):
        - Gemini Image: wymaga billing w Google Cloud
        - ClipDrop: płatna subskrypcja
        """
        self._providers = {
            ImageProvider.POLLINATIONS.value: PollinationsProvider(),
            ImageProvider.HUGGINGFACE.value: HuggingFaceProvider(),
            # Płatni providerzy - zakomentowani
            # ImageProvider.GEMINI.value: GeminiImageProvider(),  # Wymaga billing
            # ImageProvider.CLIPDROP.value: ClipdropProvider(),   # Płatny
        }

    def get_provider(self, provider_name: Optional[str] = None) -> BaseImageProvider:
        """Get a specific provider or the default one."""
        name = provider_name or settings.DEFAULT_IMAGE_PROVIDER

        if name not in self._providers:
            # Fallback do pollinations jeśli nieznany provider
            print(f"⚠️ Unknown provider: {name}, falling back to pollinations")
            return self._providers[ImageProvider.POLLINATIONS.value]

        provider = self._providers[name]

        # Sprawdź dostępność
        if not provider.is_available:
            print(f"⚠️ Provider '{name}' not available, falling back to pollinations")
            return self._providers[ImageProvider.POLLINATIONS.value]

        return provider

    def list_providers(self, include_paid: bool = False) -> List[Dict]:
        """
        List all providers with their availability status.

        Args:
            include_paid: Czy uwzględnić płatnych providerów (nieużywane, zostawione dla kompatybilności)
        """
        result = []
        for name, provider in self._providers.items():
            result.append({
                "name": name,
                "display_name": self._get_display_name(name),
                "available": provider.is_available,
                "is_free": True,  # Wszystkie aktywne są darmowe
                "models": provider.models,
                "is_default": name == settings.DEFAULT_IMAGE_PROVIDER,
                "description": self._get_description(name),
            })
        return result

    def _get_display_name(self, name: str) -> str:
        """Zwraca przyjazną nazwę providera."""
        display_names = {
            "pollinations": "Pollinations AI",
            "huggingface": "HuggingFace FLUX",
        }
        return display_names.get(name, name.title())

    def _get_description(self, name: str) -> str:
        """Zwraca opis providera."""
        descriptions = {
            "pollinations": "Darmowy, szybki, bez limitu. Automatyczne tłumaczenie PL→EN.",
            "huggingface": "FLUX model. Wysoka jakość. Automatyczne tłumaczenie PL→EN.",
        }
        return descriptions.get(name, "")

    def get_available_providers(self, include_paid: bool = False) -> List[str]:
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
        print(f"🖼️ Image generation: Using {provider_instance.name}")

        result = await provider_instance.generate_image(
            prompt=prompt,
            style=style,
            width=width,
            height=height,
            model=model,
        )

        return result


image_ai_manager = ImageAIManager()