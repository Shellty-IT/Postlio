# postlio_backend/app/services/ai/image/pollinations.py
"""
Pollinations AI Image Provider - Nowe API (gen.pollinations.ai)

Dokumentacja: https://pollinations.ai/docs
Modele: flux, nanobanana

✅ DODANE: Tłumaczenie promptów przez Gemini przed wysłaniem
"""

from typing import Optional, Dict, Any
import httpx
import base64
from urllib.parse import quote
from app.config import settings
from app.services.ai.image.base import BaseImageProvider


class PollinationsProvider(BaseImageProvider):
    """
    Pollinations AI - nowe API z autoryzacją.

    Dostępne modele:
    - flux: Wysoka jakość, wolniejszy (~10-20s)
    - nanobanana: Szybki, lżejszy (~5-10s)

    Prompty są automatycznie tłumaczone na angielski przez Gemini.
    """

    name = "pollinations"
    models = ["flux", "nanobanana"]
    is_free = False

    def __init__(self):
        self.api_key = settings.POLLINATIONS_API_KEY
        self.base_url = "https://gen.pollinations.ai/image"
        self.default_model = "flux"
        self._text_provider = None

    @property
    def is_available(self) -> bool:
        """Sprawdza czy API key jest skonfigurowany."""
        return self.api_key is not None and len(self.api_key) > 0

    async def _translate_to_english(self, text: str) -> str:
        """
        Tłumaczy prompt na angielski używając Gemini.
        Zwraca oryginalny tekst jeśli tłumaczenie się nie powiedzie.
        """
        try:
            from app.services.ai.text.gemini import GeminiProvider

            if self._text_provider is None:
                self._text_provider = GeminiProvider()

            if not self._text_provider.is_available:
                print(f"⚠️ Pollinations: Gemini unavailable, using original prompt")
                return text

            # Prompt do tłumaczenia - prosty i skuteczny
            translation_prompt = f"""Translate this image description to English. 
Make it a good prompt for AI image generation - descriptive, detailed, artistic.
Return ONLY the English translation, nothing else.

Text to translate:
{text}"""

            result = await self._text_provider._generate_with_retry(translation_prompt)

            if result.get("success") and result.get("text"):
                translated = result["text"].strip().strip('"\'')
                # Usuń ewentualne prefiksy typu "Translation:" itp.
                for prefix in ["Translation:", "English:", "Translated:", "Here is", "Here's"]:
                    if translated.lower().startswith(prefix.lower()):
                        translated = translated[len(prefix):].strip()

                print(f"✅ Pollinations: Translated '{text[:50]}...' → '{translated[:50]}...'")
                return translated

            print(f"⚠️ Pollinations: Translation returned no text, using original")
            return text

        except Exception as e:
            print(f"⚠️ Pollinations: Translation failed: {e}, using original")
            return text

    def _has_polish_characters(self, text: str) -> bool:
        """Sprawdza czy tekst zawiera polskie znaki."""
        polish_chars = set('ąćęłńóśźżĄĆĘŁŃÓŚŹŻ')
        return any(char in polish_chars for char in text)

    def _looks_like_polish(self, text: str) -> bool:
        """Heurystyka: sprawdza czy tekst wygląda na polski."""
        # Polskie znaki
        if self._has_polish_characters(text):
            return True

        # Częste polskie słowa
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

        # Jeśli więcej niż 20% słów to polskie słowa, uznaj za polski
        if len(words) > 0 and polish_count / len(words) > 0.2:
            return True

        # Jeśli znaleziono przynajmniej 2 polskie słowa
        return polish_count >= 2

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

        # ✅ TŁUMACZENIE: Jeśli prompt wygląda na polski, przetłumacz przez Gemini
        if self._looks_like_polish(prompt):
            print(f"🔄 Pollinations: Detected Polish prompt, translating via Gemini...")
            translated_prompt = await self._translate_to_english(prompt)
        else:
            print(f"🔄 Pollinations: Prompt appears to be English, using as-is")

        # Dodaj styl do promptu jeśli podany
        final_prompt = translated_prompt
        if style:
            final_prompt = f"{translated_prompt}, {style} style"

        # Enkoduj prompt dla URL
        encoded_prompt = quote(final_prompt)

        # Wybierz model (z walidacją)
        model_name = model if model in self.models else self.default_model

        # Zbuduj URL z parametrami
        image_url = (
            f"{self.base_url}/{encoded_prompt}"
            f"?model={model_name}"
            f"&width={width}"
            f"&height={height}"
            f"&enhance={'true' if enhance else 'false'}"
            f"&nologo=true"
        )

        print(f"🖼️ Pollinations: Generating with model={model_name}")
        print(f"🖼️ Pollinations: Original: {original_prompt[:80]}...")
        print(f"🖼️ Pollinations: Final: {final_prompt[:80]}...")

        try:
            # Timeout zależny od modelu
            timeout = 90.0 if model_name == "flux" else 45.0

            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.get(
                    image_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                    },
                    follow_redirects=True,
                )

                print(f"🖼️ Pollinations: Response status: {response.status_code}")

                if response.status_code == 200:
                    content_type = response.headers.get("content-type", "")
                    content_length = len(response.content)

                    print(f"🖼️ Pollinations: Content-Type: {content_type}, Size: {content_length} bytes")

                    # Sprawdź czy to rzeczywiście obraz
                    if "image" in content_type and content_length > 1000:
                        # Konwertuj do base64 dla frontendu
                        image_base64 = base64.b64encode(response.content).decode("utf-8")

                        # Określ format obrazu
                        if "png" in content_type:
                            mime_type = "image/png"
                        elif "webp" in content_type:
                            mime_type = "image/webp"
                        else:
                            mime_type = "image/jpeg"

                        print(f"✅ Pollinations: Success! Image size: {content_length} bytes")

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
                        try:
                            error_data = response.json()
                            error_msg = error_data.get("error", "Invalid response")
                        except:
                            error_msg = f"Invalid response: {content_type}"

                        print(f"❌ Pollinations: Not an image - {error_msg}")
                        return {
                            "success": False,
                            "error": error_msg,
                            "provider": self.name,
                        }

                elif response.status_code == 401:
                    print(f"❌ Pollinations: Unauthorized - check API key")
                    return {
                        "success": False,
                        "error": "Invalid API key. Check POLLINATIONS_API_KEY.",
                        "provider": self.name,
                    }

                elif response.status_code == 402:
                    print(f"❌ Pollinations: Payment required - out of pollen")
                    return {
                        "success": False,
                        "error": "Out of pollen credits. Top up at enter.pollinations.ai",
                        "provider": self.name,
                    }

                elif response.status_code == 429:
                    print(f"❌ Pollinations: Rate limited")
                    return {
                        "success": False,
                        "error": "Rate limit exceeded. Try again in a moment.",
                        "provider": self.name,
                        "retry_suggested": True,
                    }

                elif response.status_code == 502 or response.status_code == 503:
                    print(f"❌ Pollinations: Server error {response.status_code}")
                    return {
                        "success": False,
                        "error": "Pollinations server is busy. Try again in a moment.",
                        "provider": self.name,
                        "retry_suggested": True,
                    }

                else:
                    try:
                        error_data = response.json()
                        error_msg = error_data.get("error", f"HTTP {response.status_code}")
                    except:
                        error_msg = f"HTTP {response.status_code}"

                    print(f"❌ Pollinations: Error - {error_msg}")
                    return {
                        "success": False,
                        "error": error_msg,
                        "provider": self.name,
                    }

        except httpx.TimeoutException:
            print(f"❌ Pollinations: Timeout after {timeout}s")
            return {
                "success": False,
                "error": f"Request timeout ({timeout}s). Try 'nanobanana' model for faster results.",
                "provider": self.name,
                "retry_suggested": True,
            }

        except httpx.ConnectError as e:
            print(f"❌ Pollinations: Connection error - {e}")
            return {
                "success": False,
                "error": "Cannot connect to Pollinations. Check your internet connection.",
                "provider": self.name,
            }

        except Exception as e:
            print(f"❌ Pollinations: Unexpected error - {e}")
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}",
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