from typing import Dict, List, Optional
from app.config import settings
from app.services.ai.text.base import BaseTextProvider, TextProvider
from app.services.ai.text.gemini import GeminiProvider
from app.services.ai.text.groq_provider import GroqProvider


class TextAIManager:
    """Manages text AI providers."""

    def __init__(self):
        self._providers: Dict[str, BaseTextProvider] = {}
        self._initialize_providers()

    def _initialize_providers(self):
        self._providers = {
            TextProvider.GEMINI.value: GeminiProvider(),
            TextProvider.GROQ.value: GroqProvider(),
        }

    def get_provider(self, provider_name: Optional[str] = None) -> BaseTextProvider:
        """Get a specific provider or the default one."""
        name = provider_name or settings.DEFAULT_TEXT_PROVIDER

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
                "is_default": name == settings.DEFAULT_TEXT_PROVIDER,
            }
            for name, provider in self._providers.items()
        ]

    def get_available_providers(self) -> List[str]:
        """Get list of providers that have API keys configured."""
        return [
            name for name, provider in self._providers.items()
            if provider.is_available
        ]


text_ai_manager = TextAIManager()