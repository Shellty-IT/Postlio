# postlio_backend/app/services/ai/image/manager.py

import base64
import logging
from typing import Dict, List, Optional, Any
from app.config import settings
from app.services.ai.image.base import BaseImageProvider, ImageProvider
from app.services.ai.image.pollinations import PollinationsProvider
from app.services.ai.image.huggingface import HuggingFaceProvider
from app.services.storage import r2_storage

logger = logging.getLogger(__name__)


class ImageAIManager:
    """Manages image AI providers."""

    def __init__(self):
        self._providers: Dict[str, BaseImageProvider] = {}
        self._initialize_providers()

    def _initialize_providers(self):
        """
        Inicjalizuj dostępnych providerów obrazów.

        Aktualnie aktywni:
        - Pollinations: Nowe API z modelami flux i gptimage (GPT Image 1 Mini)
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
            logger.warning("Unknown image provider '%s', falling back to pollinations", name)
            return self._providers[ImageProvider.POLLINATIONS.value]

        provider = self._providers[name]

        if not provider.is_available:
            logger.warning("Image provider '%s' not available, trying fallback", name)
            for fallback_name, fallback_provider in self._providers.items():
                if fallback_provider.is_available:
                    logger.info("Using image fallback provider: %s", fallback_name)
                    return fallback_provider

            logger.error("No image providers available")
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
                "models": provider.models,
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
            "pollinations": "Flux (wysoka jakość) i GPT Image 1 Mini. Obsługuje polskie prompty z auto-tłumaczeniem.",
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

        logger.info("Image generation: provider=%s model=%s", provider_instance.name, model)

        result = await provider_instance.generate_image(
            prompt=prompt,
            style=style,
            width=width,
            height=height,
            model=model,
        )

        if result.get("success"):
            result = await self._persist_to_r2(result)

        return result

    async def _persist_to_r2(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Zamienia efemeryczny URL/base64 providera na trwaly, publiczny URL w R2.

        Bez tego zapisane posty tracą obrazy (tymczasowe URL-e wygasają albo
        wymagają autoryzacji), a Instagram Content Publishing API i tak nie
        przyjmie ani base64, ani URL-a chronionego nagłówkiem Authorization.
        """
        image_base64 = result.get("image_base64")
        if not image_base64:
            return result

        try:
            image_bytes = base64.b64decode(image_base64)
        except Exception as e:
            logger.error("Failed to decode generated image before R2 upload: %s", e)
            return result

        public_url = await r2_storage.upload_image(image_bytes)
        if public_url:
            result["image_url"] = public_url
            result["storage_persisted"] = True
        else:
            # Bez trwalego URL-a obraz zniknie z zapisanego posta i nie da sie go
            # opublikowac na Instagramie - flaga pozwala UI to zasygnalizowac.
            logger.error("R2 upload unavailable/failed, image_url stays ephemeral")
            result["storage_persisted"] = False

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


image_ai_manager = ImageAIManager()
