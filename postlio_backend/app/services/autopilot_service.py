# postlio_backend/app/services/autopilot_service.py
"""
Serwis Autopilot - logika biznesowa generowania i zarządzania kolejką.
"""
from datetime import datetime, timedelta
from typing import Optional, List, Tuple, Dict, Any
import random
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload

from app.models.autopilot import AutopilotConfig, AutopilotQueueItem, AutopilotStatus
from app.models.brand import Brand
from app.schemas.autopilot import (
    AutopilotConfigCreate,
    AutopilotConfigUpdate,
    QueueItemUpdate,
    QueueStatsResponse,
)
from app.services.ai import text_ai_manager, image_ai_manager
from app.models.social_account import SocialAccount

logger = logging.getLogger(__name__)


# Mapowanie kategorii na tematy do generowania
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

# Mapowanie kategorii rozszerzonych na podstawowe (dla backendu)
CATEGORY_MAPPING = {
    "kitchen": "cooking",
    "baking": "cooking",
    "coffee": "lifestyle",
    "wine": "lifestyle",
    "vegan": "diet",
    "mental-health": "health",
    "cosmetics": "beauty",
    "fashion": "lifestyle",
    "hair": "beauty",
    "training": "fitness",
    "exercises": "fitness",
    "sport": "fitness",
    "yoga": "fitness",
    "running": "fitness",
    "cycling": "fitness",
    "animals": "nature",
    "gardening": "nature",
    "hiking": "travel",
    "marketing": "business",
    "finance": "business",
    "ecommerce": "business",
    "art": "entertainment",
    "music": "entertainment",
    "photography": "lifestyle",
    "handmade": "lifestyle",
    "books": "education",
    "movies": "entertainment",
    "gaming": "entertainment",
    "home": "lifestyle",
    "diy": "lifestyle",
    "parenting": "lifestyle",
    "kids": "lifestyle",
    "motivation": "lifestyle",
    "quotes": "lifestyle",
    "productivity": "business",
    "career": "business",
    "holidays": "lifestyle",
    "events": "entertainment",
    "seasons": "nature",
    "local": "lifestyle",
    "community": "lifestyle",
}


class AutopilotService:
    """Serwis do zarządzania Autopilotem."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # === CONFIG CRUD ===

    async def get_config(self, config_id: int, user_id: int) -> Optional[AutopilotConfig]:
        """Pobierz konfigurację po ID."""
        result = await self.db.execute(
            select(AutopilotConfig)
            .where(AutopilotConfig.id == config_id)
            .where(AutopilotConfig.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_config_by_brand(self, brand_id: int, user_id: int) -> Optional[AutopilotConfig]:
        """Pobierz konfigurację dla marki."""
        result = await self.db.execute(
            select(AutopilotConfig)
            .where(AutopilotConfig.brand_id == brand_id)
            .where(AutopilotConfig.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_user_configs(self, user_id: int) -> List[AutopilotConfig]:
        """Pobierz wszystkie konfiguracje użytkownika."""
        result = await self.db.execute(
            select(AutopilotConfig)
            .where(AutopilotConfig.user_id == user_id)
            .order_by(AutopilotConfig.created_at.desc())
        )
        return list(result.scalars().all())

    async def create_config(self, user_id: int, data: AutopilotConfigCreate) -> AutopilotConfig:
        """Utwórz nową konfigurację Autopilota."""
        # Sprawdź czy marka istnieje i należy do użytkownika
        brand_result = await self.db.execute(
            select(Brand)
            .where(Brand.id == data.brand_id)
            .where(Brand.user_id == user_id)
        )
        brand = brand_result.scalar_one_or_none()
        if not brand:
            raise ValueError("Brand not found or access denied")

        # Sprawdź czy już istnieje konfiguracja dla tej marki
        existing = await self.get_config_by_brand(data.brand_id, user_id)
        if existing:
            raise ValueError("Autopilot config already exists for this brand")

        config = AutopilotConfig(
            user_id=user_id,
            brand_id=data.brand_id,
            posts_per_week=data.posts_per_week,
            schedule_days=data.schedule_days,
            schedule_time=data.schedule_time,
            timezone=data.timezone,
            platforms=data.platforms,
            categories=data.categories,
            creativity_level=data.creativity_level,
            post_length=data.post_length.value if hasattr(data.post_length, 'value') else data.post_length,
            include_images=data.include_images,
            include_hashtags=data.include_hashtags,
            include_emoji=data.include_emoji,
            text_provider=data.text_provider,
            image_provider=data.image_provider,
            image_style=data.image_style,
        )

        self.db.add(config)
        await self.db.flush()
        await self.db.refresh(config)
        return config

    async def update_config(
        self, config_id: int, user_id: int, data: AutopilotConfigUpdate
    ) -> Optional[AutopilotConfig]:
        """Zaktualizuj konfigurację."""
        config = await self.get_config(config_id, user_id)
        if not config:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(value, 'value'):  # Enum
                value = value.value
            setattr(config, field, value)

        config.updated_at = datetime.utcnow()
        await self.db.flush()
        await self.db.refresh(config)
        return config

    async def delete_config(self, config_id: int, user_id: int) -> bool:
        """Usuń konfigurację."""
        config = await self.get_config(config_id, user_id)
        if not config:
            return False

        await self.db.delete(config)
        await self.db.flush()
        return True

    async def toggle_active(self, config_id: int, user_id: int, active: bool) -> Optional[AutopilotConfig]:
        """Włącz/wyłącz Autopilota."""
        config = await self.get_config(config_id, user_id)
        if not config:
            return None

        config.is_active = active
        if active:
            config.is_paused = False
        config.updated_at = datetime.utcnow()

        await self.db.flush()
        await self.db.refresh(config)
        return config

    async def toggle_pause(self, config_id: int, user_id: int, paused: bool) -> Optional[AutopilotConfig]:
        """Wstrzymaj/wznów Autopilota."""
        config = await self.get_config(config_id, user_id)
        if not config:
            return None

        config.is_paused = paused
        config.updated_at = datetime.utcnow()

        await self.db.flush()
        await self.db.refresh(config)
        return config

    # === QUEUE MANAGEMENT ===

    async def get_queue_item(self, item_id: int, user_id: int) -> Optional[AutopilotQueueItem]:
        """Pobierz element kolejki."""
        result = await self.db.execute(
            select(AutopilotQueueItem)
            .where(AutopilotQueueItem.id == item_id)
            .where(AutopilotQueueItem.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_queue_items(
        self,
        config_id: int,
        user_id: int,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[AutopilotQueueItem]:
        """Pobierz elementy kolejki dla konfiguracji."""
        query = (
            select(AutopilotQueueItem)
            .where(AutopilotQueueItem.config_id == config_id)
            .where(AutopilotQueueItem.user_id == user_id)
        )

        if status:
            query = query.where(AutopilotQueueItem.status == status)

        query = query.order_by(AutopilotQueueItem.scheduled_for.asc())
        query = query.limit(limit).offset(offset)

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_pending_items(self, config_id: int, user_id: int) -> List[AutopilotQueueItem]:
        """Pobierz elementy czekające na zatwierdzenie."""
        return await self.get_queue_items(config_id, user_id, status="pending")

    async def get_upcoming_items(self, config_id: int, user_id: int, days: int = 7) -> List[AutopilotQueueItem]:
        """Pobierz nadchodzące zaplanowane elementy."""
        now = datetime.utcnow()
        future = now + timedelta(days=days)

        result = await self.db.execute(
            select(AutopilotQueueItem)
            .where(AutopilotQueueItem.config_id == config_id)
            .where(AutopilotQueueItem.user_id == user_id)
            .where(AutopilotQueueItem.status.in_(["approved", "scheduled"]))
            .where(AutopilotQueueItem.scheduled_for >= now)
            .where(AutopilotQueueItem.scheduled_for <= future)
            .order_by(AutopilotQueueItem.scheduled_for.asc())
            .limit(20)
        )
        return list(result.scalars().all())

    async def update_queue_item(
        self, item_id: int, user_id: int, data: QueueItemUpdate
    ) -> Optional[AutopilotQueueItem]:
        """Zaktualizuj element kolejki."""
        item = await self.get_queue_item(item_id, user_id)
        if not item:
            return None

        update_data = data.model_dump(exclude_unset=True)

        # Jeśli zmieniono content, zwiększ edit_count
        if "content" in update_data and update_data["content"] != item.content:
            item.edit_count += 1

        for field, value in update_data.items():
            if hasattr(value, 'value'):  # Enum
                value = value.value
            setattr(item, field, value)

        item.updated_at = datetime.utcnow()
        await self.db.flush()
        await self.db.refresh(item)
        return item

    async def approve_item(
        self,
        item_id: int,
        user_id: int,
        publish_immediately: bool = False
    ) -> Optional[AutopilotQueueItem]:
        """
        Zatwierdź element do publikacji.

        Args:
            item_id: ID elementu
            user_id: ID użytkownika
            publish_immediately: Czy opublikować od razu (ignorując scheduled_for)
        """
        item = await self.get_queue_item(item_id, user_id)
        if not item:
            return None

        item.status = "approved"
        item.updated_at = datetime.utcnow()

        # Aktualizuj statystyki konfiguracji
        config = await self.get_config(item.config_id, user_id)
        if config:
            config.total_approved += 1

            # Sprawdź auto_publish_on_approve
            if publish_immediately or config.auto_publish_on_approve:
                from app.services.publish_service import PublishService

                publish_service = PublishService(self.db)
                result = await publish_service.publish_queue_item(item, force=True)

                if not result.success:
                    logger.warning(f"Auto-publish failed for item {item_id}: {result.error}")

        await self.db.flush()
        await self.db.refresh(item)
        return item

    async def reject_item(
        self, 
        item_id: int, 
        user_id: int, 
        notes: Optional[str] = None
    ) -> Optional[AutopilotQueueItem]:
        """Odrzuć element."""
        item = await self.get_queue_item(item_id, user_id)
        if not item:
            return None

        item.status = "rejected"
        if notes:
            item.user_notes = notes
        item.updated_at = datetime.utcnow()

        # Aktualizuj statystyki konfiguracji
        config = await self.get_config(item.config_id, user_id)
        if config:
            config.total_rejected += 1

        await self.db.flush()
        await self.db.refresh(item)
        return item

    async def delete_queue_item(self, item_id: int, user_id: int) -> bool:
        """Usuń element kolejki."""
        item = await self.get_queue_item(item_id, user_id)
        if not item:
            return False

        await self.db.delete(item)
        await self.db.flush()
        return True

    async def bulk_action(
        self, item_ids: List[int], user_id: int, action: str
    ) -> Tuple[int, int]:
        """Wykonaj akcję na wielu elementach. Zwraca (success_count, fail_count)."""
        success = 0
        fail = 0

        for item_id in item_ids:
            try:
                if action == "approve":
                    result = await self.approve_item(item_id, user_id)
                elif action == "reject":
                    result = await self.reject_item(item_id, user_id)
                elif action == "delete":
                    result = await self.delete_queue_item(item_id, user_id)
                else:
                    fail += 1
                    continue

                if result or (action == "delete" and result is True):
                    success += 1
                else:
                    fail += 1
            except Exception as e:
                logger.error(f"Bulk action error for item {item_id}: {e}")
                fail += 1

        return success, fail

    # === STATS ===

    async def get_queue_stats(self, config_id: int, user_id: int) -> QueueStatsResponse:
        """Pobierz statystyki kolejki."""
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=today_start.weekday())

        # Pending count
        pending_result = await self.db.execute(
            select(func.count(AutopilotQueueItem.id))
            .where(AutopilotQueueItem.config_id == config_id)
            .where(AutopilotQueueItem.user_id == user_id)
            .where(AutopilotQueueItem.status == "pending")
        )
        pending_count = pending_result.scalar() or 0

        # Approved count
        approved_result = await self.db.execute(
            select(func.count(AutopilotQueueItem.id))
            .where(AutopilotQueueItem.config_id == config_id)
            .where(AutopilotQueueItem.user_id == user_id)
            .where(AutopilotQueueItem.status == "approved")
        )
        approved_count = approved_result.scalar() or 0

        # Scheduled count
        scheduled_result = await self.db.execute(
            select(func.count(AutopilotQueueItem.id))
            .where(AutopilotQueueItem.config_id == config_id)
            .where(AutopilotQueueItem.user_id == user_id)
            .where(AutopilotQueueItem.status == "scheduled")
        )
        scheduled_count = scheduled_result.scalar() or 0

        # Published today
        published_today_result = await self.db.execute(
            select(func.count(AutopilotQueueItem.id))
            .where(AutopilotQueueItem.config_id == config_id)
            .where(AutopilotQueueItem.user_id == user_id)
            .where(AutopilotQueueItem.status == "published")
            .where(AutopilotQueueItem.published_at >= today_start)
        )
        published_today = published_today_result.scalar() or 0

        # Published this week
        published_week_result = await self.db.execute(
            select(func.count(AutopilotQueueItem.id))
            .where(AutopilotQueueItem.config_id == config_id)
            .where(AutopilotQueueItem.user_id == user_id)
            .where(AutopilotQueueItem.status == "published")
            .where(AutopilotQueueItem.published_at >= week_start)
        )
        published_this_week = published_week_result.scalar() or 0

        # Total for rejection rate
        total_result = await self.db.execute(
            select(func.count(AutopilotQueueItem.id))
            .where(AutopilotQueueItem.config_id == config_id)
            .where(AutopilotQueueItem.user_id == user_id)
            .where(AutopilotQueueItem.status.in_(["approved", "rejected", "published"]))
        )
        total_reviewed = total_result.scalar() or 0

        rejected_result = await self.db.execute(
            select(func.count(AutopilotQueueItem.id))
            .where(AutopilotQueueItem.config_id == config_id)
            .where(AutopilotQueueItem.user_id == user_id)
            .where(AutopilotQueueItem.status == "rejected")
        )
        rejected_count = rejected_result.scalar() or 0

        rejection_rate = (rejected_count / total_reviewed * 100) if total_reviewed > 0 else 0.0

        # Average edit count
        avg_edit_result = await self.db.execute(
            select(func.avg(AutopilotQueueItem.edit_count))
            .where(AutopilotQueueItem.config_id == config_id)
            .where(AutopilotQueueItem.user_id == user_id)
        )
        average_edit_count = avg_edit_result.scalar() or 0.0

        return QueueStatsResponse(
            pending_count=pending_count,
            approved_count=approved_count,
            scheduled_count=scheduled_count,
            published_today=published_today,
            published_this_week=published_this_week,
            rejection_rate=round(rejection_rate, 1),
            average_edit_count=round(float(average_edit_count), 1),
        )

    def calculate_health_score(self, config: AutopilotConfig, stats: QueueStatsResponse) -> int:
        """Oblicz health score (0-100) dla Autopilota."""
        score = 100

        # Kary za wysoką rejection rate
        if stats.rejection_rate > 50:
            score -= 30
        elif stats.rejection_rate > 30:
            score -= 15
        elif stats.rejection_rate > 10:
            score -= 5

        # Kary za dużą liczbę edycji
        if stats.average_edit_count > 3:
            score -= 20
        elif stats.average_edit_count > 2:
            score -= 10
        elif stats.average_edit_count > 1:
            score -= 5

        # Bonus za streak
        if config.streak_days >= 30:
            score += 10
        elif config.streak_days >= 7:
            score += 5

        # Kara za brak publikacji
        if stats.published_this_week == 0 and config.is_active:
            score -= 15

        # Bonus za zatwierdzenie
        if stats.approved_count > 0:
            score += 5

        return max(0, min(100, score))

    def get_next_scheduled_time(self, config: AutopilotConfig) -> Optional[datetime]:
        """Oblicz następny zaplanowany czas publikacji."""
        if not config.is_active or config.is_paused:
            return None

        now = datetime.utcnow()
        schedule_days = config.schedule_days or ["monday", "wednesday", "friday"]
        schedule_time = config.schedule_time or "10:00"

        try:
            hour, minute = map(int, schedule_time.split(":"))
        except:
            hour, minute = 10, 0

        # Szukaj następnego dnia z harmonogramu
        for days_ahead in range(8):
            check_date = now + timedelta(days=days_ahead)
            day_name = check_date.strftime("%A").lower()

            if day_name in schedule_days:
                scheduled = check_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
                if scheduled > now:
                    return scheduled

        return None

    # === CONTENT GENERATION ===

    def select_topic(self, config: AutopilotConfig) -> Tuple[str, str]:
        """Wybierz temat do wygenerowania. Zwraca (category, topic)."""
        categories = config.categories or ["lifestyle"]
        category = random.choice(categories)

        # Mapuj rozszerzoną kategorię na podstawową
        base_category = CATEGORY_MAPPING.get(category, category)

        topics = CATEGORY_TOPICS.get(base_category, CATEGORY_TOPICS["lifestyle"])
        topic = random.choice(topics)

        return category, topic

    def map_creativity_to_temperature(self, creativity_level: int) -> float:
        """Mapuj poziom kreatywności (0-100) na temperature AI (0.1-1.5)."""
        return 0.1 + (creativity_level / 100) * 1.4

    def map_post_length(self, post_length: str) -> int:
        """Mapuj długość posta na max_length."""
        mapping = {
            "short": 150,
            "medium": 300,
            "long": 500,
        }
        return mapping.get(post_length, 300)

    def build_voice_prompt(self, brand: Brand) -> str:
        """
        Zbuduj instrukcje dla AI na podstawie Brand Voice DNA.
        """
        voice_dna = brand.voice_dna or {}

        prompt_parts = []

        # Nazwa marki i opis
        prompt_parts.append(f"Piszesz jako marka: {brand.name}")
        if brand.description:
            prompt_parts.append(f"Opis marki: {brand.description}")

        # Ton i styl
        formality = voice_dna.get("formality", 50)
        energy = voice_dna.get("energy", 50)
        humor = voice_dna.get("humor", 30)
        emotion = voice_dna.get("emotion", 50)

        tone_descriptions = []
        if formality > 70:
            tone_descriptions.append("formalny i profesjonalny")
        elif formality < 30:
            tone_descriptions.append("swobodny i przyjacielski")

        if energy > 70:
            tone_descriptions.append("energiczny i entuzjastyczny")
        elif energy < 30:
            tone_descriptions.append("spokojny i stonowany")

        if humor > 50:
            tone_descriptions.append("z nutką humoru")

        if emotion > 70:
            tone_descriptions.append("emocjonalny i angażujący")

        if tone_descriptions:
            prompt_parts.append(f"Ton: {', '.join(tone_descriptions)}")

        # Cechy osobowości
        personality = voice_dna.get("personality_traits", [])
        if personality:
            prompt_parts.append(f"Cechy marki: {', '.join(personality[:5])}")

        # Style komunikacji
        styles = voice_dna.get("communication_styles", [])
        if styles:
            prompt_parts.append(f"Styl komunikacji: {', '.join(styles[:3])}")

        # Słowa kluczowe
        keywords = voice_dna.get("keywords", [])
        if keywords:
            prompt_parts.append(f"Uwzględnij słowa kluczowe: {', '.join(keywords[:5])}")

        # Zakazane słowa
        forbidden = voice_dna.get("forbidden_words", [])
        if forbidden:
            prompt_parts.append(f"NIE używaj słów: {', '.join(forbidden[:5])}")

        # Przykładowe posty
        samples = voice_dna.get("sample_posts", [])
        if samples:
            prompt_parts.append(f"Inspiruj się stylem (ale nie kopiuj): {samples[0][:200]}")

        return "\n".join(prompt_parts)

    async def generate_posts(
        self,
        config: AutopilotConfig,
        count: int = 1,
        topics: Optional[List[str]] = None,
        platforms: Optional[List[str]] = None,
    ) -> Tuple[List[AutopilotQueueItem], List[str]]:
        """
        Generuj posty dla konfiguracji Autopilota.
        """
        # Pobierz markę
        brand_result = await self.db.execute(
            select(Brand).where(Brand.id == config.brand_id)
        )
        brand = brand_result.scalar_one_or_none()

        if not brand:
            raise ValueError("Brand not found")

        # Przygotuj instrukcje Voice DNA
        voice_prompt = self.build_voice_prompt(brand)

        # Platformy do użycia
        target_platforms = platforms or config.platforms or ["facebook"]

        # Parametry generowania
        max_length = self.map_post_length(config.post_length)

        # Oblicz scheduled_for dla kolejnych postów
        base_scheduled_time = self.get_next_scheduled_time(config) or (datetime.utcnow() + timedelta(hours=1))

        # Pobierz mapowanie kont social
        social_account_mapping = config.social_account_mapping or {}

        generated_items: List[AutopilotQueueItem] = []
        errors: List[str] = []

        for i in range(count):
            # Wybierz temat
            if topics and i < len(topics):
                topic = topics[i]
                category = config.categories[0] if config.categories else "lifestyle"
            else:
                category, topic = self.select_topic(config)

            # Wybierz platformę (rotacja)
            platform = target_platforms[i % len(target_platforms)]

            # Pobierz social_account_id dla platformy
            social_account_id = social_account_mapping.get(platform)

            # Oblicz czas publikacji (rozłóż w czasie)
            scheduled_for = base_scheduled_time + timedelta(hours=i * 24)

            try:
                # === GENERUJ TEKST ===
                logger.info(f"🤖 Generating text for topic: {topic}, platform: {platform}")

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

                # === GENERUJ OBRAZ (opcjonalnie) ===
                image_url = None
                image_provider_used = None

                if config.include_images and config.image_provider != "none":
                    try:
                        logger.info(f"🖼️ Generating image for topic: {topic}")
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
                            logger.warning(f"Image generation failed: {image_result.get('error')}")

                    except Exception as img_error:
                        logger.warning(f"Image generation error: {img_error}")

                # === UTWÓRZ ELEMENT KOLEJKI ===
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

                logger.info(f"✅ Generated post {i + 1}/{count} for {platform}")

            except Exception as e:
                error_msg = f"Błąd generowania posta {i + 1}: {str(e)}"
                logger.error(error_msg)
                errors.append(error_msg)

        # Aktualizuj statystyki konfiguracji
        if generated_items:
            config.total_generated += len(generated_items)
            config.last_generation_at = datetime.utcnow()

            if config.last_generation_at:
                days_since_last = (datetime.utcnow() - config.last_generation_at).days
                if days_since_last <= 1:
                    config.streak_days += 1
                else:
                    config.streak_days = 1
            else:
                config.streak_days = 1

        await self.db.flush()

        for item in generated_items:
            await self.db.refresh(item)

        return generated_items, errors


def get_autopilot_service(db: AsyncSession) -> AutopilotService:
    """Factory function dla AutopilotService."""
    return AutopilotService(db)