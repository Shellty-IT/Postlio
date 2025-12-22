from typing import Optional, List, Dict, Any
import httpx
import base64
from app.config import settings
from app.services.ai.image.base import BaseImageProvider


class ClipdropProvider(BaseImageProvider):
    """Clipdrop (Stability AI) provider."""

    name = "clipdrop"
    models = ["stable-diffusion"]

    def __init__(self):
        self.api_key = settings.CLIPDROP_API_KEY
        self.base_url = "https://clipdrop-api.co"

    @property
    def is_available(self) -> bool:
        return self.api_key is not None

    async def generate_image(
            self,
            prompt: str,
            style: Optional[str] = None,
            width: int = 1024,
            height: int = 1024,
            model: Optional[str] = None,
    ) -> Dict[str, Any]:

        if not self.is_available:
            return {"success": False, "error": "Clipdrop API key not configured", "provider": self.name}

        enhanced_prompt = self._enhance_prompt(prompt, style)

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    f"{self.base_url}/text-to-image/v1",
                    headers={"x-api-key": self.api_key},
                    files={"prompt": (None, enhanced_prompt)},
                )

                if response.status_code == 200:
                    # Response is image bytes
                    image_base64 = base64.b64encode(response.content).decode("utf-8")

                    return {
                        "success": True,
                        "image_base64": image_base64,
                        "image_data": f"data:image/png;base64,{image_base64}",
                        "prompt": enhanced_prompt,
                        "provider": self.name,
                        "model": "stable-diffusion",
                    }
                else:
                    return {
                        "success": False,
                        "error": f"API error: {response.status_code} - {response.text}",
                        "provider": self.name,
                    }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "provider": self.name,
            }