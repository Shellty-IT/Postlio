# postlio_backend/app/services/ai/video/manager.py

import logging
from typing import Dict, List, Optional, Any
from app.services.ai.video.base import BaseVideoProvider, VideoProvider
from app.services.ai.video.pollinations import PollinationsVideoProvider

logger = logging.getLogger(__name__)


class VideoAIManager:

    def __init__(self):
        self._providers: Dict[str, BaseVideoProvider] = {}
        self._initialize_providers()

    def _initialize_providers(self):
        self._providers = {
            VideoProvider.POLLINATIONS.value: PollinationsVideoProvider(),
        }

    def get_provider(self, provider_name: Optional[str] = None) -> BaseVideoProvider:
        name = provider_name or "pollinations"

        if name not in self._providers:
            logger.warning("Unknown video provider '%s', falling back to pollinations", name)
            return self._providers[VideoProvider.POLLINATIONS.value]

        provider = self._providers[name]

        if not provider.is_available:
            logger.warning("Video provider '%s' not available, trying fallback", name)
            for fallback_name, fallback_provider in self._providers.items():
                if fallback_provider.is_available:
                    logger.info("Using video fallback provider: %s", fallback_name)
                    return fallback_provider
            return provider

        return provider

    def list_providers(self) -> List[Dict]:
        result = []
        for name, provider in self._providers.items():
            model_list = []
            for m in provider.models:
                display_name = provider.MODEL_DISPLAY_NAMES.get(m, m) if hasattr(provider, 'MODEL_DISPLAY_NAMES') else m
                model_list.append({
                    "id": m,
                    "name": display_name,
                })

            provider_info = {
                "name": name,
                "display_name": self._get_display_name(name),
                "available": provider.is_available,
                "models": provider.models,
                "models_detailed": model_list,
                "is_default": True,
                "description": self._get_description(name),
            }
            result.append(provider_info)
        return result

    def _get_display_name(self, name: str) -> str:
        display_names = {
            "pollinations": "Pollinations AI Video",
        }
        return display_names.get(name, name.title())

    def _get_description(self, name: str) -> str:
        descriptions = {
            "pollinations": "Seedance Lite (animacja z promptu lub zdjęcia) i Grok Video (szybkie wideo). Obsługuje polskie prompty.",
        }
        return descriptions.get(name, "")

    def get_available_providers(self) -> List[str]:
        return [
            name for name, provider in self._providers.items()
            if provider.is_available
        ]

    async def generate_video(
            self,
            prompt: str,
            provider: Optional[str] = None,
            model: Optional[str] = None,
            width: int = 848,
            height: int = 480,
            duration: int = 5,
            reference_image: Optional[str] = None,
    ) -> Dict[str, Any]:
        provider_instance = self.get_provider(provider)

        logger.info("Video generation: provider=%s model=%s", provider_instance.name, model)

        result = await provider_instance.generate_video(
            prompt=prompt,
            model=model,
            width=width,
            height=height,
            duration=duration,
            reference_image=reference_image,
        )

        return result


video_ai_manager = VideoAIManager()
