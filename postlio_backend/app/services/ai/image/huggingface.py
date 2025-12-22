from typing import Optional, List, Dict, Any
import httpx
import base64
from app.config import settings
from app.services.ai.image.base import BaseImageProvider


class HuggingFaceProvider(BaseImageProvider):
    """HuggingFace Inference API provider - zaktualizowany endpoint."""

    name = "huggingface"
    models = [
        "black-forest-labs/FLUX.1-dev",
        "stabilityai/stable-diffusion-xl-base-1.0",
        "runwayml/stable-diffusion-v1-5",
        "CompVis/stable-diffusion-v1-4",
    ]

    def __init__(self):
        self.api_key = settings.HUGGINGFACE_API_KEY
        # Nowy endpoint HuggingFace
        self.base_url = "https://router.huggingface.co/hf-inference/models"
        self.default_model = "black-forest-labs/FLUX.1-dev"

    @property
    def is_available(self) -> bool:
        return self.api_key is not None and len(self.api_key) > 0

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

        enhanced_prompt = self._enhance_prompt(prompt, style)
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
                        # Sprawdź czy odpowiedź to obraz
                        content_type = response.headers.get("content-type", "")

                        if "image" in content_type:
                            image_base64 = base64.b64encode(response.content).decode("utf-8")
                            print(f"✅ HuggingFace: Success with {current_model}")

                            return {
                                "success": True,
                                "image_base64": image_base64,
                                "image_data": f"data:image/png;base64,{image_base64}",
                                "prompt": enhanced_prompt,
                                "provider": self.name,
                                "model": current_model,
                                "width": width,
                                "height": height,
                            }
                        else:
                            # Odpowiedź JSON (prawdopodobnie błąd)
                            error_data = response.json()
                            last_error = error_data.get("error", "Unknown error")
                            print(f"❌ HuggingFace: {current_model} - {last_error}")

                    elif response.status_code == 503:
                        # Model is loading
                        try:
                            error_data = response.json()
                            estimated_time = error_data.get("estimated_time", 30)
                            last_error = f"Model loading (~{estimated_time}s)"
                            print(f"⏳ HuggingFace: {current_model} is loading...")
                        except:
                            last_error = "Model is loading"
                        continue

                    elif response.status_code == 429:
                        last_error = "Rate limit exceeded"
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
                last_error = "Request timeout (model may be loading)"
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