from datetime import datetime, timedelta
from typing import Optional, List, Tuple
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.autopilot import AutopilotConfig, AutopilotQueueItem
from app.models.brand import Brand
from app.schemas.autopilot import (
    AutopilotConfigCreate,
    AutopilotConfigUpdate,
    QueueItemUpdate,
    QueueStatsResponse,
)
from app.services.generation_service import GenerationService

logger = logging.getLogger(__name__)


class AutopilotService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self._gen = GenerationService(db)

    # === CONFIG CRUD ===

    async def get_config(self, config_id: int, user_id: int) -> Optional[AutopilotConfig]:
        result = await self.db.execute(
            select(AutopilotConfig)
            .where(AutopilotConfig.id == config_id)
            .where(AutopilotConfig.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_config_by_brand(self, brand_id: int, user_id: int) -> Optional[AutopilotConfig]:
        result = await self.db.execute(
            select(AutopilotConfig)
            .where(AutopilotConfig.brand_id == brand_id)
            .where(AutopilotConfig.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_user_configs(self, user_id: int) -> List[AutopilotConfig]:
        result = await self.db.execute(
            select(AutopilotConfig)
            .where(AutopilotConfig.user_id == user_id)
            .order_by(AutopilotConfig.created_at.desc())
        )
        return list(result.scalars().all())

    async def create_config(self, user_id: int, data: AutopilotConfigCreate) -> AutopilotConfig:
        brand_result = await self.db.execute(
            select(Brand).where(Brand.id == data.brand_id).where(Brand.user_id == user_id)
        )
        if not brand_result.scalar_one_or_none():
            raise ValueError("Brand not found or access denied")

        if await self.get_config_by_brand(data.brand_id, user_id):
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
        config = await self.get_config(config_id, user_id)
        if not config:
            return None

        for field, value in data.model_dump(exclude_unset=True).items():
            if hasattr(value, 'value'):
                value = value.value
            setattr(config, field, value)

        config.updated_at = datetime.utcnow()
        await self.db.flush()
        await self.db.refresh(config)
        return config

    async def delete_config(self, config_id: int, user_id: int) -> bool:
        config = await self.get_config(config_id, user_id)
        if not config:
            return False
        await self.db.delete(config)
        await self.db.flush()
        return True

    async def toggle_active(self, config_id: int, user_id: int, active: bool) -> Optional[AutopilotConfig]:
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
        result = await self.db.execute(
            select(AutopilotQueueItem)
            .where(AutopilotQueueItem.id == item_id)
            .where(AutopilotQueueItem.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_queue_items(
        self, config_id: int, user_id: int, status: Optional[str] = None, limit: int = 50, offset: int = 0,
    ) -> List[AutopilotQueueItem]:
        query = (
            select(AutopilotQueueItem)
            .where(AutopilotQueueItem.config_id == config_id)
            .where(AutopilotQueueItem.user_id == user_id)
        )
        if status:
            query = query.where(AutopilotQueueItem.status == status)
        query = query.order_by(AutopilotQueueItem.scheduled_for.asc()).limit(limit).offset(offset)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_pending_items(self, config_id: int, user_id: int) -> List[AutopilotQueueItem]:
        return await self.get_queue_items(config_id, user_id, status="pending")

    async def get_upcoming_items(self, config_id: int, user_id: int, days: int = 7) -> List[AutopilotQueueItem]:
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
        item = await self.get_queue_item(item_id, user_id)
        if not item:
            return None

        update_data = data.model_dump(exclude_unset=True)
        if "content" in update_data and update_data["content"] != item.content:
            item.edit_count += 1

        for field, value in update_data.items():
            if hasattr(value, 'value'):
                value = value.value
            setattr(item, field, value)

        item.updated_at = datetime.utcnow()
        await self.db.flush()
        await self.db.refresh(item)
        return item

    async def approve_item(
        self, item_id: int, user_id: int, publish_immediately: bool = False
    ) -> Optional[AutopilotQueueItem]:
        item = await self.get_queue_item(item_id, user_id)
        if not item:
            return None

        item.status = "approved"
        item.updated_at = datetime.utcnow()

        config = await self.get_config(item.config_id, user_id)
        if config:
            config.total_approved += 1
            if publish_immediately or config.auto_publish_on_approve:
                from app.services.publish_service import PublishService
                result = await PublishService(self.db).publish_queue_item(item, force=True)
                if not result.success:
                    logger.warning("Auto-publish failed for item %s: %s", item_id, result.error)

        await self.db.flush()
        await self.db.refresh(item)
        return item

    async def reject_item(
        self, item_id: int, user_id: int, notes: Optional[str] = None
    ) -> Optional[AutopilotQueueItem]:
        item = await self.get_queue_item(item_id, user_id)
        if not item:
            return None

        item.status = "rejected"
        if notes:
            item.user_notes = notes
        item.updated_at = datetime.utcnow()

        config = await self.get_config(item.config_id, user_id)
        if config:
            config.total_rejected += 1

        await self.db.flush()
        await self.db.refresh(item)
        return item

    async def delete_queue_item(self, item_id: int, user_id: int) -> bool:
        item = await self.get_queue_item(item_id, user_id)
        if not item:
            return False
        await self.db.delete(item)
        await self.db.flush()
        return True

    async def bulk_action(self, item_ids: List[int], user_id: int, action: str) -> Tuple[int, int]:
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
                logger.error("Bulk action error for item %s: %s", item_id, e)
                fail += 1

        return success, fail

    # === STATS ===

    async def get_queue_stats(self, config_id: int, user_id: int) -> QueueStatsResponse:
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=today_start.weekday())

        def _count_where(*extra):
            return (
                select(func.count(AutopilotQueueItem.id))
                .where(AutopilotQueueItem.config_id == config_id)
                .where(AutopilotQueueItem.user_id == user_id)
                .where(*extra)
            )

        pending_count = (await self.db.execute(_count_where(AutopilotQueueItem.status == "pending"))).scalar() or 0
        approved_count = (await self.db.execute(_count_where(AutopilotQueueItem.status == "approved"))).scalar() or 0
        scheduled_count = (await self.db.execute(_count_where(AutopilotQueueItem.status == "scheduled"))).scalar() or 0
        published_today = (await self.db.execute(_count_where(AutopilotQueueItem.status == "published", AutopilotQueueItem.published_at >= today_start))).scalar() or 0
        published_this_week = (await self.db.execute(_count_where(AutopilotQueueItem.status == "published", AutopilotQueueItem.published_at >= week_start))).scalar() or 0
        total_reviewed = (await self.db.execute(_count_where(AutopilotQueueItem.status.in_(["approved", "rejected", "published"])))).scalar() or 0
        rejected_count = (await self.db.execute(_count_where(AutopilotQueueItem.status == "rejected"))).scalar() or 0

        rejection_rate = (rejected_count / total_reviewed * 100) if total_reviewed > 0 else 0.0

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
        score = 100

        if stats.rejection_rate > 50:
            score -= 30
        elif stats.rejection_rate > 30:
            score -= 15
        elif stats.rejection_rate > 10:
            score -= 5

        if stats.average_edit_count > 3:
            score -= 20
        elif stats.average_edit_count > 2:
            score -= 10
        elif stats.average_edit_count > 1:
            score -= 5

        if config.streak_days >= 30:
            score += 10
        elif config.streak_days >= 7:
            score += 5

        if stats.published_this_week == 0 and config.is_active:
            score -= 15

        if stats.approved_count > 0:
            score += 5

        return max(0, min(100, score))

    def get_next_scheduled_time(self, config: AutopilotConfig):
        return self._gen.get_next_scheduled_time(config)

    # === GENERATION (delegated to GenerationService) ===

    async def generate_posts(
        self,
        config: AutopilotConfig,
        count: int = 1,
        topics: Optional[List[str]] = None,
        platforms: Optional[List[str]] = None,
    ) -> Tuple[List[AutopilotQueueItem], List[str]]:
        return await self._gen.generate_posts(config, count, topics, platforms)


def get_autopilot_service(db: AsyncSession) -> AutopilotService:
    return AutopilotService(db)
