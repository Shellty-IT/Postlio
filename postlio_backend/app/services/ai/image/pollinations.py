from typing import Optional, Dict, Any
import httpx
import asyncio
from urllib.parse import quote
from app.services.ai.image.base import BaseImageProvider


class PollinationsProvider(BaseImageProvider):
    """Pollinations.ai - darmowy, bez klucza API."""

    name = "pollinations"
    models = ["flux", "turbo"]

    def __init__(self):
        self.base_url = "https://image.pollinations.ai/prompt"
        self.default_model = "flux"
        self._text_provider = None

    @property
    def is_available(self) -> bool:
        return True

    def _has_non_ascii(self, text: str) -> bool:
        """Sprawdza czy tekst zawiera znaki spoza ASCII (np. polskie)."""
        try:
            text.encode('ascii')
            return False
        except UnicodeEncodeError:
            return True

    def _is_mostly_polish(self, text: str) -> bool:
        """Heurystyka: sprawdza czy tekst wygląda na polski."""
        polish_words = [
            'i', 'w', 'z', 'na', 'do', 'o', 'się', 'jest', 'to', 'że',
            'nie', 'jak', 'po', 'co', 'tak', 'za', 'od', 'ale', 'czy',
            'ze', 'przez', 'przy', 'dla', 'lub', 'oraz', 'bez', 'nad',
            'pod', 'przed', 'między', 'według', 'podczas', 'czyli',
            'piękna', 'piękny', 'żółty', 'zielony', 'czerwony', 'biały',
            'czarny', 'niebieski', 'duży', 'mały', 'stary', 'nowy',
            'łąka', 'góry', 'morze', 'las', 'drzewo', 'kwiat', 'słońce',
            'niebo', 'chmury', 'deszcz', 'śnieg', 'wiosna', 'lato',
            'jesień', 'zima', 'dzień', 'noc', 'rano', 'wieczór', 'świt',
        ]
        words = text.lower().split()
        polish_count = sum(1 for w in words if w in polish_words)
        return polish_count >= 1 or self._has_non_ascii(text)

    async def _translate_to_english(self, text: str) -> str:
        """
        Tłumaczy tekst na angielski używając Gemini.
        Fallback: zwraca oryginalny tekst jeśli tłumaczenie się nie uda.
        """
        try:
            # Lazy import żeby uniknąć circular dependency
            from app.services.ai.text.gemini import GeminiProvider

            if self._text_provider is None:
                self._text_provider = GeminiProvider()

            if not self._text_provider.is_available:
                return text

            # Szybkie tłumaczenie
            translation_prompt = (
                f"Translate this image description to English. "
                f"Return ONLY the translation, nothing else:\n\n{text}"
            )

            result = await self._text_provider.generate_text(
                prompt=translation_prompt,
                max_tokens=100,
                temperature=0.1,  # Niska temperatura dla dokładnego tłumaczenia
            )

            if result.get("success") and result.get("text"):
                translated = result["text"].strip()
                # Usuń cudzysłowy jeśli model je dodał
                translated = translated.strip('"\'')
                return translated

            return text

        except Exception:
            # W razie błędu, zwróć oryginalny tekst
            return text

    async def generate_image(
            self,
            prompt: str,
            style: Optional[str] = None,
            width: int = 1024,
            height: int = 1024,
            model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generuje obraz za pomocą Pollinations API.

        Polskie prompty są automatycznie tłumaczone na angielski,
        ponieważ modele AI lepiej rozumieją angielskie opisy.
        """
        original_prompt = prompt

        # 1. Sprawdź czy prompt jest po polsku i przetłumacz
        if self._is_mostly_polish(prompt):
            prompt = await self._translate_to_english(prompt)

        # 2. Wzbogać prompt o styl
        enhanced_prompt = self._enhance_prompt(prompt, style)

        # 3. Zakoduj do URL (angielski tekst, więc bez problemu)
        encoded_prompt = quote(enhanced_prompt)

        model_name = model if model in self.models else self.default_model

        # Pollinations URL format
        image_url = (
            f"{self.base_url}/{encoded_prompt}"
            f"?width={width}&height={height}"
            f"&model={model_name}&nologo=true"
        )

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:

                max_retries = 3
                retry_delay = 5

                for attempt in range(max_retries):
                    response = await client.get(image_url)

                    if response.status_code == 200:
                        content_length = len(response.content)

                        if content_length > 1000:
                            return {
                                "success": True,
                                "image_url": image_url,
                                "prompt": original_prompt,  # Oryginalny polski
                                "prompt_translated": prompt,  # Przetłumaczony angielski
                                "prompt_enhanced": enhanced_prompt,  # Ze stylem
                                "provider": self.name,
                                "model": model_name,
                                "width": width,
                                "height": height,
                                "size_bytes": content_length,
                            }
                        else:
                            if attempt < max_retries - 1:
                                await asyncio.sleep(retry_delay)
                                continue
                            else:
                                return {
                                    "success": False,
                                    "error": "Obraz nie został wygenerowany w czasie. Spróbuj ponownie.",
                                    "provider": self.name,
                                }
                    else:
                        return {
                            "success": False,
                            "error": f"Błąd API: HTTP {response.status_code}",
                            "provider": self.name,
                        }

                return {
                    "success": False,
                    "error": "Nie udało się wygenerować obrazu po 3 próbach.",
                    "provider": self.name,
                }

        except httpx.TimeoutException:
            return {
                "success": False,
                "error": "Timeout - generowanie trwa za długo (>2 min).",
                "provider": self.name,
            }
        except httpx.ConnectError:
            return {
                "success": False,
                "error": "Nie można połączyć się z Pollinations API.",
                "provider": self.name,
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Nieoczekiwany błąd: {str(e)}",
                "provider": self.name,
            }