# postlio_backend/app/services/ai/video/base.py

from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
from enum import Enum


class VideoProvider(str, Enum):
    POLLINATIONS = "pollinations"


class BaseVideoProvider(ABC):

    name: str
    models: List[str] = []
    is_free: bool = True

    @property
    @abstractmethod
    def is_available(self) -> bool:
        pass

    @abstractmethod
    async def generate_video(
            self,
            prompt: str,
            model: Optional[str] = None,
            width: int = 848,
            height: int = 480,
            duration: int = 5,
            reference_image: Optional[str] = None,
    ) -> Dict[str, Any]:
        pass

    def _enhance_prompt(self, prompt: str) -> str:
        return f"{prompt}, high quality, smooth motion, cinematic"