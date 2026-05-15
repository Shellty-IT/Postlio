from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
from enum import Enum


class TextProvider(str, Enum):
    GEMINI = "gemini"
    GROQ = "groq"


class BaseTextProvider(ABC):
    """Abstract base class for text AI providers."""

    name: str = "base"
    models: List[str] = []

    @property
    @abstractmethod
    def is_available(self) -> bool:
        """Check if provider has API key configured."""
        pass

    @abstractmethod
    async def generate_post(
            self,
            topic: str,
            platform: str,
            tone: str = "professional",
            category: Optional[str] = None,
            language: str = "pl",
            include_hashtags: bool = True,
            include_emoji: bool = True,
            max_length: Optional[int] = None,
            model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate a social media post."""
        pass

    @abstractmethod
    async def generate_variations(
            self,
            original_content: str,
            platform: str,
            count: int = 3,
            model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate variations of existing content."""
        pass

    @abstractmethod
    async def improve_text(
            self,
            content: str,
            platform: str,
            instructions: Optional[str] = None,
            model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Improve existing text."""
        pass

    @abstractmethod
    async def chat(
            self,
            messages: List[Dict[str, str]],
            category: Optional[str] = None,
            platform: Optional[str] = None,
            model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Interactive chat for content creation."""
        pass

    def _get_platform_guidelines(self, platform: str) -> str:
        """Get platform-specific content guidelines."""
        guidelines = {
            "facebook": """
- Optymalna długość: 100-250 znaków
- Używaj pytań angażujących
- Emotikony z umiarem
- Dodaj call-to-action
- Hashtagi: 2-3 maksymalnie""",
            "instagram": """
- Optymalna długość: 138-150 znaków (max 2200)
- Pierwsza linijka przyciąga uwagę
- Hashtagi: 5-15 relevantnych
- Używaj emotikon
- Storytelling działa dobrze""",
            "linkedin": """
- Ton profesjonalny ale ludzki
- Optymalna długość: 150-300 znaków
- Unikaj nadmiaru emotikon
- Hashtagi: 3-5 branżowych
- Dziel się wiedzą i doświadczeniem""",
        }
        return guidelines.get(platform, "")

    def _get_tone_instructions(self, tone: str) -> str:
        """Get tone-specific instructions."""
        tones = {
            "professional": "Pisz profesjonalnie, merytorycznie, buduj autorytet.",
            "casual": "Pisz swobodnie, jakbyś rozmawiał z przyjacielem.",
            "humorous": "Dodaj humor, bądź zabawny ale nie przesadzaj.",
            "inspirational": "Inspiruj, motywuj, używaj pozytywnego języka.",
            "educational": "Ucz, wyjaśniaj, dziel się wiedzą w przystępny sposób.",
            "friendly": "Bądź ciepły, przyjazny, buduj relację.",
        }
        return tones.get(tone, tones["professional"])

    def _build_system_prompt(
            self,
            platform: str,
            tone: str,
            category: Optional[str] = None,
            include_emoji: bool = True,
            include_hashtags: bool = True,
            max_length: Optional[int] = None,
            language: str = "pl",
    ) -> str:
        """Build system prompt for post generation."""
        platform_guidelines = self._get_platform_guidelines(platform)
        tone_instructions = self._get_tone_instructions(tone)

        emoji_instruction = "Używaj emotikon." if include_emoji else "NIE używaj emotikon."
        hashtag_instruction = "Dodaj hashtagi na końcu." if include_hashtags else "NIE dodawaj hashtagów."
        length_instruction = f"Maksymalna długość: {max_length} znaków." if max_length else ""
        category_context = f"Kategoria/branża: {category}." if category else ""

        return f"""Jesteś ekspertem od social media marketingu. Tworzysz angażujące posty.

Platforma: {platform.upper()}
{platform_guidelines}

Styl: {tone_instructions}
{category_context}
{emoji_instruction}
{hashtag_instruction}
{length_instruction}

Odpowiadaj TYLKO treścią posta, bez dodatkowych komentarzy.
Język: {"polski" if language == "pl" else "angielski"}"""

    def _extract_hashtags(self, content: str) -> List[str]:
        """Extract hashtags from content."""
        words = content.split()
        return [w for w in words if w.startswith("#")]

    def _parse_variations(self, text: str, count: int) -> List[str]:
        """Parse numbered variations from response."""
        lines = text.strip().split("\n")
        variations = []
        current = ""

        for line in lines:
            line = line.strip()
            if line and len(line) > 0 and line[0].isdigit() and "." in line[:4]:
                if current:
                    variations.append(current.strip())
                current = line.split(".", 1)[1].strip() if "." in line else line
            elif line:
                current += " " + line

        if current:
            variations.append(current.strip())

        return variations[:count]