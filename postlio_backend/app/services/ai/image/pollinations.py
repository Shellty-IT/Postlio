from typing import Optional, List, Dict, Any
import httpx
from urllib.parse import quote
from app.services.ai.image.base import BaseImageProvider


class PollinationsProvider(BaseImageProvider):
    """Pollinations.ai - darmowy, bez klucza API."""

    name = "pollinations"
    models = ["flux", "turbo"]

    def __init__(self):
        self.base_url = "https://image.pollinations.ai/prompt"
        self.default_model = "flux"

    @property
    def is_available(self) -> bool:
        return True  # Zawsze dostępny, bez klucza

    async def generate_image(
            self,
            prompt: str,
            style: Optional[str] = None,
            width: int = 1024,
            height: int = 1024,
            model: Optional[str] = None,
    ) -> Dict[str, Any]:

        enhanced_prompt = self._enhance_prompt(prompt, style)
        encoded_prompt = quote(enhanced_prompt)

        model_name = model if model in self.models else self.default_model

        # Pollinations URL format
        image_url = f"{self.base_url}/{encoded_prompt}?width={width}&height={height}&model={model_name}&nologo=true"

        try:
            # Verify image is accessible
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.head(image_url)

                if response.status_code == 200:
                    return {
                        "success": True,
                        "image_url": image_url,
                        "prompt": enhanced_prompt,
                        "provider": self.name,
                        "model": model_name,
                        "width": width,
                        "height": height,
                    }
                else:
                    return {
                        "success": False,
                        "error": f"Image generation failed: {response.status_code}",
                        "provider": self.name,
                    }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "provider": self.name,
            }