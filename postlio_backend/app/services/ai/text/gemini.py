import logging
from typing import Optional, List, Dict, Any
import asyncio
import google.generativeai as genai
from google.generativeai.types import GenerationConfig
from app.config import settings
from app.services.ai.text.base import BaseTextProvider

logger = logging.getLogger(__name__)


class GeminiProvider(BaseTextProvider):
    """Google Gemini AI provider - zaktualizowane modele 2024/2025."""

    name = "gemini"

    # Prawidłowe nazwy modeli (z Twojego klucza API)
    models = [
        "gemini-2.5-flash",  # ⭐ Najnowszy, najlepszy
        "gemini-2.5-pro",  # Pro wersja
        "gemini-2.5-flash-lite",  # Lżejsza wersja
        "gemini-2.0-flash",  # Stabilny 2.0
        "gemini-2.0-flash-lite",  # Lekki 2.0
    ]

    def __init__(self):
        self._client = None
        self.default_model = "gemini-2.5-flash"  # Najnowszy jako domyślny

        if settings.GOOGLE_API_KEY:
            try:
                genai.configure(api_key=settings.GOOGLE_API_KEY)
                self._client = True
                logger.info("Gemini initialized, default model: %s", self.default_model)
            except Exception as e:
                logger.error("Gemini initialization error: %s", e)
                self._client = None

    @property
    def is_available(self) -> bool:
        return self._client is not None

    def _get_model(self, model: Optional[str] = None):
        """Get Gemini model instance."""
        model_name = model if model in self.models else self.default_model

        generation_config = GenerationConfig(
            temperature=0.7,
            top_p=0.95,
            top_k=40,
            max_output_tokens=2048,
        )

        return genai.GenerativeModel(
            model_name=model_name,
            generation_config=generation_config,
        )

    async def _generate_with_retry(
            self,
            prompt: str,
            model: Optional[str] = None,
            max_retries: int = 3
    ) -> Dict[str, Any]:
        """Generate content with retry logic for quota errors."""

        models_to_try = [model or self.default_model] + [m for m in self.models if m != (model or self.default_model)]

        last_error = None

        for model_name in models_to_try:
            for attempt in range(max_retries):
                try:
                    logger.debug("Gemini: trying model=%s attempt=%d", model_name, attempt + 1)
                    model_instance = self._get_model(model_name)
                    response = await model_instance.generate_content_async(prompt)

                    if response.parts:
                        logger.debug("Gemini: success with model=%s", model_name)
                        return {
                            "success": True,
                            "text": response.text,
                            "model": model_name,
                            "tokens": self._count_tokens(response),
                        }
                    else:
                        last_error = "Empty response"

                except Exception as e:
                    error_msg = str(e)
                    last_error = error_msg
                    logger.warning("Gemini: model=%s failed: %.80s", model_name, error_msg)

                    # Jeśli 429 (quota), poczekaj i spróbuj ponownie
                    if "429" in error_msg or "quota" in error_msg.lower():
                        wait_time = (attempt + 1) * 2  # 2s, 4s, 6s
                        logger.debug("Gemini: quota exceeded, waiting %ss", wait_time)
                        await asyncio.sleep(wait_time)
                        continue

                    # Jeśli 404 (model not found), przejdź do następnego modelu
                    if "404" in error_msg or "not found" in error_msg.lower():
                        break

                    # Inne błędy - poczekaj chwilę
                    await asyncio.sleep(1)

        return {
            "success": False,
            "error": last_error or "All models failed",
        }

    def _count_tokens(self, response) -> Optional[int]:
        """Count tokens if available."""
        try:
            if hasattr(response, 'usage_metadata'):
                return response.usage_metadata.total_token_count
        except Exception:
            pass
        return None

    async def generate_post(
            self,
            topic: str,
            platform: str,
            tone: str = "professional",
            category: Optional[str] = None,
            language: str = "pl",
            include_hashtags: bool = True,
            include_emoji: bool = True,
            max_length: Optional[int] = None,
            model: Optional[str] = None,
    ) -> Dict[str, Any]:

        if not self.is_available:
            return {
                "success": False,
                "error": "Gemini API key not configured",
                "provider": self.name
            }

        system_prompt = self._build_system_prompt(
            platform, tone, category, include_emoji, include_hashtags, max_length, language
        )
        full_prompt = f"{system_prompt}\n\nNapisz post na temat: {topic}"

        result = await self._generate_with_retry(full_prompt, model)

        if not result["success"]:
            return {
                "success": False,
                "error": result["error"],
                "content": "",
                "provider": self.name
            }

        content = result["text"]

        return {
            "success": True,
            "content": content,
            "hashtags": self._extract_hashtags(content) if include_hashtags else [],
            "provider": self.name,
            "model": result["model"],
            "tokens_used": result.get("tokens"),
        }

    async def generate_variations(
            self,
            original_content: str,
            platform: str,
            count: int = 3,
            model: Optional[str] = None,
    ) -> Dict[str, Any]:

        if not self.is_available:
            return {
                "success": False,
                "error": "Gemini API key not configured",
                "provider": self.name
            }

        prompt = f"""Jesteś ekspertem od social media.
Stwórz {count} alternatywnych wersji posta dla platformy {platform.upper()}.
Zachowaj główny przekaz, zmień styl.
Odpowiedz TYLKO wariacjami, numerowane 1., 2., 3.

Oryginalny post:
{original_content}"""

        result = await self._generate_with_retry(prompt, model)

        if not result["success"]:
            return {
                "success": False,
                "error": result["error"],
                "variations": [],
                "provider": self.name
            }

        variations = self._parse_variations(result["text"], count)

        return {
            "success": True,
            "variations": variations,
            "provider": self.name,
            "model": result["model"],
        }

    async def improve_text(
            self,
            content: str,
            platform: str,
            instructions: Optional[str] = None,
            model: Optional[str] = None,
    ) -> Dict[str, Any]:

        if not self.is_available:
            return {
                "success": False,
                "error": "Gemini API key not configured",
                "provider": self.name
            }

        extra = f"\nDodatkowe instrukcje: {instructions}" if instructions else ""

        prompt = f"""Popraw ten post dla platformy {platform.upper()}.
Spraw, aby był bardziej angażujący.{extra}
Odpowiedz TYLKO poprawionym tekstem.

Post do poprawy:
{content}"""

        result = await self._generate_with_retry(prompt, model)

        if not result["success"]:
            return {
                "success": False,
                "error": result["error"],
                "content": content,
                "provider": self.name
            }

        return {
            "success": True,
            "content": result["text"],
            "provider": self.name,
            "model": result["model"],
        }

    async def chat(
            self,
            messages: List[Dict[str, str]],
            category: Optional[str] = None,
            platform: Optional[str] = None,
            model: Optional[str] = None,
    ) -> Dict[str, Any]:

        if not self.is_available:
            return {
                "success": False,
                "error": "Gemini API key not configured",
                "provider": self.name
            }

        context_parts = ["Jesteś asystentem do tworzenia treści social media."]
        if category:
            context_parts.append(f"Kategoria: {category}.")
        if platform:
            context_parts.append(f"Platforma: {platform}.")

        system_context = " ".join(context_parts)

        conversation = system_context + "\n\n"
        for msg in messages:
            role = "Użytkownik" if msg["role"] == "user" else "Asystent"
            conversation += f"{role}: {msg['content']}\n"
        conversation += "Asystent:"

        result = await self._generate_with_retry(conversation, model)

        if not result["success"]:
            return {
                "success": False,
                "error": result["error"],
                "message": "",
                "provider": self.name
            }

        return {
            "success": True,
            "message": result["text"],
            "provider": self.name,
            "model": result["model"],
        }

    async def list_available_models(self) -> List[str]:
        """List models available for the current API key."""
        if not self.is_available:
            return []

        try:
            available = []
            for model in genai.list_models():
                if 'generateContent' in model.supported_generation_methods:
                    available.append(model.name.replace("models/", ""))
            return available
        except Exception as e:
            logger.warning("Gemini: error listing models: %s", e)
            return self.models