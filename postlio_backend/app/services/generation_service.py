import logging
import random
from datetime import datetime, timedelta
from typing import Optional, List, Tuple

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.autopilot import AutopilotConfig, AutopilotQueueItem
from app.models.brand import Brand
from app.services.ai import text_ai_manager, image_ai_manager

logger = logging.getLogger(__name__)

CATEGORY_TOPICS = {
    "fitness": [
        "motywacja do treningu", "poranny rozruch", "ćwiczenia w domu",
        "regeneracja po treningu", "zdrowe nawyki sportowe", "trening siłowy",
        "cardio dla początkujących", "stretching i mobilność"
    ],
    "health": [
        "zdrowy sen", "nawodnienie organizmu", "odporność", "zdrowe nawyki",
        "profilaktyka zdrowotna", "energia na co dzień", "redukcja stresu"
    ],
    "beauty": [
        "pielęgnacja skóry", "rutyna urody", "naturalne kosmetyki",
        "makijaż na co dzień", "pielęgnacja włosów", "anti-aging"
    ],
    "cooking": [
        "szybkie przepisy", "zdrowe śniadanie", "meal prep", "kuchnia sezonowa",
        "gotowanie dla rodziny", "dania jednogarnkowe", "zdrowe przekąski"
    ],
    "business": [
        "produktywność", "zarządzanie czasem", "networking", "rozwój kariery",
        "praca zdalna", "motywacja w pracy", "work-life balance"
    ],
    "technology": [
        "nowości technologiczne", "aplikacje przydatne", "cyberbezpieczeństwo",
        "automatyzacja", "social media tips", "digital wellbeing"
    ],
    "travel": [
        "planowanie podróży", "ukryte perełki", "podróże budżetowe",
        "weekend wypad", "pakowanie", "lokalne smaki"
    ],
    "lifestyle": [
        "slow life", "minimalizm", "organizacja domu", "hobby i pasje",
        "czas dla siebie", "relacje", "codzienne rytuały"
    ],
    "education": [
        "nauka języków", "rozwój osobisty", "czytanie książek",
        "nowe umiejętności", "kursy online", "lifelong learning"
    ],
    "entertainment": [
        "premiery filmowe", "seriale warte uwagi", "muzyka na nastrój",
        "gry i rozrywka", "wydarzenia kulturalne", "weekend ideas"
    ],
    "nature": [
        "kontakt z naturą", "ekologia", "rośliny domowe", "ogrodnictwo",
        "spacery", "las i góry", "zrównoważony styl życia"
    ],
    "diet": [
        "zdrowe odżywianie", "dieta bez glutenu", "weganizm", "keto",
        "intuicyjne jedzenie", "suplementacja", "nawyki żywieniowe"
    ],
}

CATEGORY_MAPPING = {
    "kitchen": "cooking", "baking": "cooking", "coffee": "lifestyle", "wine": "lifestyle",
    "vegan": "diet", "mental-health": "health", "cosmetics": "beauty", "fashion": "lifestyle",
    "hair": "beauty", "training": "fitness", "exercises": "fitness", "sport": "fitness",
    "yoga": "fitness", "running": "fitness", "cycling": "fitness", "animals": "nature",
    "gardening": "nature", "hiking": "travel", "marketing": "business", "finance": "business",
    "ecommerce": "business", "art": "entertainment", "music": "entertainment",
    "photography": "lifestyle", "handmade": "lifestyle", "books": "education",
    "movies": "entertainment", "gaming": "entertainment", "home": "lifestyle", "diy": "lifestyle",
    "parenting": "lifestyle", "kids": "lifestyle", "motivation": "lifestyle", "quotes": "lifestyle",
    "productivity": "business", "career": "business", "holidays": "lifestyle",
    "events": "entertainment", "seasons": "nature", "local": "lifestyle", "community": "lifestyle",
}


class GenerationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    def select_topic(self, config: AutopilotConfig) -> Tuple[str, str]:
        categories = config.categories or ["lifestyle"]
        category = random.choice(categories)
        base_category = CATEGORY_MAPPING.get(category, category)
        topics = CATEGORY_TOPICS.get(base_category, CATEGORY_TOPICS["lifestyle"])
        return category, random.choice(topics)

    def map_creativity_to_temperature(self, creativity_level: int) -> float:
        return 0.1 + (creativity_level / 100) * 1.4

    def map_post_length(self, post_length: str) -> int:
        return {"short": 150, "medium": 300, "long": 500}.get(post_length, 300)

    def build_voice_prompt(self, brand: Brand) -> str:
        voice_dna = brand.voice_dna or {}
        parts = [f"Piszesz jako marka: {brand.name}"]

        if brand.description:
            parts.append(f"Opis marki: {brand.description}")

        formality = voice_dna.get("formality", 50)
        energy = voice_dna.get("energy", 50)
        humor = voice_dna.get("humor", 30)
        emotion = voice_dna.get("emotion", 50)

        tone = []
        if formality > 70:
            tone.append("formalny i profesjonalny")
        elif formality < 30:
            tone.append("swobodny i przyjacielski")
        if energy > 70:
            tone.append("energiczny i entuzjastyczny")
        elif energy < 30:
            tone.append("spokojny i stonowany")
        if humor > 50:
            tone.append("z nutką humoru")
        if emotion > 70:
            tone.append("emocjonalny i angażujący")
        if tone:
            parts.append(f"Ton: {', '.join(tone)}")

        personality = voice_dna.get("personality_traits", [])
        if personality:
            parts.append(f"Cechy marki: {', '.join(personality[:5])}")

        styles = voice_dna.get("communication_styles", [])
        if styles:
            parts.append(f"Styl komunikacji: {', '.join(styles[:3])}")

        keywords = voice_dna.get("keywords", [])
        if keywords:
            parts.append(f"Uwzględnij słowa kluczowe: {', '.join(keywords[:5])}")

        forbidden = voice_dna.get("forbidden_words", [])
        if forbidden:
            parts.append(f"NIE używaj słów: {', '.join(forbidden[:5])}")

        samples = voice_dna.get("sample_posts", [])
        if samples:
            parts.append(f"Inspiruj się stylem (ale nie kopiuj): {samples[0][:200]}")

        return "\n".join(parts)

    def get_next_scheduled_time(self, config: AutopilotConfig) -> Optional[datetime]:
        if not config.is_active or config.is_paused:
            return None

        now = datetime.utcnow()
        schedule_days = config.schedule_days or ["monday", "wednesday", "friday"]
        schedule_time = config.schedule_time or "10:00"

        try:
            hour, minute = map(int, schedule_time.split(":"))
        except Exception:
            hour, minute = 10, 0

        for days_ahead in range(8):
            check_date = now + timedelta(days=days_ahead)
            if check_date.strftime("%A").lower() in schedule_days:
                scheduled = check_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
                if scheduled > now:
                    return scheduled

        return None

    async def generate_posts(
        self,
        config: AutopilotConfig,
        count: int = 1,
        topics: Optional[List[str]] = None,
        platforms: Optional[List[str]] = None,
    ) -> Tuple[List[AutopilotQueueItem], List[str]]:
        brand_result = await self.db.execute(select(Brand).where(Brand.id == config.brand_id))
        brand = brand_result.scalar_one_or_none()
        if not brand:
            raise ValueError("Brand not found")

        voice_prompt = self.build_voice_prompt(brand)
        target_platforms = platforms or config.platforms or ["facebook"]
        max_length = self.map_post_length(config.post_length)
        base_scheduled_time = self.get_next_scheduled_time(config) or (datetime.utcnow() + timedelta(hours=1))
        social_account_mapping = config.social_account_mapping or {}

        generated_items: List[AutopilotQueueItem] = []
        errors: List[str] = []

        for i in range(count):
            if topics and i < len(topics):
                topic = topics[i]
                category = config.categories[0] if config.categories else "lifestyle"
            else:
                category, topic = self.select_topic(config)

            platform = target_platforms[i % len(target_platforms)]
            social_account_id = social_account_mapping.get(platform)
            scheduled_for = base_scheduled_time + timedelta(hours=i * 24)

            try:
                logger.info("Generating text for topic: %s, platform: %s", topic, platform)

                full_topic = f"{topic}\n\n[INSTRUKCJE GŁOSU MARKI]\n{voice_prompt}"
                text_provider = text_ai_manager.get_provider(config.text_provider)
                text_result = await text_provider.generate_post(
                    topic=full_topic,
                    platform=platform,
                    tone="professional",
                    category=CATEGORY_MAPPING.get(category, category),
                    language="pl",
                    include_hashtags=config.include_hashtags,
                    include_emoji=config.include_emoji,
                    max_length=max_length,
                )

                if not text_result.get("success"):
                    errors.append(f"Błąd generowania tekstu dla '{topic}': {text_result.get('error')}")
                    continue

                content = text_result["content"]
                hashtags = text_result.get("hashtags", [])

                image_url = None
                image_provider_used = None

                if config.include_images and config.image_provider != "none":
                    try:
                        logger.info("Generating image for topic: %s", topic)
                        image_prompt = f"{topic}, {brand.name} brand style, {config.image_style}"
                        image_result = await image_ai_manager.generate_image(
                            prompt=image_prompt,
                            provider=config.image_provider,
                            style=config.image_style,
                            width=1024,
                            height=1024,
                        )
                        if image_result.get("success"):
                            image_url = image_result.get("image_url")
                            image_provider_used = image_result.get("provider")
                        else:
                            logger.warning("Image generation failed: %s", image_result.get("error"))
                    except Exception as img_error:
                        logger.warning("Image generation error: %s", img_error)

                queue_item = AutopilotQueueItem(
                    config_id=config.id,
                    user_id=config.user_id,
                    brand_id=config.brand_id,
                    platform=platform,
                    content=content,
                    image_url=image_url,
                    hashtags=hashtags if isinstance(hashtags, list) else [],
                    category=category,
                    status="pending",
                    scheduled_for=scheduled_for,
                    topic_used=topic,
                    text_provider_used=config.text_provider,
                    image_provider_used=image_provider_used,
                    social_account_id=social_account_id,
                    generation_params={
                        "creativity_level": config.creativity_level,
                        "post_length": config.post_length,
                        "voice_dna_used": bool(brand.voice_dna),
                    },
                )

                self.db.add(queue_item)
                generated_items.append(queue_item)
                logger.info("Generated post %d/%d for %s", i + 1, count, platform)

            except Exception as e:
                error_msg = f"Błąd generowania posta {i + 1}: {str(e)}"
                logger.error(error_msg)
                errors.append(error_msg)

        if generated_items:
            config.total_generated += len(generated_items)
            config.last_generation_at = datetime.utcnow()
            if config.last_generation_at:
                days_since_last = (datetime.utcnow() - config.last_generation_at).days
                config.streak_days = config.streak_days + 1 if days_since_last <= 1 else 1
            else:
                config.streak_days = 1

        await self.db.flush()
        for item in generated_items:
            await self.db.refresh(item)

        return generated_items, errors
