# postlio_backend/app/services/ai/image/gemini_image.py

from typing import Optional, Dict, Any
import httpx
import json
from app.config import settings
from app.services.ai.image.base import BaseImageProvider


class GeminiImageProvider(BaseImageProvider):
    """
    Google Gemini Image Generation.
    """

    name = "gemini"
    models = [
        "gemini-2.0-flash-exp",
    ]
    is_free = True

    MODEL_ALIASES = {
        "nano-banana": "gemini-2.0-flash-exp",
        "nano-banana-pro": "gemini-2.0-flash-exp",
        "flash": "gemini-2.0-flash-exp",
        "default": "gemini-2.0-flash-exp",
    }

    def __init__(self):
        self.api_key = settings.GOOGLE_API_KEY
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"
        self.default_model = "gemini-2.0-flash-exp"

    @property
    def is_available(self) -> bool:
        return self.api_key is not None and len(self.api_key) > 0

    def _resolve_model(self, model: Optional[str]) -> str:
        if model is None:
            return self.default_model
        model_lower = model.lower()
        if model_lower in self.MODEL_ALIASES:
            return self.MODEL_ALIASES[model_lower]
        if model in self.models:
            return model
        return self.default_model

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
                "error": "Google API key not configured",
                "provider": self.name
            }

        enhanced_prompt = self._enhance_prompt(prompt, style)
        model_name = self._resolve_model(model)

        # Buduj URL
        url = f"{self.base_url}/{model_name}:generateContent"

        print(f"\n{'=' * 60}")
        print(f"🔄 GEMINI IMAGE DEBUG")
        print(f"{'=' * 60}")
        print(f"URL: {url}")
        print(f"Model: {model_name}")
        print(f"Prompt: {enhanced_prompt[:100]}...")
        print(f"API Key (first 10 chars): {self.api_key[:10]}...")

        request_body = {
            "contents": [{
                "parts": [{
                    "text": f"Generate an image: {enhanced_prompt}"
                }]
            }],
            "generationConfig": {
                "responseModalities": ["TEXT", "IMAGE"],
            },
        }

        print(f"Request body: {json.dumps(request_body, indent=2)}")

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    url,
                    headers={"Content-Type": "application/json"},
                    params={"key": self.api_key},
                    json=request_body,
                )

                print(f"\n📥 RESPONSE")
                print(f"Status: {response.status_code}")
                print(f"Headers: {dict(response.headers)}")

                # Pokaż pełną odpowiedź
                try:
                    response_text = response.text
                    print(f"Body (first 2000 chars):\n{response_text[:2000]}")

                    if response_text:
                        data = json.loads(response_text)
                    else:
                        data = {}
                except Exception as e:
                    print(f"Failed to parse response: {e}")
                    data = {}

                print(f"{'=' * 60}\n")

                if response.status_code == 200:
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])

                        for i, part in enumerate(parts):
                            print(f"Part {i}: {list(part.keys())}")

                            if "inlineData" in part:
                                inline_data = part["inlineData"]
                                mime_type = inline_data.get("mimeType", "image/png")
                                image_base64 = inline_data.get("data", "")

                                if image_base64:
                                    print(f"✅ SUCCESS! Got image, length: {len(image_base64)}")
                                    return {
                                        "success": True,
                                        "image_base64": image_base64,
                                        "image_data": f"data:{mime_type};base64,{image_base64}",
                                        "prompt": prompt,
                                        "prompt_enhanced": enhanced_prompt,
                                        "provider": self.name,
                                        "model": model_name,
                                        "width": width,
                                        "height": height,
                                    }

                            if "fileData" in part:
                                file_uri = part["fileData"].get("fileUri", "")
                                if file_uri:
                                    print(f"✅ SUCCESS! Got file URI")
                                    return {
                                        "success": True,
                                        "image_url": file_uri,
                                        "prompt": prompt,
                                        "prompt_enhanced": enhanced_prompt,
                                        "provider": self.name,
                                        "model": model_name,
                                        "width": width,
                                        "height": height,
                                    }

                            # Sprawdź czy to tylko tekst
                            if "text" in part:
                                print(f"Part {i} contains text: {part['text'][:200]}...")

                    # Sprawdź promptFeedback
                    prompt_feedback = data.get("promptFeedback", {})
                    block_reason = prompt_feedback.get("blockReason")
                    if block_reason:
                        return {
                            "success": False,
                            "error": f"Content blocked: {block_reason}",
                            "provider": self.name,
                        }

                    # Brak obrazu
                    return {
                        "success": False,
                        "error": "Model did not generate an image. The model may not support image generation.",
                        "provider": self.name,
                    }

                elif response.status_code == 429:
                    # Sprawdź szczegóły rate limit
                    error_info = data.get("error", {})
                    error_message = error_info.get("message", "Rate limit exceeded")
                    print(f"❌ RATE LIMIT: {error_message}")
                    return {
                        "success": False,
                        "error": f"Rate limit exceeded: {error_message}",
                        "provider": self.name,
                    }

                else:
                    error_info = data.get("error", {})
                    error_message = error_info.get("message", f"HTTP {response.status_code}")
                    print(f"❌ ERROR: {error_message}")
                    return {
                        "success": False,
                        "error": error_message,
                        "provider": self.name,
                    }

        except httpx.TimeoutException:
            print(f"❌ TIMEOUT")
            return {"success": False, "error": "Request timeout", "provider": self.name}
        except Exception as e:
            print(f"❌ EXCEPTION: {e}")
            import traceback
            traceback.print_exc()
            return {"success": False, "error": str(e), "provider": self.name}