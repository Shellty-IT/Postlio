# postlio_backend/app/services/ai/video/pollinations.py

import logging
from typing import Optional, Dict, Any
import httpx
import base64
import json
from urllib.parse import quote
from app.config import settings
from app.services.ai.video.base import BaseVideoProvider

logger = logging.getLogger(__name__)


class PollinationsVideoProvider(BaseVideoProvider):

    name = "pollinations"
    models = ["seedance"]
    is_free = False

    MODEL_DISPLAY_NAMES = {
        "seedance": "Seedance Lite",
    }

    def __init__(self):
        self.api_key = settings.POLLINATIONS_API_KEY
        self.base_url = "https://gen.pollinations.ai/video"
        self.default_model = "seedance"
        self._text_provider = None

    @property
    def is_available(self) -> bool:
        return self.api_key is not None and len(self.api_key) > 0

    async def _enhance_and_translate(self, text: str) -> str:
        try:
            from app.services.ai.text.gemini import GeminiProvider

            if self._text_provider is None:
                self._text_provider = GeminiProvider()

            if not self._text_provider.is_available:
                logger.warning("Video: Gemini unavailable, using original prompt")
                return text

            translation_prompt = f"""You are a video prompt engineer. Take this text and create an excellent English prompt for AI video generation.

Rules:
- If the text is not in English, translate it to English first
- Make it descriptive with motion, action, and cinematic details
- Keep it concise but vivid (max 2-3 sentences)
- Return ONLY the final English prompt, nothing else

Input text:
{text}"""

            result = await self._text_provider._generate_with_retry(translation_prompt)

            if result.get("success") and result.get("text"):
                enhanced = result["text"].strip().strip('"\'')
                for prefix in ["Translation:", "English:", "Translated:", "Here is", "Here's", "Prompt:"]:
                    if enhanced.lower().startswith(prefix.lower()):
                        enhanced = enhanced[len(prefix):].strip()

                logger.debug("Video: enhanced '%.50s...' → '%.80s...'", text, enhanced)
                return enhanced

            logger.warning("Video: enhancement returned no text, using original")
            return text

        except Exception as e:
            logger.warning("Video: enhancement failed: %s, using original", e)
            return text

    def _parse_error_message(self, response) -> str:
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
            "cannot fulfill", "inappropriate", "content policy",
            "safety", "harmful", "explicit"
        ]):
            return "Prompt został odrzucony przez filtr bezpieczeństwa AI. Spróbuj innego opisu."

        return error_msg

    async def generate_video(
            self,
            prompt: str,
            model: Optional[str] = None,
            width: int = 848,
            height: int = 480,
            duration: int = 5,
            reference_image: Optional[str] = None,
    ) -> Dict[str, Any]:

        if not self.is_available:
            return {
                "success": False,
                "error": "Pollinations API key not configured. Add POLLINATIONS_API_KEY to .env",
                "provider": self.name,
            }

        original_prompt = prompt
        final_prompt = await self._enhance_and_translate(prompt)

        model_name = self.default_model

        logger.info("Video: generating model=%s", model_name)
        logger.debug("Video: original=%.80s... final=%.80s...", original_prompt, final_prompt)

        try:
            encoded_prompt = quote(final_prompt)

            video_url = (
                f"{self.base_url}/{encoded_prompt}"
                f"?model={model_name}"
                f"&width={width}"
                f"&height={height}"
                f"&duration={duration}"
                f"&nologo=true"
            )

            timeout = 240.0

            logger.debug("Video: GET text-to-video, timeout=%ss", timeout)

            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.get(
                    video_url,
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    follow_redirects=True,
                )

                return self._process_response(
                    response=response,
                    original_prompt=original_prompt,
                    translated_prompt=final_prompt,
                    prompt=final_prompt,
                    model_name=model_name,
                    width=width,
                    height=height,
                    duration=duration,
                )

        except httpx.TimeoutException:
            logger.error("Video: timeout after 240s")
            return {
                "success": False,
                "error": "Przekroczono limit czasu generowania wideo (4 min). Spróbuj krótszego promptu.",
                "provider": self.name,
                "retry_suggested": True,
            }

        except httpx.ConnectError as e:
            logger.error("Video: connection error: %s", e)
            return {
                "success": False,
                "error": "Nie można połączyć się z Pollinations. Sprawdź połączenie internetowe.",
                "provider": self.name,
            }

        except Exception as e:
            logger.exception("Video: unexpected error: %s", e)
            return {
                "success": False,
                "error": f"Nieoczekiwany błąd: {str(e)}",
                "provider": self.name,
            }

    def _process_response(
            self,
            response,
            original_prompt: str,
            translated_prompt: str,
            prompt: str,
            model_name: str,
            width: int,
            height: int,
            duration: int,
            has_reference: bool = False,
    ) -> Dict[str, Any]:

        logger.debug("Video: response status=%s", response.status_code)

        if response.status_code == 200:
            content_type = response.headers.get("content-type", "")
            content_length = len(response.content)

            logger.debug("Video: content-type=%s size=%d bytes", content_type, content_length)

            if ("video" in content_type or "octet-stream" in content_type) and content_length > 5000:
                video_base64 = base64.b64encode(response.content).decode("utf-8")

                if "webm" in content_type:
                    mime_type = "video/webm"
                elif "quicktime" in content_type or "mov" in content_type:
                    mime_type = "video/quicktime"
                else:
                    mime_type = "video/mp4"

                logger.info("Video: generated successfully, size=%d bytes", content_length)

                return {
                    "success": True,
                    "video_base64": video_base64,
                    "video_data": f"data:{mime_type};base64,{video_base64}",
                    "mime_type": mime_type,
                    "prompt": original_prompt,
                    "prompt_translated": translated_prompt if translated_prompt != original_prompt else None,
                    "prompt_final": prompt,
                    "provider": self.name,
                    "model": model_name,
                    "model_display_name": self.MODEL_DISPLAY_NAMES.get(model_name, model_name),
                    "width": width,
                    "height": height,
                    "duration": duration,
                    "size_bytes": content_length,
                    "has_reference_image": has_reference,
                }
            else:
                error_msg = self._parse_error_message(response)
                logger.error("Video: not a video response: %s", error_msg)
                return {
                    "success": False,
                    "error": error_msg,
                    "provider": self.name,
                }

        elif response.status_code == 401:
            return {
                "success": False,
                "error": "Nieprawidłowy klucz API. Sprawdź POLLINATIONS_API_KEY.",
                "provider": self.name,
            }

        elif response.status_code == 402:
            return {
                "success": False,
                "error": "Brak kredytów Pollinations. Doładuj konto na enter.pollinations.ai",
                "provider": self.name,
            }

        elif response.status_code == 429:
            return {
                "success": False,
                "error": "Zbyt wiele zapytań. Spróbuj ponownie za chwilę.",
                "provider": self.name,
                "retry_suggested": True,
            }

        elif response.status_code in (400, 422):
            error_msg = self._parse_error_message(response)
            return {
                "success": False,
                "error": error_msg,
                "provider": self.name,
            }

        elif response.status_code in (502, 503):
            return {
                "success": False,
                "error": "Serwer jest przeciążony. Generowanie wideo wymaga dużych zasobów - spróbuj ponownie za chwilę.",
                "provider": self.name,
                "retry_suggested": True,
            }

        else:
            error_msg = self._parse_error_message(response)
            return {
                "success": False,
                "error": error_msg,
                "provider": self.name,
            }
