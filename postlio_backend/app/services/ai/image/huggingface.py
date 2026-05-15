# postlio_backend/app/services/ai/image/huggingface.py

from typing import Optional, Dict, Any
import httpx
import base64
from app.config import settings
from app.services.ai.image.base import BaseImageProvider


class HuggingFaceProvider(BaseImageProvider):
    """HuggingFace Inference API provider - z auto-tłumaczeniem PL→EN."""

    name = "huggingface"

    # Zaktualizowana lista modeli (FLUX.1-dev deprecated!)
    models = [
        "stabilityai/stable-diffusion-xl-base-1.0",  # ⭐ Główny model
        "runwayml/stable-diffusion-v1-5",
        "CompVis/stable-diffusion-v1-4",
    ]
    is_free = True

    def __init__(self):
        self.api_key = settings.HUGGINGFACE_API_KEY
        self.base_url = "https://router.huggingface.co/hf-inference/models"
        self.default_model = "stabilityai/stable-diffusion-xl-base-1.0"
        self._text_provider = None

    @property
    def is_available(self) -> bool:
        return self.api_key is not None and len(self.api_key) > 0

    def _has_non_ascii(self, text: str) -> bool:
        """Sprawdza czy tekst zawiera znaki spoza ASCII."""
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
            'kociaki', 'koty', 'kot', 'pies', 'psy', 'zwierzęta',
            'śpiące', 'puchate', 'wiklinowy', 'koszyk', 'koszyku',
            'trzy', 'dwa', 'jeden', 'cztery', 'pięć', 'sześć',
            'zdjęcie', 'obraz', 'ilustracja', 'grafika',
            'samochód', 'auto', 'dom', 'miasto', 'ulica',
        ]
        words = text.lower().split()
        polish_count = sum(1 for w in words if w in polish_words)
        return polish_count >= 1 or self._has_non_ascii(text)

    async def _translate_to_english(self, text: str) -> str:
        """Tłumaczy tekst na angielski używając Gemini."""
        try:
            from app.services.ai.text.gemini import GeminiProvider

            if self._text_provider is None:
                self._text_provider = GeminiProvider()

            if not self._text_provider.is_available:
                print(f"⚠️ HuggingFace: Gemini unavailable for translation, using original")
                return text

            translation_prompt = (
                f"Translate this image description to English. "
                f"Keep it as a descriptive prompt for image generation. "
                f"Return ONLY the translation, nothing else:\n\n{text}"
            )

            # NAPRAWIONE: używamy _generate_with_retry zamiast generate_text
            result = await self._text_provider._generate_with_retry(
                prompt=translation_prompt,
            )

            if result.get("success") and result.get("text"):
                translated = result["text"].strip().strip('"\'')
                print(f"✅ HuggingFace: Translated '{text}' → '{translated}'")
                return translated

            print(f"⚠️ HuggingFace: Translation returned no text")
            return text

        except Exception as e:
            print(f"⚠️ HuggingFace: Translation failed: {e}")
            return text

    async def generate_image(
            self,
            prompt: str,
            style: Optional[str] = None,
            width: int = 1024,
            height: int = 1024,
            model: Optional[str] = None,
    ) -> Dict[str, Any]:

        if not self.is_available:
            return {
                "success": False,
                "error": "HuggingFace API key not configured",
                "provider": self.name
            }

        original_prompt = prompt

        # 1. Sprawdź czy prompt jest po polsku i przetłumacz
        if self._is_mostly_polish(prompt):
            print(f"🔄 HuggingFace: Detected Polish prompt, translating...")
            prompt = await self._translate_to_english(prompt)

        # 2. Wzbogać prompt o styl
        enhanced_prompt = self._enhance_prompt(prompt, style)

        # Użyj podanego modelu lub domyślnego (ale tylko z dostępnych!)
        model_name = model if model in self.models else self.default_model

        # Lista modeli do wypróbowania (fallback)
        models_to_try = [model_name] + [m for m in self.models if m != model_name]

        last_error = None

        for current_model in models_to_try:
            try:
                print(f"🔄 HuggingFace: Trying {current_model}...")

                async with httpx.AsyncClient(timeout=180.0) as client:
                    response = await client.post(
                        f"{self.base_url}/{current_model}",
                        headers={
                            "Authorization": f"Bearer {self.api_key}",
                            "Content-Type": "application/json",
                            "x-use-cache": "false",
                        },
                        json={
                            "inputs": enhanced_prompt,
                            "parameters": {
                                "width": min(width, 1024),
                                "height": min(height, 1024),
                            }
                        },
                    )

                    if response.status_code == 200:
                        content_type = response.headers.get("content-type", "")

                        if "image" in content_type:
                            image_base64 = base64.b64encode(response.content).decode("utf-8")
                            print(f"✅ HuggingFace: Success with {current_model}")

                            return {
                                "success": True,
                                "image_base64": image_base64,
                                "image_data": f"data:image/png;base64,{image_base64}",
                                "prompt": original_prompt,
                                "prompt_translated": prompt if prompt != original_prompt else None,
                                "prompt_enhanced": enhanced_prompt,
                                "provider": self.name,
                                "model": current_model,
                                "width": width,
                                "height": height,
                            }
                        else:
                            try:
                                error_data = response.json()
                                last_error = error_data.get("error", "Unknown error")
                            except:
                                last_error = "Invalid response format"
                            print(f"❌ HuggingFace: {current_model} - {last_error}")

                    elif response.status_code == 410:
                        # Model deprecated - skip to next
                        print(f"⚠️ HuggingFace: {current_model} is deprecated, trying next...")
                        continue

                    elif response.status_code == 503:
                        try:
                            error_data = response.json()
                            estimated_time = error_data.get("estimated_time", 30)
                            last_error = f"Model loading (~{estimated_time}s). Try again in a moment."
                            print(f"⏳ HuggingFace: {current_model} is loading...")
                        except:
                            last_error = "Model is loading"
                        continue

                    elif response.status_code == 429:
                        last_error = "Rate limit exceeded. Try again later."
                        print(f"⚠️ HuggingFace: Rate limited")
                        continue

                    else:
                        try:
                            error_data = response.json()
                            last_error = error_data.get("error", f"HTTP {response.status_code}")
                        except:
                            last_error = f"HTTP {response.status_code}"
                        print(f"❌ HuggingFace: {current_model} - {last_error}")
                        continue

            except httpx.TimeoutException:
                last_error = "Request timeout. Model may be loading, try again."
                print(f"⏳ HuggingFace: Timeout for {current_model}")
                continue

            except Exception as e:
                last_error = str(e)
                print(f"❌ HuggingFace: {current_model} - {e}")
                continue

        return {
            "success": False,
            "error": last_error or "All models failed",
            "provider": self.name,
        }

    async def check_model_status(self, model: Optional[str] = None) -> Dict[str, Any]:
        """Check if a model is loaded and ready."""
        if not self.is_available:
            return {"ready": False, "error": "API key not configured"}

        model_name = model or self.default_model

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"https://huggingface.co/api/models/{model_name}",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                )

                if response.status_code == 200:
                    return {"ready": True, "model": model_name}
                else:
                    return {"ready": False, "error": f"Model check failed: {response.status_code}"}

        except Exception as e:
            return {"ready": False, "error": str(e)}