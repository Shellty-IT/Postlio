# postlio_backend/app/services/ai/image/clipdrop.py

from typing import Optional, Dict, Any
import httpx
import base64
from app.config import settings
from app.services.ai.image.base import BaseImageProvider


class ClipdropProvider(BaseImageProvider):
    """
    Clipdrop (Stability AI) provider.

    ⚠️ UWAGA: Ten provider jest PŁATNY!
    Wymaga aktywnej subskrypcji ClipDrop.
    """

    name = "clipdrop"
    models = ["stable-diffusion"]
    is_free = False  # PŁATNY!

    def __init__(self):
        self.api_key = settings.CLIPDROP_API_KEY
        self.base_url = "https://clipdrop-api.co"

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
                "error": "ClipDrop API key not configured. Note: ClipDrop is a paid service.",
                "provider": self.name
            }

        enhanced_prompt = self._enhance_prompt(prompt, style)

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    f"{self.base_url}/text-to-image/v1",
                    headers={"x-api-key": self.api_key},
                    files={"prompt": (None, enhanced_prompt)},
                )

                if response.status_code == 200:
                    image_base64 = base64.b64encode(response.content).decode("utf-8")

                    return {
                        "success": True,
                        "image_base64": image_base64,
                        "image_data": f"data:image/png;base64,{image_base64}",
                        "prompt": prompt,
                        "prompt_enhanced": enhanced_prompt,
                        "provider": self.name,
                        "model": "stable-diffusion",
                    }

                elif response.status_code == 402:
                    return {
                        "success": False,
                        "error": "Payment required. ClipDrop requires an active subscription.",
                        "provider": self.name,
                    }

                elif response.status_code == 401:
                    return {
                        "success": False,
                        "error": "Invalid API key.",
                        "provider": self.name,
                    }

                else:
                    return {
                        "success": False,
                        "error": f"API error: {response.status_code} - {response.text[:200]}",
                        "provider": self.name,
                    }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "provider": self.name,
            }