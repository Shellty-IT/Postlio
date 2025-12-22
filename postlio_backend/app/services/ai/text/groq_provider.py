from typing import Optional, List, Dict, Any
from groq import Groq
from app.config import settings
from app.services.ai.text.base import BaseTextProvider


class GroqProvider(BaseTextProvider):
    """Groq AI provider (Llama, Mixtral)."""

    name = "groq"
    models = [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "mixtral-8x7b-32768",
        "gemma2-9b-it",
    ]

    def __init__(self):
        self.client = None
        self.default_model = "llama-3.3-70b-versatile"

        if settings.GROQ_API_KEY:
            self.client = Groq(api_key=settings.GROQ_API_KEY)

    @property
    def is_available(self) -> bool:
        return self.client is not None

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
            return {"success": False, "error": "Groq API key not configured", "provider": self.name}

        system_prompt = self._build_system_prompt(
            platform, tone, category, include_emoji, include_hashtags, max_length, language
        )

        model_name = model if model in self.models else self.default_model

        try:
            response = self.client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Napisz post na temat: {topic}"}
                ],
                max_tokens=1024,
                temperature=0.7,
            )

            content = response.choices[0].message.content

            return {
                "success": True,
                "content": content,
                "hashtags": self._extract_hashtags(content) if include_hashtags else [],
                "tokens_used": response.usage.total_tokens,
                "provider": self.name,
                "model": model_name,
            }

        except Exception as e:
            return {"success": False, "error": str(e), "content": "", "provider": self.name}

    async def generate_variations(
            self,
            original_content: str,
            platform: str,
            count: int = 3,
            model: Optional[str] = None,
    ) -> Dict[str, Any]:

        if not self.is_available:
            return {"success": False, "error": "Groq API key not configured", "provider": self.name}

        model_name = model if model in self.models else self.default_model

        try:
            response = self.client.chat.completions.create(
                model=model_name,
                messages=[
                    {
                        "role": "system",
                        "content": f"Tworzysz alternatywne wersje postów dla {platform.upper()}. Odpowiadaj TYLKO wariacjami, numerowane 1., 2., 3."
                    },
                    {"role": "user", "content": f"Stwórz {count} wariacji:\n\n{original_content}"}
                ],
                max_tokens=2048,
            )

            variations = self._parse_variations(response.choices[0].message.content, count)

            return {
                "success": True,
                "variations": variations,
                "provider": self.name,
            }

        except Exception as e:
            return {"success": False, "error": str(e), "variations": [], "provider": self.name}

    async def improve_text(
            self,
            content: str,
            platform: str,
            instructions: Optional[str] = None,
            model: Optional[str] = None,
    ) -> Dict[str, Any]:

        if not self.is_available:
            return {"success": False, "error": "Groq API key not configured", "provider": self.name}

        extra = f"\nDodatkowe: {instructions}" if instructions else ""
        model_name = model if model in self.models else self.default_model

        try:
            response = self.client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system",
                     "content": f"Poprawiasz posty dla {platform.upper()}. Odpowiadaj TYLKO poprawionym tekstem.{extra}"},
                    {"role": "user", "content": f"Popraw:\n\n{content}"}
                ],
                max_tokens=1024,
            )

            return {
                "success": True,
                "content": response.choices[0].message.content,
                "provider": self.name,
            }

        except Exception as e:
            return {"success": False, "error": str(e), "content": content, "provider": self.name}

    async def chat(
            self,
            messages: List[Dict[str, str]],
            category: Optional[str] = None,
            platform: Optional[str] = None,
            model: Optional[str] = None,
    ) -> Dict[str, Any]:

        if not self.is_available:
            return {"success": False, "error": "Groq API key not configured", "provider": self.name}

        context = "Jesteś asystentem do tworzenia treści social media."
        if category:
            context += f" Kategoria: {category}."
        if platform:
            context += f" Platforma: {platform}."

        model_name = model if model in self.models else self.default_model

        try:
            api_messages = [{"role": "system", "content": context}]
            api_messages.extend(messages)

            response = self.client.chat.completions.create(
                model=model_name,
                messages=api_messages,
                max_tokens=1024,
            )

            return {
                "success": True,
                "message": response.choices[0].message.content,
                "provider": self.name,
            }

        except Exception as e:
            return {"success": False, "error": str(e), "message": "", "provider": self.name}