# postlio_backend/app/services/ai/image/pollinations.py

import logging
from typing import Optional, Dict, Any
import httpx
import base64
import json
from urllib.parse import quote
from app.config import settings
from app.services.ai.image.base import BaseImageProvider

logger = logging.getLogger(__name__)


class PollinationsProvider(BaseImageProvider):


    name = "pollinations"
    models = ["flux", "gptimage"]
    is_free = False

    def __init__(self):
        self.api_key = settings.POLLINATIONS_API_KEY
        self.base_url = "https://gen.pollinations.ai/image"
        self.default_model = "flux"
        self._text_provider = None

    @property
    def is_available(self) -> bool:

        return self.api_key is not None and len(self.api_key) > 0

    async def _translate_to_english(self, text: str) -> str:

        try:
            from app.services.ai.text.gemini import GeminiProvider

            if self._text_provider is None:
                self._text_provider = GeminiProvider()

            if not self._text_provider.is_available:
                logger.warning("Pollinations: Gemini unavailable, using original prompt")
                return text

            translation_prompt = f"""Translate this image description to English.
Make it a good prompt for AI image generation - descriptive, detailed, artistic.
Return ONLY the English translation, nothing else.

Text to translate:
{text}"""

            result = await self._text_provider._generate_with_retry(translation_prompt)

            if result.get("success") and result.get("text"):
                translated = result["text"].strip().strip('"\'')
                for prefix in ["Translation:", "English:", "Translated:", "Here is", "Here's"]:
                    if translated.lower().startswith(prefix.lower()):
                        translated = translated[len(prefix):].strip()

                logger.debug("Pollinations: translated '%.50s...' → '%.50s...'", text, translated)
                return translated

            logger.warning("Pollinations: translation returned no text, using original")
            return text

        except Exception as e:
            logger.warning("Pollinations: translation failed: %s, using original", e)
            return text

    def _has_polish_characters(self, text: str) -> bool:
        """Sprawdza czy tekst zawiera polskie znaki."""
        polish_chars = set('ąćęłńóśźżĄĆĘŁŃÓŚŹŻ')
        return any(char in polish_chars for char in text)

    def _looks_like_polish(self, text: str) -> bool:
        """Heurystyka: sprawdza czy tekst wygląda na polski."""
        if self._has_polish_characters(text):
            return True

        polish_words = {
            'i', 'w', 'z', 'na', 'do', 'o', 'się', 'jest', 'to', 'że',
            'nie', 'jak', 'po', 'co', 'tak', 'za', 'od', 'ale', 'czy',
            'ze', 'przez', 'przy', 'dla', 'lub', 'oraz', 'bez', 'nad',
            'pod', 'przed', 'między', 'według', 'podczas', 'czyli',
            'piękna', 'piękny', 'piękne', 'kobieta', 'mężczyzna', 'dziecko',
            'duży', 'mały', 'stary', 'nowy', 'dobry', 'zły',
            'las', 'morze', 'góry', 'miasto', 'dom', 'ulica',
            'kot', 'pies', 'zwierzę', 'kwiat', 'drzewo', 'słońce',
            'dzień', 'noc', 'rano', 'wieczór', 'woda', 'ogień',
            'czerwony', 'niebieski', 'zielony', 'żółty', 'biały', 'czarny',
            'kuchnia', 'jedzenie', 'posiłek', 'obiad', 'śniadanie',
            'zdjęcie', 'obraz', 'grafika', 'ilustracja', 'portret',
            'tło', 'styl', 'minimalistyczny', 'nowoczesny', 'klasyczny',
        }

        words = text.lower().split()
        polish_count = sum(1 for w in words if w in polish_words)

        if len(words) > 0 and polish_count / len(words) > 0.2:
            return True

        return polish_count >= 2

    def _parse_error_message(self, response) -> str:
        """
        Parsuje błąd z odpowiedzi API.
        Zawsze zwraca string, nawet jeśli API zwraca zagnieżdżony JSON.
        """
        error_msg = f"HTTP {response.status_code}"

        try:
            error_data = response.json()

            if isinstance(error_data, dict):
                message = error_data.get("message", "")

                if isinstance(message, str) and message.startswith("{"):
                    try:
                        nested = json.loads(message)
                        if "message" in nested:
                            error_msg = str(nested["message"])
                        elif "error" in nested:
                            error_msg = str(nested["error"])
                        else:
                            error_msg = message[:200]
                    except json.JSONDecodeError:
                        error_msg = message[:200] if message else error_msg
                elif message:
                    error_msg = str(message)[:200]
                elif "error" in error_data:
                    err = error_data["error"]
                    error_msg = str(err) if isinstance(err, str) else str(err)[:200]

        except Exception:
            pass

        lower_msg = error_msg.lower()
        if any(phrase in lower_msg for phrase in [
            "cannot fulfill",
            "inappropriate",
            "content policy",
            "safety",
            "harmful",
            "explicit"
        ]):
            return "Prompt został odrzucony przez filtr bezpieczeństwa AI. Spróbuj innego opisu."

        return error_msg

    async def generate_image(
            self,
            prompt: str,
            style: Optional[str] = None,
            width: int = 1024,
            height: int = 1024,
            model: Optional[str] = None,
            enhance: bool = True,
    ) -> Dict[str, Any]:
        """
        Generuje obraz używając Pollinations API.

        Prompty polskie są automatycznie tłumaczone przez Gemini.
        """

        if not self.is_available:
            return {
                "success": False,
                "error": "Pollinations API key not configured. Add POLLINATIONS_API_KEY to .env",
                "provider": self.name,
            }

        original_prompt = prompt
        translated_prompt = prompt

        if self._looks_like_polish(prompt):
            logger.debug("Pollinations: detected Polish prompt, translating")
            translated_prompt = await self._translate_to_english(prompt)
        else:
            logger.debug("Pollinations: prompt appears to be English, using as-is")

        final_prompt = translated_prompt
        if style:
            final_prompt = f"{translated_prompt}, {style} style"

        encoded_prompt = quote(final_prompt)

        model_name = model if model in self.models else self.default_model

        image_url = (
            f"{self.base_url}/{encoded_prompt}"
            f"?model={model_name}"
            f"&width={width}"
            f"&height={height}"
            f"&enhance={'true' if enhance else 'false'}"
            f"&nologo=true"
        )

        logger.info("Pollinations: generating image model=%s", model_name)
        logger.debug("Pollinations: original=%.80s... final=%.80s...", original_prompt, final_prompt)

        try:
            timeout = 90.0 if model_name == "flux" else 60.0

            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.get(
                    image_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                    },
                    follow_redirects=True,
                )

                logger.debug("Pollinations: response status=%s", response.status_code)

                if response.status_code == 200:
                    content_type = response.headers.get("content-type", "")
                    content_length = len(response.content)

                    logger.debug("Pollinations: content-type=%s size=%d bytes", content_type, content_length)

                    if "image" in content_type and content_length > 1000:
                        image_base64 = base64.b64encode(response.content).decode("utf-8")

                        if "png" in content_type:
                            mime_type = "image/png"
                        elif "webp" in content_type:
                            mime_type = "image/webp"
                        else:
                            mime_type = "image/jpeg"

                        logger.info("Pollinations: image generated successfully, size=%d bytes", content_length)

                        return {
                            "success": True,
                            "image_url": image_url,
                            "image_base64": image_base64,
                            "image_data": f"data:{mime_type};base64,{image_base64}",
                            "prompt": original_prompt,
                            "prompt_translated": translated_prompt if translated_prompt != original_prompt else None,
                            "prompt_final": final_prompt,
                            "provider": self.name,
                            "model": model_name,
                            "width": width,
                            "height": height,
                            "size_bytes": content_length,
                            "enhance_used": enhance,
                        }
                    else:
                        error_msg = self._parse_error_message(response)
                        logger.error("Pollinations: not an image response: %s", error_msg)
                        return {
                            "success": False,
                            "error": error_msg,
                            "provider": self.name,
                        }

                elif response.status_code == 401:
                    logger.error("Pollinations: unauthorized - check API key")
                    return {
                        "success": False,
                        "error": "Nieprawidłowy klucz API. Sprawdź POLLINATIONS_API_KEY.",
                        "provider": self.name,
                    }

                elif response.status_code == 402:
                    logger.error("Pollinations: payment required - out of pollen")
                    return {
                        "success": False,
                        "error": "Brak kredytów Pollinations. Doładuj konto na enter.pollinations.ai",
                        "provider": self.name,
                    }

                elif response.status_code == 429:
                    logger.warning("Pollinations: rate limited")
                    return {
                        "success": False,
                        "error": "Zbyt wiele zapytań. Spróbuj ponownie za chwilę.",
                        "provider": self.name,
                        "retry_suggested": True,
                    }

                elif response.status_code in (400, 422):
                    error_msg = self._parse_error_message(response)
                    logger.warning("Pollinations: bad request: %s", error_msg)
                    return {
                        "success": False,
                        "error": error_msg,
                        "provider": self.name,
                    }

                elif response.status_code in (502, 503):
                    logger.error("Pollinations: server error %s", response.status_code)
                    return {
                        "success": False,
                        "error": "Serwer Pollinations jest przeciążony. Spróbuj ponownie za chwilę.",
                        "provider": self.name,
                        "retry_suggested": True,
                    }

                else:
                    error_msg = self._parse_error_message(response)
                    logger.error("Pollinations: unexpected status %s: %s", response.status_code, error_msg)
                    return {
                        "success": False,
                        "error": error_msg,
                        "provider": self.name,
                    }

        except httpx.TimeoutException:
            logger.error("Pollinations: timeout after %ss", timeout)
            return {
                "success": False,
                "error": f"Przekroczono limit czasu ({timeout}s). Spróbuj innego modelu lub krótszego promptu.",
                "provider": self.name,
                "retry_suggested": True,
            }

        except httpx.ConnectError as e:
            logger.error("Pollinations: connection error: %s", e)
            return {
                "success": False,
                "error": "Nie można połączyć się z Pollinations. Sprawdź połączenie internetowe.",
                "provider": self.name,
            }

        except Exception as e:
            logger.exception("Pollinations: unexpected error: %s", e)
            return {
                "success": False,
                "error": f"Nieoczekiwany błąd: {str(e)}",
                "provider": self.name,
            }

    async def check_balance(self) -> Dict[str, Any]:
        """Sprawdza stan konta Pollinations (ilość pollen)."""
        if not self.is_available:
            return {"success": False, "error": "API key not configured"}

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    "https://gen.pollinations.ai/account/balance",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                )

                if response.status_code == 200:
                    data = response.json()
                    return {
                        "success": True,
                        "balance": data.get("balance", 0),
                    }
                else:
                    return {
                        "success": False,
                        "error": f"HTTP {response.status_code}",
                    }

        except Exception as e:
            return {"success": False, "error": str(e)}

    async def list_available_models(self) -> Dict[str, Any]:
        """Pobiera listę dostępnych modeli z API."""
        if not self.is_available:
            return {"success": False, "error": "API key not configured"}

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    "https://gen.pollinations.ai/image/models",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                )

                if response.status_code == 200:
                    models = response.json()
                    return {
                        "success": True,
                        "models": models,
                    }
                else:
                    return {
                        "success": False,
                        "error": f"HTTP {response.status_code}",
                    }

        except Exception as e:
            return {"success": False, "error": str(e)}
